#!/usr/bin/env node
/**
 * Test the exact webhook URL you mentioned
 */

const http = require('http');

function testWebhook(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5678,
      path: path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    console.log(`🧪 Testing: ${path}`);
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Response: ${data}`);
        resolve({ status: res.statusCode, response: data });
      });
    });

    req.on('error', (e) => {
      console.log(`  Error: ${e.message}`);
      resolve({ status: 'ERROR', response: e.message });
    });

    req.write(JSON.stringify({ test: true, source: 'direct-test' }));
    req.end();
  });
}

async function testExactWebhookURL() {
  console.log('🔍 Testing the exact webhook URL you mentioned...');
  console.log('=' .repeat(50));
  
  await testWebhook('/webhook-test/get-performance');
  
  console.log('\nFor comparison, also testing:');
  await testWebhook('/webhook/get-performance');
}

testExactWebhookURL();