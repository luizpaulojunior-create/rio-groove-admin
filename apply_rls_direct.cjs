const fs = require('fs');
const { Client } = require('pg');

async function applyFix() {
  try {
    const connectionString = "postgresql://postgres.cvpobvvkhcqasumhfwps:RioGroove%40123%21%21@aws-0-sa-east-1.pooler.supabase.com:6543/postgres";

    const client = new Client({ connectionString });
    await client.connect();

    console.log('Connected to DB');

    const sql = fs.readFileSync('./setup_rls.sql', 'utf8');
    
    console.log('Applying RLS policies...');
    await client.query(sql);
    
    console.log('RLS policies updated successfully.');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

applyFix();