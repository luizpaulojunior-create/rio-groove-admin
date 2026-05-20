const { Client } = require('pg');

async function testConn() {
  const connectionString = "postgresql://postgres.cvpobvvkhcqasumhfwps:RioGroove%40123%21%21@aws-0-sa-east-1.pooler.supabase.com:5432/postgres";
  try {
    const client = new Client({ connectionString });
    await client.connect();
    console.log('Connected to DB');
    await client.query("SELECT 1");
    console.log('Query successful');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}
testConn();
