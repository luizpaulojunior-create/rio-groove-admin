import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://cvpobvvkhcqasumhfwps.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cG9idnZraGNxYXN1bWhmd3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxMTA5NiwiZXhwIjoyMDk0MTg3MDk2fQ.PgrY7MRWvJGOEZSuWhCRt7FSr4bTCeUZV_kSg-y3qBQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BUCKET_URL = `${SUPABASE_URL}/storage/v1/object/public/product-images/`;

function convertUrl(url) {
  if (!url) return url;
  if (url.includes('/images/')) {
    const filename = url.split('/images/').pop().split('/').pop();
    return `${BUCKET_URL}${filename}`;
  }
  return url;
}

function convertArray(arr) {
  if (!arr || !Array.isArray(arr)) return arr;
  return arr.map(url => convertUrl(url));
}

async function updateProducts() {
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  for (const p of products) {
    let needsUpdate = false;
    const updates = {};

    if (p.image_url && p.image_url.includes('/images/')) {
      updates.image_url = convertUrl(p.image_url);
      needsUpdate = true;
    }

    if (p.images && p.images.some(u => u && u.includes('/images/'))) {
      updates.images = convertArray(p.images);
      needsUpdate = true;
    }

    if (p.mockups && p.mockups.some(u => u && u.includes('/images/'))) {
      updates.mockups = convertArray(p.mockups);
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log(`Updating product ${p.id}...`);
      const { error: updErr } = await supabase.from('products').update(updates).eq('id', p.id);
      if (updErr) console.error(`Error updating product ${p.id}:`, updErr);
    }
  }
  console.log('Finished updating products.');
}

async function updateCollections() {
  const { data: collections, error } = await supabase.from('collections').select('*');
  if (error) {
    console.error('Error fetching collections:', error);
    return;
  }

  for (const c of collections) {
    let needsUpdate = false;
    const updates = {};

    if (c.image_url && c.image_url.includes('/images/')) {
      updates.image_url = convertUrl(c.image_url);
      needsUpdate = true;
    }

    if (c.banner_url && c.banner_url.includes('/images/')) {
      updates.banner_url = convertUrl(c.banner_url);
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log(`Updating collection ${c.id}...`);
      const { error: updErr } = await supabase.from('collections').update(updates).eq('id', c.id);
      if (updErr) console.error(`Error updating collection ${c.id}:`, updErr);
    }
  }
  console.log('Finished updating collections.');
}

async function run() {
  await updateProducts();
  await updateCollections();
}

run();
