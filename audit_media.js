import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.production
const envPath = path.resolve('.env.production');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('--- PRODUCTS ---');
  const { data: products, error: pErr } = await supabase.from('products').select('*');
  if (pErr) {
    console.error('Error fetching products:', pErr);
  } else {
    console.log(`Found ${products.length} products`);
    const localProducts = products.filter(p => 
      (p.image_url && p.image_url.includes('/images/')) || 
      (p.images && p.images.some(img => img.includes('/images/'))) ||
      (p.mockups && p.mockups.some(m => m.includes('/images/')))
    );
    console.log(`Products with local images: ${localProducts.length}`);
    
    // Save to a file for analysis
    fs.writeFileSync('audit_products.json', JSON.stringify(products, null, 2));
  }
  
  console.log('\n--- COLLECTIONS ---');
  const { data: collections, error: cErr } = await supabase.from('collections').select('*');
  if (cErr) {
    console.error('Error fetching collections:', cErr);
  } else {
    console.log(`Found ${collections.length} collections`);
    const localCollections = collections.filter(c => 
      (c.image_url && c.image_url.includes('/images/')) || 
      (c.banner_url && c.banner_url.includes('/images/'))
    );
    console.log(`Collections with local images: ${localCollections.length}`);
    
    fs.writeFileSync('audit_collections.json', JSON.stringify(collections, null, 2));
  }

  console.log('\n--- SUPABASE STORAGE (product-images) ---');
  const { data: files, error: fErr } = await supabase.storage.from('product-images').list('', { limit: 1000 });
  if (fErr) {
    console.error('Error fetching storage:', fErr);
  } else {
    console.log(`Found ${files.length} files in Supabase storage`);
    fs.writeFileSync('audit_storage.json', JSON.stringify(files.map(f => f.name), null, 2));
  }
}

run();
