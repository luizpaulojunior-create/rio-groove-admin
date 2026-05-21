const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function runTest() {
  console.log('Starting backend server...');
  const backendDir = path.join(__dirname, '../rio-groove-backend-final/rio-groove-backend');
  
  const server = spawn('node', ['src/server.js'], {
    cwd: backendDir,
    env: { ...process.env, PORT: '3005' }
  });

  server.stdout.on('data', (data) => {
    console.log(`[BACKEND STDOUT]: ${data}`);
  });

  server.stderr.on('data', (data) => {
    console.log(`[BACKEND STDERR]: ${data}`);
  });

  // Wait 3 seconds for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const form = new FormData();
    form.append('name', 'Camisa Teste Upload Local');
    form.append('description', 'Descrição da camisa teste');
    form.append('price', '99.90');
    form.append('stock', '10');
    form.append('category', 'Camisetas');
    form.append('active', 'true');
    
    form.append('images', fs.createReadStream('test_image.jpg'), {
      filename: 'test_image.jpg',
      contentType: 'image/jpeg',
    });
    
    console.log('Sending POST request to local server...');
    const response = await axios.post('http://localhost:3005/api/products', form, {
      headers: form.getHeaders(),
    });
    
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', error.response?.data);
    console.error(error.message);
  } finally {
    console.log('Killing backend server...');
    server.kill();
  }
}

runTest();
