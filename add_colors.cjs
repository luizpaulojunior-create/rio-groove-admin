require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_string: "ALTER TABLE products ADD COLUMN IF NOT EXISTS colors jsonb DEFAULT '[]'::jsonb;"
  });
  console.log('RPC Result:', error || 'Success');
}
run();
