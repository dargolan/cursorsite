const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is running!');
});

server.listen(8000, '127.0.0.1', () => {
  console.log('Test server running on http://127.0.0.1:8000');
}); 