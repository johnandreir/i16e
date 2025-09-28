/**
 * Workflow Status Checker
 * Run this script after updating your workflows in the n8n interface
 * to verify they are properly activated and webhooks are registered
 */
const http = require('http');

// Configuration
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOTMwOTc1Mi01M2M2LTQxNTUtYTQxZi03NmNhYmJmOWJiZWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU4OTkyNDAzLCJleHAiOjE3NjE1MjMyMDB9.-PHWM4_1ZW4v4XZtdhOyz9c-P6WwfjcqUFPTmLjxWHw';
const WORKFLOW_IDS = {
  'Eureka API': 'ulgP4TQ9fUOcEuWF',
  'Calculate metrics': 'VaX3w979KjLLcgNY'
};

// Helper function for HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = responseData ? JSON.parse(responseData) : {};
          resolve({ statusCode: res.statusCode, body: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Check workflow status
async function checkWorkflowStatus(name, id) {
  console.log(`\n🔍 Checking workflow: ${name} (${id})`);
  
  try {
    const options = {
      hostname: 'localhost',
      port: 5678,
      path: `/api/v1/workflows/${id}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log(`✅ Found workflow: ${response.body.name}`);
      console.log(`   Active: ${response.body.active ? '✅ YES' : '❌ NO'}`);
      
      // Check for webhook nodes
      const nodes = response.body.nodes || [];
      let webhookNodes = nodes.filter(node => node.type === 'n8n-nodes-base.webhook');
      
      if (webhookNodes.length === 0) {
        console.log('   ❌ No webhook nodes found');
        console.log('   ⚠️ This workflow requires a webhook node to be triggered');
      } else {
        console.log(`   ✅ Found ${webhookNodes.length} webhook node(s)`);
        webhookNodes.forEach((node, index) => {
          const path = node.parameters?.path || 'unknown';
          console.log(`     ${index + 1}. Webhook path: ${path}`);
          
          // Test the webhook
          testWebhook(path);
        });
      }
      
      return response.body.active;
    } else {
      console.log(`❌ Could not find workflow ${name}: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking workflow status: ${error.message}`);
    return false;
  }
}

// Test webhook accessibility
async function testWebhook(path) {
  console.log(`   🔍 Testing webhook: ${path}`);
  
  try {
    const options = {
      hostname: 'localhost',
      port: 5678,
      path: `/${path}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const testData = JSON.stringify({
      test: true,
      timestamp: new Date().toISOString()
    });
    
    const response = await makeRequest(options, testData);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('   ✅ Webhook is responding correctly');
    } else if (response.statusCode === 404) {
      console.log('   ❌ Webhook returned 404 Not Found');
      console.log('   ⚠️ Try clicking "Execute Workflow" in the n8n interface');
    } else {
      console.log(`   ❌ Webhook returned status ${response.statusCode}`);
    }
    
    return response.statusCode >= 200 && response.statusCode < 300;
  } catch (error) {
    console.error(`Error testing webhook: ${error.message}`);
    return false;
  }
}

// Test API proxy endpoint
async function testApiProxy() {
  console.log('\n🔍 Testing API proxy endpoint');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/n8n/calculate-metrics',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const testData = JSON.stringify({
      workflowData: {
        owner_full_names: ["Test User"],
        closed_date_range: "2025-08-31T00:00:00Z TO 2025-09-06T23:59:59Z",
        entity_type: "dpe",
        entity_name: "Test User"
      }
    });
    
    const response = await makeRequest(options, testData);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('✅ API proxy is working correctly');
    } else {
      console.log(`❌ API proxy returned status ${response.statusCode}`);
      console.log(`   Error: ${JSON.stringify(response.body)}`);
    }
    
    return response.statusCode >= 200 && response.statusCode < 300;
  } catch (error) {
    console.error(`Error testing API proxy: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('========================================');
  console.log('WORKFLOW STATUS CHECKER');
  console.log('========================================');
  
  // Check each workflow
  let allActive = true;
  
  for (const [name, id] of Object.entries(WORKFLOW_IDS)) {
    const isActive = await checkWorkflowStatus(name, id);
    if (!isActive) {
      allActive = false;
    }
  }
  
  // Test API proxy
  await testApiProxy();
  
  console.log('\n========================================');
  console.log('STATUS SUMMARY');
  console.log('========================================');
  
  if (allActive) {
    console.log('✅ All workflows are active');
  } else {
    console.log('❌ Some workflows are not active');
  }
  
  console.log('\nNext Steps:');
  console.log('1. If webhooks return 404, click "Execute Workflow" in the n8n interface');
  console.log('2. If workflows are not active, add webhook nodes and activate them');
  console.log('3. If API proxy fails, check webhook paths in mongodb-api-server.cjs');
  console.log('4. Restart the API server: docker-compose restart mongodb-api');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
});