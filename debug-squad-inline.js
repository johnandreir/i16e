import { spawn } from 'child_process';
import http from 'http';

console.log('=== Inline Squad Debug Test ===');

// Start the server
console.log('1. Starting MongoDB API server...');
const serverProcess = spawn('node', ['mongodb-api-server.cjs'], {
  stdio: 'pipe'
});

serverProcess.stdout.on('data', (data) => {
  console.log('SERVER:', data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
  console.error('SERVER ERROR:', data.toString().trim());
});

// Wait for server to start then test
setTimeout(async () => {
  console.log('\n2. Testing squad creation...');
  
  try {
    // Test squad creation
    const squadData = JSON.stringify({
      name: 'Test Squad Inline',
      teamID: '68d13a862bd5b13618770741'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/squads',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(squadData)
      }
    };

    const req = http.request(options, (res) => {
      console.log(`Response Status: ${res.statusCode}`);
      console.log('Response Headers:', res.headers);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log('Response Body:', body);
        
        // Kill server and exit
        console.log('\n3. Shutting down...');
        serverProcess.kill('SIGINT');
        setTimeout(() => process.exit(0), 2000);
      });
    });

    req.on('error', (err) => {
      console.error('Request Error:', err);
      serverProcess.kill('SIGINT');
      process.exit(1);
    });

    req.write(squadData);
    req.end();
    
  } catch (error) {
    console.error('Test Error:', error);
    serverProcess.kill('SIGINT');
    process.exit(1);
  }
}, 3000); // Wait 3 seconds for server to start