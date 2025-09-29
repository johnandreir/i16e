// Simple diagnostic to find your High SCT Email Scrubber webhook path

console.log('=== HIGH SCT EMAIL SCRUBBER WEBHOOK DIAGNOSTIC ===\n');

console.log('Since your get-performance webhook works, n8n is definitely running.');
console.log('The issue is finding the correct webhook path for your High SCT Email Scrubber workflow.\n');

console.log('STEPS TO FIND YOUR WEBHOOK PATH:');
console.log('1. Open n8n at http://localhost:5678');
console.log('2. Navigate to your "High SCT Email Scrubber" workflow');
console.log('3. Look for the Webhook node (usually the first node)');
console.log('4. Click on the Webhook node');
console.log('5. Look at the "Webhook URLs" section');
console.log('6. Copy the "Production URL" or "Test URL"');
console.log('7. The path part (after localhost:5678) is what we need\n');

console.log('COMMON WEBHOOK PATH FORMATS:');
console.log('- /webhook-test/[workflow-name]');
console.log('- /webhook/[workflow-name]');
console.log('- /webhook-test/[custom-path]');
console.log('- /webhook/[custom-path]\n');

console.log('EXAMPLE:');
console.log('If your webhook URL is: http://localhost:5678/webhook/my-sct-analyzer');
console.log('Then update the code to use: /webhook/my-sct-analyzer\n');

console.log('TO UPDATE THE CODE:');
console.log('Replace this line in src/lib/n8nWorkflowService.ts:');
console.log('  const directResponse = await fetch(`${this.n8nDirectUrl}/webhook-test/analyze-sct`, {');
console.log('With:');
console.log('  const directResponse = await fetch(`${this.n8nDirectUrl}/YOUR-ACTUAL-PATH`, {\n');

// Test the known working webhook to confirm n8n is accessible
async function testN8nConnectivity() {
    console.log('TESTING n8n CONNECTIVITY...');
    
    try {
        const testPayload = {
            entityType: 'dpe',
            entityName: 'Test DPE',
            ownerNames: ['Test DPE']
        };
        
        const response = await fetch('http://localhost:5678/webhook-test/get-performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload),
            signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
            console.log('✅ n8n is accessible and get-performance webhook works');
            console.log('✅ The issue is definitely the webhook path for High SCT Email Scrubber');
        } else {
            console.log(`⚠️  get-performance returned: ${response.status} ${response.statusText}`);
        }
        
    } catch (error) {
        console.log('❌ Could not reach n8n:', error.message);
        console.log('💡 Make sure n8n is running: npx n8n start');
    }
}

testN8nConnectivity();