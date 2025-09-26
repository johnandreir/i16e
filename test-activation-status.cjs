#!/usr/bin/env node
/**
 * Test webhook after N8N workflow activation
 */

const http = require('http');

function testWebhook() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5678,
      path: '/webhook-test/get-performance',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    console.log('🧪 Testing webhook after activation...');
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`📡 Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log('✅ SUCCESS! Webhook is now active and listening');
          console.log('📄 Response:', data);
        } else if (res.statusCode === 404) {
          console.log('❌ Still not activated. Check N8N workflow activation:');
          console.log('   1. Go to http://localhost:5678');
          console.log('   2. Find the workflow with get-performance webhook');
          console.log('   3. Click the activation toggle (turn ON)');
          console.log('   4. Verify webhook path is "get-performance"');
        } else {
          console.log(`⚠️ Unexpected response: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log('❌ Connection failed:', e.message);
      resolve();
    });

    req.write(JSON.stringify({ 
      test: true,
      source: 'activation-verification',
      timestamp: new Date().toISOString()
    }));
    req.end();
  });
}

testWebhook().then(() => {
  console.log('\n💡 Once the webhook is active:');
  console.log('   • The "Generate Report" button will work');
  console.log('   • N8N will process the workflow');
  console.log('   • Data will be generated in the database');
});