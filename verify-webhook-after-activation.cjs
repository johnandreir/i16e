#!/usr/bin/env node
/**
 * Quick webhook verification after N8N workflow activation
 */

const http = require('http');

function testWebhook() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5678,
      path: '/webhook/get-performance',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`📡 Direct N8N webhook test: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log('✅ Webhook is now registered and working!');
          console.log('📄 Response:', data);
        } else if (res.statusCode === 404) {
          console.log('❌ Webhook still not registered - check N8N workflow activation');
        } else {
          console.log('⚠️ Unexpected response:', data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log('❌ Connection failed:', e.message);
      resolve();
    });

    req.write(JSON.stringify({ test: true }));
    req.end();
  });
}

console.log('🔍 Quick webhook verification...');
console.log('After activating the N8N workflow, this should return 200 instead of 404\n');

testWebhook().then(() => {
  console.log('\n💡 If still showing 404:');
  console.log('   1. Go to http://localhost:5678');
  console.log('   2. Import the workflow from "Get cases.json"');
  console.log('   3. Activate the workflow (toggle switch)'); 
  console.log('   4. Ensure webhook path is "get-performance"');
});