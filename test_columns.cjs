const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvpobvvkhcqasumhfwps.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cG9idnZraGNxYXN1bWhmd3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxMTA5NiwiZXhwIjoyMDk0MTg3MDk2fQ.PgrY7MRWvJGOEZSuWhCRt7FSr4bTCeUZV_kSg-y3qBQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.rpc('get_schema_info'); // Just testing if we can do something, but actually we can just fetch one row and get keys
  
  const { data: rows } = await supabase.from('orders').select('*').limit(1);
  if (rows && rows.length > 0) {
    console.log('Columns:', Object.keys(rows[0]));
  }
}

test();
