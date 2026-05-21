const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testCreate() {
  try {
    const form = new FormData();
    form.append('name', 'Camisa Teste Upload 2');
    form.append('description', 'Descrição da camisa teste');
    form.append('price', '99.90');
    form.append('stock', '10');
    form.append('category', 'Camisetas');
    form.append('active', 'true');
    
    // Add a mock file
    form.append('images', fs.createReadStream('test_image.jpg'), {
      filename: 'test_image.jpg',
      contentType: 'image/jpeg',
    });
    
    console.log('Sending POST request...');
    const response = await axios.post('https://rio-groove-backend.onrender.com/api/products', form, {
      headers: form.getHeaders(),
    });
    
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', error.response?.data);
    console.error(error.message);
  }
}

testCreate();