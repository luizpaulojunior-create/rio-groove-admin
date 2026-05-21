import axios from 'axios';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

const fd = new FormData();
fd.append('test', new Blob(['test payload'], { type: 'text/plain' }), 'test.txt');

api.post('http://httpbin.org/post', fd, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})
  .then(res => console.log(res.data.headers))
  .catch(e => console.log(e.message));
