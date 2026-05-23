const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('storefront_sections')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching storefront_sections:', error);
  } else {
    console.log('storefront_sections data:', data);
  }

  const { data: cols, error: colsErr } = await supabase
    .rpc('get_columns', { table_name: 'storefront_sections' });

  console.log('Cols error:', colsErr);
  console.log('Cols:', cols);
}

checkSchema();
