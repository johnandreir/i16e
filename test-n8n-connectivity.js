// Simple connectivity test for n8n server
console.log('Testing n8n server connectivity...\n');

async function testConnectivity() {
    const tests = [
        { name: 'n8n main endpoint', url: 'http://localhost:5678' },
        { name: 'n8n healthcheck', url: 'http://localhost:5678/healthz' },
        { name: 'High SCT webhook', url: 'http://localhost:5678/webhook-test/analyze-sct' }
    ];
    
    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}`);
            const response = await fetch(test.url, { 
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            console.log(`  ✅ Status: ${response.status} ${response.statusText}`);
        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.log(`  ⏰ Timeout - server may be slow or unresponsive`);
            } else if (error.name === 'TypeError') {
                console.log(`  ❌ Connection failed - server not running or wrong port`);
            } else {
                console.log(`  ❌ Error: ${error.message}`);
            }
        }
        console.log('');
    }
    
    // Now test with POST to the webhook
    console.log('Testing POST to High SCT webhook...');
    try {
        const response = await fetch('http://localhost:5678/webhook-test/analyze-sct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'connectivity' }),
            signal: AbortSignal.timeout(5000)
        });
        
        console.log(`  ✅ POST Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        if (text) {
            console.log(`  📝 Response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
        }
        
        if (response.status === 200) {
            console.log('\n🎉 High SCT Email Scrubber webhook is responding!');
        } else if (response.status === 404) {
            console.log('\n⚠️  Webhook path not found - check your workflow configuration');
        } else {
            console.log(`\n⚠️  Unexpected status: ${response.status}`);
        }
        
    } catch (error) {
        console.log(`  ❌ POST failed: ${error.message}`);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('   1. Make sure n8n is running: npm run start (or your n8n start command)');
        console.log('   2. Check your High SCT Email Scrubber workflow is active in n8n UI');
        console.log('   3. Verify the webhook node URL in your workflow matches: /webhook-test/analyze-sct');
    }
}

testConnectivity().catch(console.error);