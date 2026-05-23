const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '../rio-groove-backend-final/rio-groove-backend/.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking stock_items table...');
  const { data, error } = await supabase.from('stock_items').select('*');
  if (error) {
    console.error('Error fetching stock_items:', error);
  } else {
    console.log(`Found ${data.length} rows.`);
    if (data.length > 0) {
      console.log('First row columns:', Object.keys(data[0]));
      console.log('First row data:', data[0]);
    }
  }
}

check();
