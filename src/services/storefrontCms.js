/**
 * CMS Storefront — persistência centralizada em storefront_sections (Supabase).
 * Storefront v2 consome as mesmas tabelas via useStorefront (sem backend REST).
 */
import { supabase } from '../lib/supabase';

export const STOREFRONT_SECTION_KEYS = {
  HERO: 'hero',
  HEADER: 'header',
  NAVIGATION: 'navigation',
  BRANDING: 'branding',
  MOBILE: 'mobile-experience',
};

/** @returns {Promise<object|null>} */
export async function fetchStorefrontSection(sectionKey) {
  const { data, error } = await supabase
    .from('storefront_sections')
    .select('*')
    .eq('section_key', sectionKey)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
}

/** @returns {Promise<object[]>} */
export async function fetchAllStorefrontSections() {
  const { data, error } = await supabase
    .from('storefront_sections')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Upsert de seção CMS.
 * @returns {Promise<object>} registro salvo
 */
export async function saveStorefrontSection({
  sectionKey,
  type,
  content,
  id = null,
  orderIndex = 0,
  active = true,
}) {
  const payload = {
    section_key: sectionKey,
    type,
    content,
    active,
    order_index: orderIndex,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data, error } = await supabase
      .from('storefront_sections')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('storefront_sections')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Atualiza parcialmente uma seção existente (ex.: order_index). */
export async function updateStorefrontSection(id, patch) {
  const { data, error } = await supabase
    .from('storefront_sections')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Garante seção com order_index; cria stub se não existir. */
export async function ensureStorefrontSection({
  sectionKey,
  type,
  orderIndex,
  content = {},
}) {
  const existing = await fetchStorefrontSection(sectionKey);
  if (existing) {
    return updateStorefrontSection(existing.id, { order_index: orderIndex });
  }
  return saveStorefrontSection({
    sectionKey,
    type,
    content,
    orderIndex,
  });
}

// --- Landing Pages (tabela landing_pages) ---

/** @returns {Promise<object[]>} */
export async function fetchLandingPages() {
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      const err = new Error('Tabela landing_pages não existe. Execute supabase/fase4b_landing_pages.sql no Supabase.');
      err.code = 'LANDING_PAGES_TABLE_MISSING';
      throw err;
    }
    throw error;
  }
  return data || [];
}

/** @returns {Promise<object>} */
export async function saveLandingPage(payload, id = null) {
  const record = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from('landing_pages').update(record).eq('id', id);
    if (error) throw error;
    return { id, ...record };
  }

  const { data, error } = await supabase.from('landing_pages').insert([record]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLandingPage(id) {
  const { error } = await supabase.from('landing_pages').delete().eq('id', id);
  if (error) throw error;
}
