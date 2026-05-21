import axios from 'axios';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  if (config.data instanceof FormData) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
      config.headers.delete('content-type');
    } else {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }
  console.log('Headers before send:', config.headers);
  return config;
});

const fd = new FormData();
fd.append('test', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

api.post('http://httpbin.org/post', fd)
  .then(res => console.log('Final Headers received by server:', res.data.headers))
  .catch(e => console.log(e.message));
