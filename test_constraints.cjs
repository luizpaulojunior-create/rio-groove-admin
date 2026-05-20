const fs = require('fs');
const env = fs.readFileSync('../rio-groove-backend-final/rio-groove-backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=(.*)/);

const pg = require('pg');

async function test() {
  const client = new pg.Client({
    connectionString: "postgresql://postgres.cvpobvvkhcqasumhfwps:RioGroove@123!!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
  });
  
  await client.connect();
  
  const res = await client.query(`
    SELECT con.*
       FROM pg_catalog.pg_constraint con
            INNER JOIN pg_catalog.pg_class rel
                       ON rel.oid = con.conrelid
            INNER JOIN pg_catalog.pg_namespace nsp
                       ON nsp.oid = connamespace
       WHERE nsp.nspname = 'public'
             AND rel.relname = 'orders';
  `);
  
  console.log(res.rows);
  await client.end();
}

test();
