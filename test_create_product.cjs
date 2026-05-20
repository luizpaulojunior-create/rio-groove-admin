const axios = require('axios');
const FormData = require('form-data');

async function testCreate() {
  try {
    const form = new FormData();
    form.append('name', 'Camisa Teste Final');
    form.append('description', 'Descrição da camisa teste');
    form.append('price', '99.90');
    form.append('stock', '10');
    form.append('category', 'Camisetas');
    form.append('active', 'true');
    
    console.log('Sending POST request...');
    const response = await axios.post('http://localhost:3001/api/products', form, {
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