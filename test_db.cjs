const { Client } = require('pg');

async function testConn() {
  try {
    const connectionString = "postgresql://postgres:RioGroove%40123%21%21@db.cvpobvvkhcqasumhfwps.supabase.co:5432/postgres";
    const client = new Client({ connectionString });
    await client.connect();
    console.log('Connected to DB directly');
    await client.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS colors jsonb DEFAULT '[]'::jsonb;");
    console.log('Added colors column');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}
testConn();
