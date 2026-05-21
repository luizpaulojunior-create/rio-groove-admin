const fs = require('fs');
const { Client } = require('pg');

async function applyFix() {
  try {
    const envContent = fs.readFileSync('../rio-groove-backend-final/rio-groove-backend/.env', 'utf8');
    const match = envContent.match(/DATABASE_URL=(.*)/);
    
    if (!match) {
      console.error('DATABASE_URL not found in .env');
      return;
    }

    const client = new Client({ connectionString: match[1].trim() });
    await client.connect();

    console.log('Connected to DB');

    const sql = fs.readFileSync('./setup_rls.sql', 'utf8');
    
    console.log('Applying RLS policies...');
    await client.query(sql);
    
    console.log('RLS policies updated successfully.');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

applyFix();
