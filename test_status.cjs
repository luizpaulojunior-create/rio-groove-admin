const fs = require('fs');
const env = fs.readFileSync('../rio-groove-backend-final/rio-groove-backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=(.*)/);
if(match) {
  const { Client } = require('pg');
  const client = new Client({connectionString: match[1].trim()});
  client.connect().then(async () => {
    try {
      const res = await client.query("SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = 'orders_status_check'");
      console.log('CONSTRAINT:', res.rows[0]);
    } catch(e) {
      console.error('QUERY ERROR:', e);
    }
    client.end();
  }).catch(e => console.error('CONN ERROR:', e));
}
