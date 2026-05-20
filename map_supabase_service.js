import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Using the service role key from the backend .env
const SUPABASE_URL = 'https://cvpobvvkhcqasumhfwps.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cG9idnZraGNxYXN1bWhmd3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxMTA5NiwiZXhwIjoyMDk0MTg3MDk2fQ.PgrY7MRWvJGOEZSuWhCRt7FSr4bTCeUZV_kSg-y3qBQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listAllFiles(bucketName) {
  let allFiles = [];
  
  const { data: rootData, error: rootError } = await supabase.storage.from(bucketName).list('', { limit: 1000 });
  if (rootError) {
    console.error(`Error listing bucket ${bucketName}:`, rootError.message);
    return allFiles;
  }
  
  for (const item of rootData) {
    if (!item.id) { // It's a folder
      const { data: folderData, error: folderError } = await supabase.storage.from(bucketName).list(item.name, { limit: 1000 });
      if (!folderError && folderData) {
        folderData.forEach(f => {
          if (f.id) allFiles.push(`${item.name}/${f.name}`);
        });
      }
    } else {
      allFiles.push(item.name);
    }
  }
  return allFiles;
}

async function run() {
  const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
  if (bucketsErr) {
    console.error('Error listing buckets:', bucketsErr);
    return;
  }
  
  console.log('Buckets:', buckets.map(b => b.name));
  const allFiles = {};
  
  for (const b of buckets) {
    const files = await listAllFiles(b.name);
    allFiles[b.name] = files;
  }
  
  fs.writeFileSync('supabase_files_map.json', JSON.stringify(allFiles, null, 2));
  console.log('Done mapping files to supabase_files_map.json');
}

run();
