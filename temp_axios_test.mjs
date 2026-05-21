import axios from 'axios';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  if (config.data instanceof FormData) {
    // Remove Content-Type so browser sets it with the boundary!
    delete config.headers['Content-Type'];
  }
  console.log('Headers:', config.headers);
  return config;
});

const fd = new FormData();
fd.append('test', new Blob(['test payload'], { type: 'text/plain' }), 'test.txt');

api.post('http://httpbin.org/post', fd)
  .then(res => console.log(res.data.headers))
  .catch(e => console.log(e.message));
