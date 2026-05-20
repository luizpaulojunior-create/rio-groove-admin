import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
  console.log('--- PRODUCTS BUCKET FILES ---');
  // First, get the root level folders/files
  const { data: root, error: rootErr } = await supabase.storage.from('products').list('', { limit: 1000 });
  if (rootErr) {
    console.error('Error listing root:', rootErr);
    return;
  }
  
  console.log(`Found ${root.length} items in root`);
  
  let allFiles = [];
  
  // For each folder, list its contents
  for (const item of root) {
    if (!item.id) { // It's a folder
      const { data: folderFiles, error: folderErr } = await supabase.storage.from('products').list(item.name, { limit: 1000 });
      if (folderErr) {
        console.error(`Error listing folder ${item.name}:`, folderErr);
      } else {
        folderFiles.forEach(f => {
          if (f.id) { // It's a file
            allFiles.push(`${item.name}/${f.name}`);
          }
        });
      }
    } else {
      allFiles.push(item.name);
    }
  }
  
  console.log(`Total files found: ${allFiles.length}`);
  fs.writeFileSync('audit_products_bucket.json', JSON.stringify(allFiles, null, 2));
  console.log('Saved to audit_products_bucket.json');
}

run();
