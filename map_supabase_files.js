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

async function listAllFiles(bucketName) {
  let allFiles = [];
  
  // List root
  const { data: rootData, error: rootError } = await supabase.storage.from(bucketName).list();
  if (rootError) return allFiles;
  
  for (const item of rootData) {
    if (!item.id) { // It's a folder
      const { data: folderData, error: folderError } = await supabase.storage.from(bucketName).list(item.name);
      if (!folderError && folderData) {
        folderData.forEach(f => {
          if (f.id) allFiles.push(`${item.name}/${f.name}`);
        });
      }
    } else {
      allFiles.push(item.name);
    }
  }
  return allFiles;
}

async function run() {
  const buckets = ['products', 'product-images', 'collections', 'images'];
  const allFiles = {};
  
  for (const b of buckets) {
    const files = await listAllFiles(b);
    allFiles[b] = files;
  }
  
  fs.writeFileSync('supabase_files_map.json', JSON.stringify(allFiles, null, 2));
  console.log('Done mapping files to supabase_files_map.json');
}

run();
