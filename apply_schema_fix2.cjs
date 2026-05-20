const { Client } = require('pg');

async function testConn() {
  try {
    const connectionString = "postgresql://postgres.cvpobvvkhcqasumhfwps:RioGroove@123!!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres";
    const client = new Client({ connectionString });
    await client.connect();
    console.log('Connected to DB');
    
    const sql = `
ALTER TABLE collections ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_collection') THEN
        ALTER TABLE products
            ADD CONSTRAINT fk_products_collection
            FOREIGN KEY (collection_id) REFERENCES collections(id)
            ON DELETE SET NULL;
    END IF;
END $$;
`;
    await client.query(sql);
    console.log('Schema updated successfully');

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}
testConn();
