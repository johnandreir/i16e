const http = require('http');

// Check N8N service health
function checkN8nHealth() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5678,
      path: '/healthz',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ N8N service is healthy');
          resolve(true);
        } else {
          console.log('❌ N8N service is not responding correctly');
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ N8N service check failed: ${err.message}`);
      resolve(false);
    });
    
    req.end();
  });
}

// Check MongoDB API service health
function checkApiHealth() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          console.log('✅ API service is healthy');
          console.log('🔍 API service details:', JSON.stringify(health, null, 2));
          resolve(true);
        } catch (e) {
          console.log('❌ API service returned invalid health check data');
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ API service check failed: ${err.message}`);
      resolve(false);
    });
    
    req.end();
  });
}

// Check if the specific workflow is active
function checkWorkflowStatus(workflowId) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5678,
      path: `/api/v1/workflows/${workflowId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOTMwOTc1Mi01M2M2LTQxNTUtYTQxZi03NmNhYmJmOWJiZWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU4OTkyNDAzLCJleHAiOjE3NjE1MjMyMDB9.-PHWM4_1ZW4v4XZtdhOyz9c-P6WwfjcqUFPTmLjxWHw'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const workflow = JSON.parse(data);
            console.log(`✅ Workflow ${workflowId} exists`);
            console.log(`🔍 Workflow name: ${workflow.name}`);
            console.log(`🔍 Active: ${workflow.active}`);
            resolve(true);
          } catch (e) {
            console.log('❌ Failed to parse workflow data');
            resolve(false);
          }
        } else if (res.statusCode === 401) {
          console.log('❌ Authentication failed - N8N API key may be required');
          resolve(false);
        } else {
          console.log(`❌ Workflow ${workflowId} check failed with status ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Workflow check failed: ${err.message}`);
      resolve(false);
    });
    
    req.end();
  });
}

// Check webhook status
function checkWebhookStatus() {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      test: true
    });
    
    const req = http.request({
      hostname: 'localhost',
      port: 5678,
      path: '/webhook-test/get-performance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Webhook is accessible');
          resolve(true);
        } else {
          console.log(`❌ Webhook returned status ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Webhook check failed: ${err.message}`);
      resolve(false);
    });
    
    req.write(data);
    req.end();
  });
}

// Main function
async function checkHealth() {
  console.log('======================================');
  console.log('      DEVOPS INSIGHT ENGINE HEALTH    ');
  console.log('======================================');
  console.log('Starting health checks...\n');
  
  // Check the two main services
  const n8nHealthy = await checkN8nHealth();
  const apiHealthy = await checkApiHealth();
  
  console.log('\n======================================');
  console.log('      WORKFLOW SPECIFIC CHECKS        ');
  console.log('======================================');
  
  // Only check workflows if N8N is healthy
  if (n8nHealthy) {
    // Check known workflow IDs
    await checkWorkflowStatus('ulgP4TQ9fUOcEuWF');
    await checkWorkflowStatus('VaX3w979KjLLcgNY');
    
    // Check webhook connectivity
    await checkWebhookStatus();
  } else {
    console.log('❌ Skipping workflow checks because N8N is not healthy');
  }
  
  console.log('\n======================================');
  console.log('      SUMMARY                         ');
  console.log('======================================');
  console.log(`N8N Service: ${n8nHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  console.log(`API Service: ${apiHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
  
  if (!n8nHealthy || !apiHealthy) {
    console.log('\nTroubleshooting Steps:');
    console.log('1. Check if Docker containers are running:');
    console.log('   docker ps');
    console.log('2. Restart services if needed:');
    console.log('   docker-compose restart n8n mongodb-api');
    console.log('3. Check logs for errors:');
    console.log('   docker-compose logs n8n');
    console.log('   docker-compose logs mongodb-api');
  }
}

checkHealth().catch(console.error);