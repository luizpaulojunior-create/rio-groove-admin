const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function testUpload() {
  fs.writeFileSync('test-image.jpg', Buffer.from('fake image data'));
  const form = new FormData();
  form.append('file', fs.createReadStream('test-image.jpg'));
  form.append('bucket', 'product-images');
  form.append('path', 'storefront/hero');
  try {
    const res = await axios.post('http://localhost:3000/api/upload', form, { 
      headers: form.getHeaders() 
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}
testUpload();
