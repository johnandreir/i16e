// Test N8N Integration - Check if the updated endpoints work correctly
console.log('🧪 Testing N8N Integration...\n');

async function testN8nEndpoints() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('1. Testing N8N Health Endpoint...');
  try {
    const healthResponse = await fetch(`${baseUrl}/api/n8n/health`);
    console.log(`   Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Health endpoint accessible');
      console.log('   📊 Health data:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('   ❌ Health endpoint failed');
      const errorText = await healthResponse.text();
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('   ❌ Health endpoint error:', error.message);
  }
  
  console.log('\n2. Testing N8N Calculate Metrics Endpoint...');
  try {
    const testPayload = {
      entityType: 'dpe',
      entityName: 'Test DPE',
      ownerNames: ['Test Owner'],
      dateRange: {
        from: '2024-01-01',
        to: '2024-12-31'
      },
      eurekaDateRange: '2024-01-01T00:00:00Z TO 2024-12-31T23:59:59Z'
    };
    
    const metricsResponse = await fetch(`${baseUrl}/api/n8n/calculate-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`   Status: ${metricsResponse.status}`);
    
    if (metricsResponse.ok) {
      const metricsData = await metricsResponse.json();
      console.log('   ✅ Calculate Metrics endpoint accessible');
      console.log('   📊 Response:', JSON.stringify(metricsData, null, 2));
    } else {
      console.log('   ⚠️ Calculate Metrics endpoint returned error (expected if N8N not running)');
      const errorText = await metricsResponse.text();
      console.log('   Response:', errorText);
    }
  } catch (error) {
    console.log('   ❌ Calculate Metrics endpoint error:', error.message);
  }
  
  console.log('\n3. Testing N8N Get Cases Endpoint...');
  try {
    const testPayload = {
      entityType: 'dpe',
      entityName: 'Test DPE',
      ownerNames: ['Test Owner'],
      dateRange: {
        from: '2024-01-01',
        to: '2024-12-31'
      },
      eurekaDateRange: '2024-01-01T00:00:00Z TO 2024-12-31T23:59:59Z'
    };
    
    const casesResponse = await fetch(`${baseUrl}/api/n8n/get-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`   Status: ${casesResponse.status}`);
    
    if (casesResponse.ok) {
      const casesData = await casesResponse.json();
      console.log('   ✅ Get Cases endpoint accessible');
      console.log('   📊 Response:', JSON.stringify(casesData, null, 2));
    } else {
      console.log('   ⚠️ Get Cases endpoint returned error (expected if N8N not running)');
      const errorText = await casesResponse.text();
      console.log('   Response:', errorText);
    }
  } catch (error) {
    console.log('   ❌ Get Cases endpoint error:', error.message);
  }
  
  console.log('\n🏁 N8N Integration Test Complete');
}

testN8nEndpoints().catch(console.error);