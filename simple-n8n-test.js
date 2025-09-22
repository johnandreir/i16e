// Simple test to check if N8N endpoints exist - using built-in fetch
async function checkEndpoint(url, method = 'GET', body = null) {
  try {
    console.log(`Testing ${method} ${url}...`);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 404) {
      const text = await response.text();
      console.log('404 Response:', text.slice(0, 100) + '...');
    } else if (response.status < 500) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    }
    
    return response.status;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return -1;
  }
}

async function runTests() {
  console.log('🔍 Checking server and N8N endpoints...\n');
  
  // Check basic health first
  await checkEndpoint('http://localhost:3001/api/health');
  console.log('');
  
  // Check N8N health endpoint  
  await checkEndpoint('http://localhost:3001/api/n8n/health');
  console.log('');
  
  // Test with simple payload
  const testPayload = { test: true };
  await checkEndpoint('http://localhost:3001/api/n8n/calculate-metrics', 'POST', testPayload);
  console.log('');
  
  await checkEndpoint('http://localhost:3001/api/n8n/get-cases', 'POST', testPayload);
}

runTests().catch(console.error);