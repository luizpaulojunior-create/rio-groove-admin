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

    console.log('Adding active column to collections...');
    await client.query(`
      ALTER TABLE collections ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
    `);
    
    console.log('Column active added successfully.');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

applyFix();
