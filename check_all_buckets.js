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
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  console.log('Buckets:', data.map(b => b.name));
  
  for (const b of data) {
    const { data: files, error: fErr } = await supabase.storage.from(b.name).list('', { limit: 10 });
    console.log(`Files in ${b.name}:`, fErr ? fErr.message : (files ? files.map(f => f.name) : 'none'));
  }
}

run();
