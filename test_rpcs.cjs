const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cvpobvvkhcqasumhfwps.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cG9idnZraGNxYXN1bWhmd3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxMTA5NiwiZXhwIjoyMDk0MTg3MDk2fQ.PgrY7MRWvJGOEZSuWhCRt7FSr4bTCeUZV_kSg-y3qBQ';

async function getOpenAPI() {
  const res = await fetch(supabaseUrl + '/rest/v1/?apikey=' + supabaseKey);
  const data = await res.json();
  console.log('Available RPCs:', Object.keys(data.paths).filter(p => p.startsWith('/rpc/')));
}

getOpenAPI();
