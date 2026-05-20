const fs = require('fs');
const { Client } = require('pg');

async function applyFix() {
  try {
    const connectionString = "postgresql://postgres.cvpobvvkhcqasumhfwps:RioGroove@123!!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres";
    const client = new Client({ connectionString });
    await client.connect();

    console.log('Connected to DB');

    const sql = fs.readFileSync('./fix_schema.sql', 'utf8');
    
    console.log('Applying schema fix...');
    await client.query(sql);
    
    console.log('Schema updated successfully.');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

applyFix();
