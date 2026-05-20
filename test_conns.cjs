const { Client } = require('pg');

async function testConn(connectionString) {
  try {
    const client = new Client({ connectionString });
    await client.connect();
    console.log('Connected with:', connectionString);
    await client.query("SELECT 1");
    await client.end();
    return true;
  } catch (err) {
    console.error('Error with', connectionString, ':', err.message);
    return false;
  }
}

async function run() {
  const urls = [
    "postgresql://postgres:RioGroove%40123%21%21@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
    "postgresql://postgres.cvpobvvkhcqasumhfwps:RioGroove%40123%21%21@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
    "postgresql://postgres:RioGroove%40123%21%21@db.cvpobvvkhcqasumhfwps.supabase.co:5432/postgres"
  ];
  
  for (let url of urls) {
    if (await testConn(url)) break;
  }
}

run();
