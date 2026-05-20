const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log("Checking collections table...");
  const { data: cols, error: errCols } = await supabase.rpc('get_table_info', { table_name: 'collections' });
  
  if (errCols) {
    console.log("Error or RPC doesn't exist, falling back to simple select:", errCols);
    const { data: cData, error: cErr } = await supabase.from('collections').select('*').limit(1);
    console.log("Collections:", cErr || "Exists");
  } else {
    console.log("Columns:", cols);
  }

  console.log("Checking products table...");
  const { data: pData, error: pErr } = await supabase.from('products').select('*').limit(1);
  console.log("Products:", pErr || pData);
}

checkSchema();
