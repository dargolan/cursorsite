const net = require('net');

// Create a simple TCP server
const server = net.createServer((socket) => {
  console.log('Client connected');
  socket.write('Hello from server\r\n');
  socket.pipe(socket);
});

// Handle errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Try binding to any available port on localhost
server.listen(0, '127.0.0.1', () => {
  const address = server.address();
  console.log(`Server listening on ${address.address}:${address.port}`);
}); 