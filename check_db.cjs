const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
  const { data: collections, error: errorC } = await supabase.from('collections').select('*').limit(1);
  console.log('Collections error:', errorC);
  console.log('Collections data:', collections);

  const { data: products, error: errorP } = await supabase.from('products').select('*').limit(1);
  console.log('Products error:', errorP);
  console.log('Products data:', products);
}

checkTables();
