const http = require('http');

async function testApiEndpoint() {
  try {
    console.log('🧪 Testing API server endpoint...');
    
    // Test health endpoint
    const healthResponse = await httpRequest('http://localhost:3001/api/health');
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('✅ API Health endpoint working:', healthData);
    } else {
      console.log('❌ API Health endpoint failed:', healthResponse.status, healthResponse.statusText);
    }
    
    // Test teams endpoint
    const teamsResponse = await fetch('http://localhost:3001/api/teams');
    
    if (teamsResponse.ok) {
      const teamsData = await teamsResponse.json();
      console.log('✅ API Teams endpoint working, found teams:', teamsData.length);
      if (teamsData.length > 0) {
        console.log('Sample team from API:', JSON.stringify(teamsData[0], null, 2));
      }
    } else {
      console.log('❌ API Teams endpoint failed:', teamsResponse.status, teamsResponse.statusText);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('ℹ️  The MongoDB API server might not be running on port 3001');
    console.log('ℹ️  Try running: npm run start:mongodb-api');
  }
}

testApiEndpoint();