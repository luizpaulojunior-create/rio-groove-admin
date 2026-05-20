const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCollections() {
  const { data, error } = await supabase.from('collections').select('*').limit(1);
  console.log("Collections data:", data);
  console.log("Error:", error);
}

checkCollections();
