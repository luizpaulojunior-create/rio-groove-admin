/**
 * Fase 4C — Validação ProductForm + JWT (requer credenciais admin válidas).
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import FormData from 'form-data';

dotenv.config({ path: '../rio-groove-backend-final/rio-groove-backend/.env' });
dotenv.config({ path: '.env.production' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const API_URL = process.env.VITE_API_URL || 'https://rio-groove-backend.onrender.com/api';

const EMAIL = process.env.ADMIN_TEST_EMAIL;
const PASSWORD = process.env.ADMIN_TEST_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('Defina ADMIN_TEST_EMAIL e ADMIN_TEST_PASSWORD no ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);
const log = (ok, msg, d) => console.log(`${ok ? '✓' : '✗'} ${msg}${d ? ' — ' + JSON.stringify(d) : ''}`);

async function main() {
  console.log('\n=== FASE 4C — PRODUCTFORM / JWT ===\n');

  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authErr) {
    log(false, 'Login admin', authErr.message);
    console.log('Defina ADMIN_TEST_EMAIL/PASSWORD ou execute login manual.');
    process.exit(1);
  }
  log(true, 'Login admin', { email: auth.user.email });

  const { data: adminRow } = await supabase.from('admins').select('id').eq('id', auth.user.id).maybeSingle();
  log(!!adminRow, 'Usuário na tabela admins', {});

  const token = auth.session.access_token;

  const slug = `fase4c-probe-${Date.now()}`;
  const fd = new FormData();
  fd.append('name', 'Produto Fase 4C Probe');
  fd.append('slug', slug);
  fd.append('price', '99.90');
  fd.append('category', 'Camiseta');
  fd.append('shortDescription', 'Probe operacional Fase 4C');
  fd.append('description', 'Validação JWT create product');
  fd.append('colors', JSON.stringify(['Black']));
  fd.append('collections', '[]');

  const createRes = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, ...fd.getHeaders?.() },
    body: fd,
  });

  const createBody = await createRes.json().catch(() => ({}));
  if (!createRes.ok) {
    log(false, 'POST /api/products', { status: createRes.status, body: createBody });
    process.exit(1);
  }

  const productId = createBody.id || createBody.product?.id;
  log(true, 'POST /api/products', { status: createRes.status, id: productId, slug });

  const getRes = await fetch(`${API_URL}/products/${productId || slug}`);
  const getBody = await getRes.json().catch(() => ({}));
  log(getRes.ok, 'GET produto criado (público)', { status: getRes.status, name: getBody.name || getBody?.product?.name });

  if (productId) {
    const delRes = await fetch(`${API_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    log(delRes.ok || delRes.status === 204, 'DELETE probe product', { status: delRes.status });
  }

  console.log('\n=== FIM PRODUCTFORM ===\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
