// Test different webhook paths for High SCT Email Scrubber workflow

const possiblePaths = [
    '/webhook-test/analyze-sct',
    '/webhook/analyze-sct',
    '/webhook-test/high-sct-email-scrubber',
    '/webhook/high-sct-email-scrubber',
    '/webhook-test/sct-analysis',
    '/webhook/sct-analysis',
    '/webhook-test/email-scrubber',
    '/webhook/email-scrubber',
    '/webhook-test/analyze-email-sct',
    '/webhook/analyze-email-sct'
];

const testPayload = {
    entity_type: "dpe",
    entity_name: "Test DPE",
    cases_data: [
        {
            case_id: "TEST001",
            priority: "High",
            owner_full_name: "Test DPE",
            title: "Test Case",
            products: ["Test Product"],
            status: "Closed",
            created_date: "2024-01-01T00:00:00Z",
            closed_date: "2024-01-02T00:00:00Z",
            case_age_days: 1,
            structured_email_thread: "Customer: Issue.\nSupport: Let me help.\nCustomer: Thanks!"
        }
    ]
};

async function testWebhookPaths() {
    console.log('Testing different webhook paths for High SCT Email Scrubber...\n');
    
    for (const path of possiblePaths) {
        console.log(`Testing: http://localhost:5678${path}`);
        
        try {
            const response = await fetch(`http://localhost:5678${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testPayload),
                signal: AbortSignal.timeout(5000)
            });
            
            console.log(`  Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                console.log('  ✅ SUCCESS! This path works');
                
                try {
                    const result = await response.json();
                    console.log('  Response preview:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
                } catch (jsonError) {
                    const text = await response.text();
                    console.log('  Response text:', text.substring(0, 200) + '...');
                }
                console.log('  🎯 USE THIS PATH IN YOUR CODE!');
                break;
            } else if (response.status === 404) {
                console.log('  ❌ Not found');
            } else if (response.status === 400) {
                console.log('  ⚠️  Bad request (webhook exists but payload might be wrong)');
                console.log('  🎯 This might be your webhook path - check the payload format');
            } else {
                console.log('  ⚠️  Unexpected response');
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('  ⏱️  Timeout');
            } else {
                console.log('  ❌ Error:', error.message);
            }
        }
        
        console.log(''); // Empty line for readability
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('If no webhook path worked:');
    console.log('1. Check your High SCT Email Scrubber workflow in n8n');
    console.log('2. Look at the Webhook node configuration');
    console.log('3. Copy the exact webhook URL/path shown there');
    console.log('4. Update the code to use that path');
}

testWebhookPaths().catch(console.error);