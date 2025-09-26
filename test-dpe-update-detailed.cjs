#!/usr/bin/env node

async function testDPEUpdateWithLogging() {
  try {
    console.log('🔍 Testing DPE Update with detailed connection checking...\n');

    // First, get a DPE
    console.log('📋 Getting DPE from API...');
    const dpesResponse = await fetch('http://localhost:3001/api/dpe');
    
    if (!dpesResponse.ok) {
      console.log('❌ Failed to get DPEs, status:', dpesResponse.status);
      return;
    }
    
    const dpes = await dpesResponse.json();
    console.log('📝 DPE count:', dpes.length);
    
    if (dpes.length === 0) {
      console.log('❌ No DPEs found');
      return;
    }

    const testDPE = dpes[0];
    console.log('🎯 Test DPE:', JSON.stringify(testDPE, null, 2));

    // Try the update with detailed error logging
    console.log('\n🔄 Attempting DPE update...');
    
    const updateData = {
      name: testDPE.name + ' (CONNECTIVITY TEST)',
      squadID: testDPE.squadID
      // Note: email and role not included for DPEs
    };
    
    console.log('📝 Update payload:', JSON.stringify(updateData, null, 2));
    
    const updateResponse = await fetch(
      `http://localhost:3001/api/dpe/${testDPE.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      }
    );
    
    console.log('🔍 Update response status:', updateResponse.status);
    console.log('🔍 Update response status text:', updateResponse.statusText);
    
    if (updateResponse.ok) {
      const result = await updateResponse.json();
      console.log('✅ Update successful:', result);
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Update failed.');
      console.log('❌ Error response body:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('❌ Error details:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('❌ Non-JSON error response');
      }
    }

    // Also test a simple GET to confirm connection works
    console.log('\n🔍 Testing simple GET to confirm basic connectivity...');
    const simpleResponse = await fetch('http://localhost:3001/api/simple-debug');
    console.log('📋 Simple debug status:', simpleResponse.status);
    
    if (simpleResponse.ok) {
      const debugData = await simpleResponse.text();
      console.log('📋 Simple debug response:', debugData);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testDPEUpdateWithLogging();