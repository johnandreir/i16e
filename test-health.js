import http from 'http';

console.log('=== Testing Health Endpoint ===');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Health Status: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Health Response:', body);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('Health Request Error:', err);
  process.exit(1);
});

req.end();