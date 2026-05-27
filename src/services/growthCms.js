/**
 * CMS de crescimento — Newsletter, Afiliados, SEO global.
 */
import { supabase } from '../lib/supabase';
import {
  fetchStorefrontSection,
  saveStorefrontSection,
} from './storefrontCms';

export const GROWTH_SECTION_KEYS = {
  SEO: 'seo',
};

// --- Newsletter ---

export async function fetchNewsletterSubscribers() {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      const err = new Error('Tabela newsletter_subscribers ausente. Execute supabase/12_growth_tools.sql');
      err.code = 'NEWSLETTER_TABLE_MISSING';
      throw err;
    }
    throw error;
  }
  return data || [];
}

export async function saveNewsletterSubscriber(payload, id = null) {
  const email = String(payload.email || '').trim().toLowerCase();
  if (!email) throw new Error('E-mail obrigatório');

  const status = payload.status || 'active';
  const record = {
    email,
    name: payload.name?.trim() || null,
    source: payload.source || 'manual',
    status,
    accepts_marketing: status === 'active',
    updated_at: new Date().toISOString(),
    unsubscribed_at: status === 'unsubscribed' ? new Date().toISOString() : null,
  };

  if (id) {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw new Error(formatNewsletterError(error, 'atualizar'));
    }
    return data;
  }

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ ...record, subscribed_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este e-mail já está inscrito. Use Editar na lista.');
    }
    throw new Error(formatNewsletterError(error, 'adicionar'));
  }
  return data;
}

function formatNewsletterError(error, action) {
  if (error.code === '42501') {
    return `Sem permissão para ${action}. Execute supabase/17_newsletter_admin_fix.sql no Supabase.`;
  }
  return error.message || `Erro ao ${action} inscrito.`;
}

export async function deleteNewsletterSubscriber(id) {
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
  if (error) throw error;
}

export async function backfillNewsletterFromOrders() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('customer_email, customer_name, accepts_marketing')
    .eq('accepts_marketing', true);

  if (error) throw error;

  const seen = new Set();
  let inserted = 0;
  for (const order of orders || []) {
    const email = String(order.customer_email || '').trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    const { error: upsertError } = await supabase.from('newsletter_subscribers').upsert(
      {
        email,
        name: order.customer_name || null,
        source: 'checkout_backfill',
        status: 'active',
        accepts_marketing: true,
        subscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );
    if (!upsertError) inserted += 1;
  }
  return inserted;
}

// --- Afiliados ---

export async function fetchAffiliates() {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    if (error.code === '42P01') {
      const err = new Error('Tabela affiliates ausente. Execute supabase/12_growth_tools.sql');
      err.code = 'AFFILIATES_TABLE_MISSING';
      throw err;
    }
    throw error;
  }
  return data || [];
}

export async function fetchAffiliateStats() {
  const [affiliatesRes, clicksRes, ordersRes] = await Promise.all([
    supabase.from('affiliates').select('id, slug, name, commission_rate, active'),
    supabase.from('affiliate_clicks').select('affiliate_id'),
    supabase.from('orders').select('affiliate_id, affiliate_slug, total_amount, payment_status'),
  ]);

  if (affiliatesRes.error) throw affiliatesRes.error;

  const clicksByAffiliate = {};
  for (const row of clicksRes.data || []) {
    clicksByAffiliate[row.affiliate_id] = (clicksByAffiliate[row.affiliate_id] || 0) + 1;
  }

  const ordersByAffiliate = {};
  for (const row of ordersRes.data || []) {
    if (!row.affiliate_id) continue;
    if (!ordersByAffiliate[row.affiliate_id]) {
      ordersByAffiliate[row.affiliate_id] = { orders: 0, revenue: 0 };
    }
    ordersByAffiliate[row.affiliate_id].orders += 1;
    if (row.payment_status === 'approved' || row.payment_status === 'paid') {
      ordersByAffiliate[row.affiliate_id].revenue += Number(row.total_amount || 0);
    }
  }

  return (affiliatesRes.data || []).map((affiliate) => ({
    ...affiliate,
    clicks: clicksByAffiliate[affiliate.id] || 0,
    orders: ordersByAffiliate[affiliate.id]?.orders || 0,
    revenue: ordersByAffiliate[affiliate.id]?.revenue || 0,
  }));
}

export async function saveAffiliate(payload, id = null) {
  const record = {
    ...payload,
    slug: String(payload.slug || '').trim().toLowerCase(),
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { data, error } = await supabase
      .from('affiliates')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from('affiliates').insert([record]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAffiliate(id) {
  const { error } = await supabase.from('affiliates').delete().eq('id', id);
  if (error) throw error;
}

// --- SEO global ---

export async function fetchSeoSettings() {
  return fetchStorefrontSection(GROWTH_SECTION_KEYS.SEO);
}

export async function saveSeoSettings({ id, content }) {
  return saveStorefrontSection({
    id,
    sectionKey: GROWTH_SECTION_KEYS.SEO,
    type: 'seo',
    orderIndex: 8,
    content,
  });
}
