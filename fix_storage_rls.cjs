const fs = require('fs');
const { Client } = require('pg');

async function applyFix() {
  try {
    const client = new Client({
      host: 'aws-0-sa-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.cvpobvvkhcqasumhfwps',
      password: 'RioGroove@123!!',
    });
    await client.connect();

    console.log('Connected to DB');

    const sql = `
      -- Drop existing if any to avoid errors
      DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
      DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
      
      CREATE POLICY "Allow authenticated uploads"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'product-images');

      CREATE POLICY "Allow public read"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'product-images');

      CREATE POLICY "Allow authenticated updates"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'product-images');

      CREATE POLICY "Allow authenticated deletes"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'product-images');
    `;
    
    console.log('Applying storage RLS policies...');
    await client.query(sql);
    
    console.log('Storage RLS policies applied successfully.');
    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

applyFix();
