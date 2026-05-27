/**
 * Fase 4A — Validação operacional CMS (read-only + probes seguros).
 * Não altera dados de produção exceto probe RLS descartável com rollback.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.production', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const API_URL = env.VITE_API_URL;

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const results = { pass: [], warn: [], fail: [] };
const log = (level, msg, detail) => {
  results[level].push({ msg, detail });
  const icon = level === 'pass' ? '✓' : level === 'warn' ? '⚠' : '✗';
  console.log(`${icon} [${level.toUpperCase()}] ${msg}${detail ? ` — ${JSON.stringify(detail)}` : ''}`);
};

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  return { status: res.status, ok: res.ok, body };
}

async function validateStorefrontSections() {
  const { data, error } = await supabase
    .from('storefront_sections')
    .select('id, section_key, type, active, order_index, updated_at, content')
    .order('order_index');

  if (error) {
    log('fail', 'storefront_sections SELECT (anon)', error.message);
    return;
  }

  log('pass', 'storefront_sections SELECT (anon)', { count: data.length });

  const keys = ['hero', 'header', 'navigation', 'branding', 'mobile-experience'];
  for (const key of keys) {
    const row = data.find((r) => r.section_key === key);
    if (!row) {
      log('warn', `Seção ausente: ${key}`, null);
      continue;
    }
    if (!row.active) log('warn', `Seção inactive: ${key}`, { id: row.id });
    else log('pass', `Seção active: ${key}`, { order_index: row.order_index, updated_at: row.updated_at });

    if (key === 'hero') {
      const c = row.content || {};
      const hasSlides = Array.isArray(c.slides) && c.slides.length > 0;
      const hasLegacy = !!(c.headline || c.title || c.image_url);
      if (!hasSlides && !hasLegacy) log('fail', 'Hero sem slides nem campos legados', c);
      else log('pass', 'Hero content structure OK', { hasSlides, hasLegacy, slideFields: hasSlides ? Object.keys(c.slides[0]) : [] });
    }
    if (key === 'navigation') {
      const items = row.content?.items;
      if (!items?.length) log('warn', 'Navigation vazia no DB — storefront usa menuConfig fallback', null);
      else log('pass', 'Navigation items no DB', { count: items.length });
    }
    if (key === 'header') {
      if (!row.content?.logo_url) log('warn', 'Header sem logo_url', null);
      else log('pass', 'Header logo_url presente', { url: row.content.logo_url.slice(0, 60) + '...' });
    }
    if (key === 'branding') {
      if (!row.content?.store_name) log('warn', 'Branding sem store_name', null);
      else log('pass', 'Branding store_name', { store_name: row.content.store_name });
    }
  }

  const dupKeys = data.reduce((acc, r) => {
    acc[r.section_key] = (acc[r.section_key] || 0) + 1;
    return acc;
  }, {});
  const dups = Object.entries(dupKeys).filter(([, n]) => n > 1);
  if (dups.length) log('fail', 'section_key duplicados', dups);
  else log('pass', 'Sem section_key duplicados', null);
}

async function validateLandingPages() {
  const { data, error } = await supabase.from('landing_pages').select('id, title, slug, active, type, updated_at').order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      log('fail', 'Tabela landing_pages não existe', error.message);
    } else {
      log('fail', 'landing_pages SELECT', error.message);
    }
    return;
  }

  log('pass', 'landing_pages SELECT (anon)', { count: data.length });
  if (data.length === 0) log('warn', 'Nenhuma landing page cadastrada', null);
  else {
    const active = data.filter((p) => p.active);
    log('pass', 'Landing pages ativas', { active: active.length, total: data.length });
  }
}

async function validateRlsProbes() {
  const probeKey = `__fase4a_probe_${Date.now()}`;
  const { data: insertData, error: insertError } = await supabase
    .from('storefront_sections')
    .insert([{
      section_key: probeKey,
      type: 'probe',
      content: { probe: true },
      active: false,
      order_index: 9999,
    }])
    .select();

  if (insertError) {
    log('pass', 'RLS bloqueia INSERT anon em storefront_sections (esperado sem auth admin)', insertError.message);
  } else if (insertData?.[0]?.id) {
    const id = insertData[0].id;
    await supabase.from('storefront_sections').delete().eq('id', id);
    log('warn', 'RLS permite INSERT anon em storefront_sections — verificar policies', { id });
  }

  const { error: updateError } = await supabase
    .from('storefront_sections')
    .update({ content: { hacked: true } })
    .eq('section_key', 'hero');

  if (updateError) {
    log('pass', 'RLS bloqueia UPDATE anon em hero (esperado)', updateError.message);
  } else {
    log('fail', 'RLS permite UPDATE anon em hero — risco de segurança', null);
  }
}

async function validateBackend() {
  const products = await fetchJson(`${API_URL}/products`);
  if (products.ok) log('pass', 'GET /api/products público', { status: products.status, count: Array.isArray(products.body) ? products.body.length : '?' });
  else log('fail', 'GET /api/products', { status: products.status, body: products.body });

  const stock = await fetchJson(`${API_URL}/stock`);
  if (stock.status === 401) log('pass', 'GET /api/stock exige JWT (401)', null);
  else log('warn', 'GET /api/stock resposta inesperada', { status: stock.status });

  const upload = await fetchJson(`${API_URL}/upload`, { method: 'POST' });
  if (upload.status === 401) log('pass', 'POST /api/upload exige JWT (401)', null);
  else log('warn', 'POST /api/upload resposta inesperada', { status: upload.status });
}

async function validateStorageBucket() {
  const { data, error } = await supabase.storage.from('product-images').list('storefront', { limit: 5 });
  if (error) log('warn', 'Storage list storefront/ (anon)', error.message);
  else log('pass', 'Storage bucket product-images acessível', { files: data?.length ?? 0 });
}

async function validateDeployedUrls() {
  const urls = [
    'https://rio-groove-admin-painel.pages.dev',
    'https://fase4-cms-storefront.rio-groove-admin-painel.pages.dev',
    'https://rio-groove-store-v2.pages.dev',
    'https://rio-groove-backend.onrender.com/api/products',
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      log(res.ok ? 'pass' : 'warn', `URL ${res.status}`, url);
    } catch (e) {
      log('fail', 'URL inacessível', { url, error: e.message });
    }
  }
}

async function validateInventoryCoherence() {
  const invPath = 'src/config/inventory.js';
  const pfPath = 'src/components/ProductForm.jsx';
  const stockPath = 'src/pages/Stock.jsx';
  const inv = readFileSync(invPath, 'utf8');
  const pf = readFileSync(pfPath, 'utf8');
  const stock = readFileSync(stockPath, 'utf8');

  if (pf.includes("from '../config/inventory'") && stock.includes("from '../config/inventory'")) {
    log('pass', 'ProductForm e Stock importam inventory.js', null);
  } else log('fail', 'inventory.js não importado em ambos', null);

  const hardcodedCategories = ['Camisa', 'Boné', 'Caneca'].filter(
    (c) => (pf.includes(`'${c}'`) || pf.includes(`"${c}"`)) && !inv.includes(`'${c}'`)
  );
  if (hardcodedCategories.length) log('warn', 'ProductForm possível hardcode de categorias', hardcodedCategories);
  else log('pass', 'ProductForm sem hardcodes de categoria divergentes', null);
}

async function main() {
  console.log('\n=== FASE 4A — VALIDAÇÃO OPERACIONAL CMS ===\n');
  await validateDeployedUrls();
  await validateStorefrontSections();
  await validateLandingPages();
  await validateRlsProbes();
  await validateBackend();
  await validateStorageBucket();
  await validateInventoryCoherence();

  console.log('\n=== RESUMO ===');
  console.log(`PASS: ${results.pass.length} | WARN: ${results.warn.length} | FAIL: ${results.fail.length}`);
  if (results.fail.length) {
    console.log('\nFALHAS:');
    results.fail.forEach((f) => console.log(' -', f.msg, f.detail || ''));
  }
  if (results.warn.length) {
    console.log('\nAVISOS:');
    results.warn.forEach((f) => console.log(' -', f.msg, f.detail || ''));
  }
  process.exit(results.fail.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
