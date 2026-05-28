require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.storage.getBucket('product-images');
  console.log('Bucket data:', data);
  if (error) console.error('Error:', error);
}

check();
