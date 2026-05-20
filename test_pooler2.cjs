const { Client } = require('pg');

async function test(port) {
  const connectionString = `postgresql://postgres.cvpobvvkhcqasumhfwps:RioGroove%40123%21%21@aws-0-sa-east-1.pooler.supabase.com:${port}/postgres`;
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`Connected on port ${port}`);
    await client.end();
  } catch (err) {
    console.error(`Error on port ${port}:`, err.message);
  }
}

async function run() {
  await test(5432);
  await test(6543);
}

run();