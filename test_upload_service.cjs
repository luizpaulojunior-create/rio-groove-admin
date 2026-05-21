require('dotenv').config({ path: '../rio-groove-backend-final/rio-groove-backend/.env' });
const { uploadImage } = require('../rio-groove-backend-final/rio-groove-backend/src/services/upload.service');

async function test() {
  const file = {
    originalname: 'test.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('test image data')
  };

  try {
    const url = await uploadImage(file, 'product-images');
    console.log('Success!', url);
  } catch (err) {
    console.error('Failed:', err);
  }
}

test();