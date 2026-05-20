import http from 'http';

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

async function testStockAPI() {
  const hostname = 'localhost';
  const port = 3000;
  
  console.log('1. GET /api/stock');
  let res = await makeRequest({
    hostname,
    port,
    path: '/api/stock',
    method: 'GET'
  });
  console.log('Status:', res.statusCode);
  console.log('Data:', res.data);

  console.log('\n2. POST /api/stock');
  const postData = {
    color: 'Red',
    size: 'M',
    quantity: 10,
    min_stock: 5,
    supplier: 'Supplier A',
    cost: 15.50,
    width: 2.0,
    height: 3.0
  };
  
  res = await makeRequest({
    hostname,
    port,
    path: '/api/stock',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, postData);
  console.log('Status:', res.statusCode);
  console.log('Data:', res.data);
}

testStockAPI();
