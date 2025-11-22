const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/pagos/check-reference?referencia=123456', // Assuming 123456 might exist or I can test with a known one
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
