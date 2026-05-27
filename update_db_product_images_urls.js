import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

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
