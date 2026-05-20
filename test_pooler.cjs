const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.cvpobvvkhcqasumhfwps',
    password: 'RioGroove@123!!',
  });
  try {
    await client.connect();
    console.log('Connected!');
    await client.query(`
      ALTER TABLE collections ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
      ALTER TABLE collections ADD COLUMN IF NOT EXISTS slug TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_id UUID;
    `);
    console.log('Columns added!');
    
    // Check if fk exists, if not add it
    const res = await client.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_collection'
    `);
    if (res.rows.length === 0) {
      await client.query(`
        ALTER TABLE products
        ADD CONSTRAINT fk_products_collection
        FOREIGN KEY (collection_id) REFERENCES collections(id)
        ON DELETE SET NULL;
      `);
      console.log('FK added!');
    }
    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
