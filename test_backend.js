import https from 'https';

const testCORS = () => {
  const options = {
    hostname: 'rio-groove-backend.onrender.com',
    path: '/api/health',
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET'
    }
  };

  const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
  });

  req.on('error', (e) => {
    console.error(e);
  });
  req.end();
};

const testHealth = () => {
  const options = {
    hostname: 'rio-groove-backend.onrender.com',
    path: '/api/health',
    method: 'GET'
  };

  const req = https.request(options, (res) => {
    console.log('Health Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Health Body:', data));
  });
  req.end();
}

testCORS();
testHealth();
