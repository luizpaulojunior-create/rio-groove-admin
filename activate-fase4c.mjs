/**
 * Fase 4C — Ativação operacional CMS (service role para seed navigation).
 * Migration landing_pages: requer SQL Editor ou DATABASE_URL (DDL).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { NAVIGATION_SEED_ITEMS } from './src/config/navigationSeed.js';

dotenv.config({ path: '../rio-groove-backend-final/rio-groove-backend/.env' });
dotenv.config({ path: '.env.production' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY ausente no backend .env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

const log = (ok, msg, detail) => console.log(`${ok ? '✓' : '✗'} ${msg}${detail ? ' — ' + JSON.stringify(detail) : ''}`);

async function checkLandingPages() {
  const { error } = await anon.from('landing_pages').select('id').limit(1);
  if (error?.message?.includes('does not exist') || error?.code === '42P01') {
    log(false, 'landing_pages: tabela ausente — execute supabase/fase4b_landing_pages.sql no SQL Editor');
    return false;
  }
  if (error) {
    log(false, 'landing_pages: erro', error.message);
    return false;
  }
  const { count } = await admin.from('landing_pages').select('*', { count: 'exact', head: true });
  log(true, 'landing_pages: tabela OK', { rows: count });
  return true;
}

async function seedNavigation() {
  const { data: existing } = await admin
    .from('storefront_sections')
    .select('id, section_key')
    .eq('section_key', 'navigation')
    .maybeSingle();

  if (existing) {
    log(true, 'navigation: já existe', { id: existing.id });
    return existing;
  }

  const { data, error } = await admin
    .from('storefront_sections')
    .insert([{
      section_key: 'navigation',
      type: 'navigation_config',
      content: { items: NAVIGATION_SEED_ITEMS },
      active: true,
      order_index: 5,
    }])
    .select()
    .single();

  if (error) {
    log(false, 'navigation: falha ao inserir', error.message);
    return null;
  }
  log(true, 'navigation: seed aplicado', { id: data.id, items: NAVIGATION_SEED_ITEMS.length });
  return data;
}

async function validateCmsSections() {
  const { data, error } = await anon
    .from('storefront_sections')
    .select('section_key, active, order_index')
    .eq('active', true)
    .order('order_index');

  if (error) {
    log(false, 'storefront_sections', error.message);
    return;
  }

  log(true, 'storefront_sections (anon active)', { count: data.length, keys: data.map((r) => r.section_key) });

  const nav = data.find((r) => r.section_key === 'navigation');
  if (nav) log(true, 'navigation consumível pela storefront', { order_index: nav.order_index });
  else log(false, 'navigation ausente para storefront');
}

async function testLandingPagesRls() {
  const probeSlug = `fase4c-probe-${Date.now()}`;
  const { data: inserted, error: insErr } = await admin.from('landing_pages').insert([{
    title: 'Fase 4C Probe',
    slug: probeSlug,
    active: true,
    type: 'collection',
  }]).select().single();

  if (insErr) {
    log(false, 'landing_pages insert (service role)', insErr.message);
    return;
  }

  const { data: anonRead } = await anon.from('landing_pages').select('slug').eq('slug', probeSlug).maybeSingle();
  log(!!anonRead, 'landing_pages leitura anon active=true', { slug: probeSlug });

  const { data: anonInactive } = await admin.from('landing_pages').update({ active: false }).eq('id', inserted.id).select().single();
  const { data: anonHidden } = await anon.from('landing_pages').select('id').eq('slug', probeSlug).maybeSingle();
  log(!anonHidden, 'landing_pages anon não vê inactive', {});

  await admin.from('landing_pages').delete().eq('id', inserted.id);
  log(true, 'landing_pages probe removido', {});
}

async function validateBackend() {
  const api = process.env.VITE_API_URL || 'https://rio-groove-backend.onrender.com/api';
  const products = await fetch(`${api}/products`);
  log(products.ok, 'GET /api/products', { status: products.status });
  const stock = await fetch(`${api}/stock`);
  log(stock.status === 401, 'GET /api/stock exige JWT', { status: stock.status });
}

async function main() {
  console.log('\n=== FASE 4C — ATIVAÇÃO OPERACIONAL CMS ===\n');
  const hasLanding = await checkLandingPages();
  await seedNavigation();
  await validateCmsSections();
  if (hasLanding) await testLandingPagesRls();
  await validateBackend();
  console.log('\n=== FIM ===\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
