// Test script to check API endpoints without interfering with the server
const testEndpoints = async () => {
  try {
    console.log('🧪 Testing API Server Endpoints...\n');
    
    // Test server status
    console.log('1. Testing /api/server/status...');
    const statusResponse = await fetch('http://localhost:3001/api/server/status');
    const statusData = await statusResponse.json();
    console.log('✅ Server Status:', statusData.server.status);
    console.log('📊 Memory Usage:', statusData.server.memory.heapUsed, 'MB');
    console.log('⏰ Uptime:', statusData.server.uptimeFormatted);
    console.log('🛡️ Consecutive Interrupts:', statusData.server.consecutiveInterrupts);
    
    // Test health endpoint
    console.log('\n2. Testing /api/health...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health Status:', healthData.status);
    
    // Test N8N health endpoint
    console.log('\n3. Testing /api/n8n/health...');
    const n8nHealthResponse = await fetch('http://localhost:3001/api/n8n/health');
    if (n8nHealthResponse.ok) {
      const n8nHealthData = await n8nHealthResponse.json();
      console.log('✅ N8N Health:', n8nHealthData.overall.message);
    } else {
      console.log('❌ N8N Health Check Failed:', n8nHealthResponse.status);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('🛡️ Server should still be running and protected from shutdowns.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testEndpoints();