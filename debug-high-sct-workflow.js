// Debug script to test High SCT Email Scrubber workflow locally

async function testHighSCTEmailScrubber() {
    console.log('=== Testing High SCT Email Scrubber Workflow ===');
    
    // Test payload matching what the frontend would send
    const testPayload = {
        entity_type: "dpe",
        entity_name: "Test DPE",
        cases_data: [
            {
                case_id: "CS001",
                priority: "High", 
                owner_full_name: "Test DPE",
                title: "Test Case with Email Analysis",
                products: ["Product A"],
                status: "Closed",
                created_date: "2024-01-01T00:00:00Z", 
                closed_date: "2024-01-02T00:00:00Z",
                case_age_days: 1,
                structured_email_thread: "Customer: I'm having trouble with the application. It keeps crashing when I try to save my work.\n\nSupport: Thank you for contacting us. I understand your frustration with the application crashes. Let me help you resolve this issue.\n\nCustomer: I've tried restarting but it still happens.\n\nSupport: I see. Can you please try clearing your browser cache and cookies? This often resolves similar issues.\n\nCustomer: That worked! Thank you so much for your help."
            },
            {
                case_id: "CS002", 
                priority: "Medium",
                owner_full_name: "Test DPE",
                title: "Another Test Case", 
                products: ["Product B"],
                status: "Closed", 
                created_date: "2024-01-03T00:00:00Z",
                closed_date: "2024-01-05T00:00:00Z", 
                case_age_days: 2,
                structured_email_thread: "Customer: The feature is not working as expected.\n\nSupport: I apologize for the inconvenience. Let me investigate this issue for you.\n\nSupport: After reviewing your account, I found the issue. I've applied a fix that should resolve the problem.\n\nCustomer: Perfect! It's working now. Thank you!"
            }
        ]
    };
    
    console.log('Test Payload:', JSON.stringify(testPayload, null, 2));
    
    try {
        // Test direct webhook call
        console.log('\n--- Testing Direct Webhook Call ---');
        console.log('URL: http://localhost:5678/webhook-test/analyze-sct');
        
        const directResponse = await fetch('http://localhost:5678/webhook-test/analyze-sct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });
        
        console.log('Direct Response Status:', directResponse.status);
        console.log('Direct Response Headers:', Object.fromEntries(directResponse.headers.entries()));
        
        if (directResponse.ok) {
            const directResult = await directResponse.json();
            console.log('Direct Response Body:', JSON.stringify(directResult, null, 2));
            
            // Analyze the structure
            console.log('\n--- Response Structure Analysis ---');
            console.log('Is Array:', Array.isArray(directResult));
            console.log('Type:', typeof directResult);
            
            if (Array.isArray(directResult)) {
                console.log('Array Length:', directResult.length);
                if (directResult.length > 0) {
                    console.log('First Item Keys:', Object.keys(directResult[0]));
                }
            } else {
                console.log('Object Keys:', Object.keys(directResult));
            }
            
            // Check for expected High SCT Email Scrubber properties
            const dataToCheck = Array.isArray(directResult) ? directResult[0] : directResult;
            console.log('\n--- Expected Properties Check ---');
            console.log('Has email_sentiment_analysis:', !!dataToCheck?.email_sentiment_analysis);
            console.log('Has case_handoffs_and_delays:', !!dataToCheck?.case_handoffs_and_delays);
            console.log('Has summary:', !!dataToCheck?.summary);
            console.log('Has cases_analyzed:', !!dataToCheck?.cases_analyzed);
            
        } else {
            const errorText = await directResponse.text();
            console.log('Direct Response Error:', errorText);
        }
        
    } catch (directError) {
        console.log('Direct webhook failed:', directError.message);
        
        // Test API proxy fallback
        console.log('\n--- Testing API Proxy Fallback ---');
        console.log('URL: http://localhost:3001/api/n8n/analyze-sct');
        
        try {
            const proxyResponse = await fetch('http://localhost:3001/api/n8n/analyze-sct', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testPayload)
            });
            
            console.log('Proxy Response Status:', proxyResponse.status);
            console.log('Proxy Response Headers:', Object.fromEntries(proxyResponse.headers.entries()));
            
            if (proxyResponse.ok) {
                const proxyResult = await proxyResponse.json();
                console.log('Proxy Response Body:', JSON.stringify(proxyResult, null, 2));
            } else {
                const errorText = await proxyResponse.text();
                console.log('Proxy Response Error:', errorText);
            }
            
        } catch (proxyError) {
            console.log('API proxy also failed:', proxyError.message);
        }
    }
}

// Run the test
testHighSCTEmailScrubber().catch(console.error);