#!/usr/bin/env node
/**
 * Test N8N Webhook after activation
 */

const http = require('http');

function testWebhook(url, method = 'POST') {
  return new Promise((resolve) => {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (url.startsWith('http://localhost:5678')) {
      options.hostname = 'localhost';
      options.port = 5678;
      options.path = url.replace('http://localhost:5678', '');
    } else {
      options.hostname = 'localhost';
      options.port = 3001;
      options.path = url.replace('http://localhost:3001', '');
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        status: 'ERROR',
        error: e.message
      });
    });

    // Send minimal test data for webhook
    if (method === 'POST') {
      req.write(JSON.stringify({ test: true }));
    }
    req.end();
  });
}

async function testWorkflowActivation() {
  console.log('🔍 Testing N8N Webhook Registration');
  console.log('=' .repeat(50));

  // Test direct N8N webhook
  console.log('\n📡 Testing Direct N8N Webhook:');
  const directTest = await testWebhook('http://localhost:5678/webhook/get-performance');
  console.log(`  Status: ${directTest.status}`);
  
  if (directTest.status === 404) {
    console.log('  ❌ Webhook not registered - workflow needs to be activated in N8N');
    console.log('  💡 Go to http://localhost:5678 and activate the workflow');
  } else if (directTest.status === 200 || directTest.status === 400) {
    console.log('  ✅ Webhook is registered and active!');
  } else if (directTest.error) {
    console.log(`  ❌ Connection error: ${directTest.error}`);
  }

  // Test API proxy
  console.log('\n🔄 Testing API Proxy:');
  const proxyTest = await testWebhook('http://localhost:3001/api/n8n/get-cases');
  console.log(`  Status: ${proxyTest.status}`);
  
  if (proxyTest.status === 200) {
    console.log('  ✅ API proxy working correctly!');
  } else {
    console.log('  ❌ API proxy issue - check API server logs');
  }

  // Test health status after activation
  console.log('\n🏥 Re-checking Health Status:');
  const healthTest = await testWebhook('http://localhost:3001/api/health', 'GET');
  if (healthTest.status === 200) {
    try {
      const health = JSON.parse(healthTest.data);
      const workflowStatus = health.n8nHealth?.n8nWorkflowStatus;
      const webhookStatus = health.n8nHealth?.n8nWebhookStatus?.getPerformance;
      
      console.log(`  Workflows: ${workflowStatus?.activeCount || 0} active out of ${workflowStatus?.totalCount || 0} total`);
      console.log(`  Webhook: ${webhookStatus?.reachable ? 'Active' : 'Inactive'} (${webhookStatus?.message || 'unknown'})`);
    } catch (e) {
      console.log('  ❌ Could not parse health data');
    }
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. If webhook shows 404, go to http://localhost:5678');
  console.log('2. Import the workflow from "Get cases.json"');
  console.log('3. Activate the workflow (toggle switch)');
  console.log('4. Re-run this test to verify');
}

testWorkflowActivation();