import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://cvpobvvkhcqasumhfwps.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cG9idnZraGNxYXN1bWhmd3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxMTA5NiwiZXhwIjoyMDk0MTg3MDk2fQ.PgrY7MRWvJGOEZSuWhCRt7FSr4bTCeUZV_kSg-y3qBQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const images = JSON.parse(fs.readFileSync('found_images.json', 'utf8'));
const uniqueImages = {};

images.forEach(imgPath => {
  const filename = imgPath.split('\\').pop().split('/').pop();
  if (!uniqueImages[filename] && 
      !imgPath.includes('images (1).jpg') && 
      !imgPath.includes('images.jpg') && 
      (imgPath.includes('images') || imgPath.includes('assets'))) {
    uniqueImages[filename] = imgPath;
  }
});

async function uploadFiles() {
  console.log(`Found ${Object.keys(uniqueImages).length} unique images to upload.`);
  for (const [filename, filepath] of Object.entries(uniqueImages)) {
    console.log(`Uploading ${filename}...`);
    try {
      const fileBuffer = fs.readFileSync(filepath);
      const contentType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const { data, error } = await supabase.storage.from('product-images').upload(filename, fileBuffer, {
        contentType,
        upsert: true
      });
      if (error) {
        console.error(`Error uploading ${filename}:`, error.message);
      } else {
        console.log(`Success: ${filename}`);
      }
    } catch (err) {
      console.error(`Error reading ${filename} from ${filepath}:`, err.message);
    }
  }
  console.log('All uploads completed.');
}

uploadFiles();
