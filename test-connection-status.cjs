#!/usr/bin/env node

async function testConnectionStatus() {
  try {
    console.log('🔍 Testing database connection status during API calls...\n');

    // Test the debug endpoint first
    console.log('📋 Checking debug endpoint...');
    const debugResponse = await fetch('http://localhost:3001/api/debug/routes');
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('📊 Database Status from debug:', debugData.databaseStatus);
    }

    // Try a working GET request
    console.log('\n📋 Testing GET /api/dpe...');
    const getResponse = await fetch('http://localhost:3001/api/dpe');
    console.log('✅ GET Status:', getResponse.status);

    if (getResponse.ok) {
      const dpes = await getResponse.json();
      console.log('✅ GET Works - DPE count:', dpes.length);
      
      if (dpes.length > 0) {
        const testDPE = dpes[0];
        console.log('🎯 Test DPE:', testDPE.id, testDPE.name);

        // Now try PUT
        console.log('\n🔄 Testing PUT /api/dpe...');
        const putResponse = await fetch(`http://localhost:3001/api/dpe/${testDPE.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: testDPE.name + ' (CONNECTION TEST)',
            squadID: testDPE.squadID
          })
        });

        console.log('🔍 PUT Response status:', putResponse.status);
        console.log('🔍 PUT Response status text:', putResponse.statusText);
        
        const putResponseText = await putResponse.text();
        console.log('🔍 PUT Response body:', putResponseText);
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testConnectionStatus();