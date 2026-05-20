const { createClient } = require('@supabase/supabase-js');

const url = 'https://cvpobvvkhcqasumhfwps.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cG9idnZraGNxYXN1bWhmd3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxMTA5NiwiZXhwIjoyMDk0MTg3MDk2fQ.PgrY7MRWvJGOEZSuWhCRt7FSr4bTCeUZV_kSg-y3qBQ';

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.storage.getBucket('product-images');
  console.log('Bucket data:', data);
  if (error) console.error('Error:', error);
}

check();