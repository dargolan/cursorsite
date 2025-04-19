const http = require('http');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log('Received request:', req.url);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Network test successful!');
});

// Try binding to localhost
const port = 9090;
const host = '127.0.0.1';

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
  console.log('Try accessing this URL in your browser');
}); 