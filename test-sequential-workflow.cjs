const https = require('https');

// Disable SSL verification for testing
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

async function testSequentialWorkflow() {
  console.log('🚀 Testing Sequential Workflow...\n');
  
  try {
    // Test 1: Check API server health
    console.log('📋 Step 1: Checking API server health...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ API Server Status:', healthData.status);
    console.log('✅ MongoDB Status:', healthData.mongodb?.connected ? 'Connected' : 'Disconnected');
    
    // Test 2: Check N8N health
    console.log('\n📋 Step 2: Checking N8N health...');
    const n8nHealthResponse = await fetch('http://localhost:3001/api/n8n/health');
    const n8nHealthData = await n8nHealthResponse.json();
    console.log('✅ N8N Service:', n8nHealthData.n8nHealth.n8nServiceStatus.message);
    console.log('✅ N8N Workflows:', n8nHealthData.n8nHealth.n8nWorkflowStatus.message);
    
    // Test 3: Trigger get-cases workflow with detailed logging
    console.log('\n📋 Step 3: Testing get-cases workflow...');
    const payload = {
      entityType: "dpe",
      entityName: "Test DPE",
      ownerNames: ["Test Owner"],
      eurekaDateRange: "2024-01-01T00:00:00Z TO 2024-12-31T23:59:59Z"
    };
    
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    
    const getCasesResponse = await fetch('http://localhost:3001/api/n8n/get-cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    console.log('📥 Response Status:', getCasesResponse.status);
    console.log('📥 Response Headers:', Object.fromEntries(getCasesResponse.headers.entries()));
    
    const responseText = await getCasesResponse.text();
    console.log('📥 Raw Response:', responseText);
    
    try {
      const getCasesResult = JSON.parse(responseText);
      console.log('✅ Parsed Response:', getCasesResult);
      
      if (getCasesResponse.ok && getCasesResult.success) {
        console.log('\n🎉 SUCCESS: Get-cases workflow triggered successfully!');
        console.log('📝 Message:', getCasesResult.message);
        
        // Wait a bit for the sequential workflow to complete
        console.log('\n⏳ Waiting 5 seconds for sequential workflow to complete...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('📋 Step 4: Checking if Calculate metrics was triggered automatically...');
        // Note: This would require additional monitoring to verify the Calculate metrics execution
        console.log('ℹ️ Check N8N interface for execution logs of both workflows');
        
      } else {
        console.log('❌ Get-cases workflow failed:', getCasesResult.message);
      }
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.error('📄 Response was:', responseText);
      throw parseError;
    }
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('📄 Stack trace:', error.stack);
  }
}

// Add fetch polyfill for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = async (url, options) => {
    const { default: fetch } = await import('node-fetch');
    return fetch(url, options);
  };
}

testSequentialWorkflow();