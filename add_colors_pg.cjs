const { Client } = require('pg');

async function applyFix() {
  try {
    const connectionString = "postgresql://postgres.cvpobvvkhcqasumhfwps:RioGroove@123!!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres";
    const client = new Client({ connectionString });
    await client.connect();

    console.log('Connected to DB');

    console.log('Adding colors column...');
    await client.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS colors jsonb DEFAULT '[]'::jsonb;");
    
    console.log('Schema updated successfully.');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

applyFix();
