import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cvpobvvkhcqasumhfwps.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cG9idnZraGNxYXN1bWhmd3BzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxMTA5NiwiZXhwIjoyMDk0MTg3MDk2fQ.PgrY7MRWvJGOEZSuWhCRt7FSr4bTCeUZV_kSg-y3qBQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BUCKET_URL = `${SUPABASE_URL}/storage/v1/object/public/product-images/`;

function convertUrl(url) {
  if (!url) return url;
  if (url.includes('/images/')) {
    const filename = url.split('/images/').pop().split('/').pop();
    return `${BUCKET_URL}${filename}`;
  }
  return url;
}

async function updateProductImages() {
  console.log('Fetching product_images...');
  const { data: images, error } = await supabase.from('product_images').select('*');
  if (error) {
    console.error('Error fetching product_images:', error);
    return;
  }

  let updatedCount = 0;
  for (const img of images) {
    if (img.image_url && img.image_url.includes('/images/')) {
      const newUrl = convertUrl(img.image_url);
      console.log(`Updating image ${img.id} from ${img.image_url} to ${newUrl}`);
      const { error: updErr } = await supabase.from('product_images').update({ image_url: newUrl }).eq('id', img.id);
      if (updErr) {
        console.error(`Error updating image ${img.id}:`, updErr);
      } else {
        updatedCount++;
      }
    }
  }
  console.log(`Finished updating product_images. Updated ${updatedCount} records.`);
}

updateProductImages();
