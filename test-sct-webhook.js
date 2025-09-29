// Quick test for High SCT Email Scrubber webhook
console.log('Testing High SCT Email Scrubber webhook at /webhook-test/analyze-sct\n');

const testData = {
    entity_type: "dpe",
    entity_name: "Test DPE",
    cases_data: [{
        case_id: "TEST001",
        title: "Test Case", 
        structured_email_thread: "Customer: Issue with slow response.\nSupport: Let me investigate.\nCustomer: Thank you for the help!"
    }]
};

async function testWebhook() {
    try {
        console.log('Making request to: http://localhost:5678/webhook-test/analyze-sct');
        console.log('Payload:', JSON.stringify(testData, null, 2));
        
        const response = await fetch('http://localhost:5678/webhook-test/analyze-sct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        console.log('\n--- Response Details ---');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('\n--- Response Body ---');
        console.log('Raw:', responseText);
        
        if (responseText) {
            try {
                const json = JSON.parse(responseText);
                console.log('\n--- Parsed JSON ---');
                console.log(JSON.stringify(json, null, 2));
                
                // Check for High SCT Email Scrubber format
                if (json.email_sentiment_analysis || json.case_handoffs_and_delays || json.summary) {
                    console.log('\n✅ HIGH SCT EMAIL SCRUBBER FORMAT DETECTED!');
                } else {
                    console.log('\n⚠️  Response does not match expected High SCT Email Scrubber format');
                }
            } catch (e) {
                console.log('Not valid JSON response');
            }
        } else {
            console.log('Empty response body');
        }
        
    } catch (error) {
        console.error('\n❌ Error testing webhook:');
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('   - Connection refused - is n8n running on localhost:5678?');
        } else {
            console.error('   -', error.message);
        }
    }
}

testWebhook();