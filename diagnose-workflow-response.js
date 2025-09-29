// Diagnostic script to test High SCT Email Scrubber workflow response format
console.log('=== HIGH SCT EMAIL SCRUBBER WORKFLOW DIAGNOSTIC ===\n');

const testPayload = {
    entity_type: "squad",
    entity_name: "Mharlee", 
    cases_data: [
        {
            case_id: "TEST001",
            title: "Test Case for Analysis",
            case_age_days: 8,
            status: "Closed",
            created_date: "2024-01-01T00:00:00Z",
            closed_date: "2024-01-09T00:00:00Z",
            structured_email_thread: "Customer: Having issues with slow performance.\n\nSupport: Thank you for contacting us. I understand your concern about the performance issues. Let me investigate this for you.\n\nCustomer: It's been happening for 3 days now.\n\nSupport: I've identified the root cause and applied a fix. Can you please test and confirm if the issue is resolved?\n\nCustomer: Perfect! Everything is working normally now. Thank you so much!"
        },
        {
            case_id: "TEST002", 
            title: "Another Test Case",
            case_age_days: 3,
            status: "Closed",
            created_date: "2024-01-05T00:00:00Z", 
            closed_date: "2024-01-08T00:00:00Z",
            structured_email_thread: "Customer: Need help with configuration.\n\nSupport: I'll help you with the configuration. Let me walk you through the steps.\n\nCustomer: That worked perfectly!"
        }
    ]
};

async function testWorkflow() {
    try {
        console.log('🚀 Testing High SCT Email Scrubber workflow...');
        console.log('📡 URL: http://localhost:5678/webhook-test/analyze-sct');
        console.log('📊 Payload:', JSON.stringify(testPayload, null, 2));
        console.log('\n⏳ Calling workflow...\n');
        
        const response = await fetch('http://localhost:5678/webhook-test/analyze-sct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload),
            signal: AbortSignal.timeout(30000)
        });
        
        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            console.log('❌ Workflow call failed');
            return;
        }
        
        const responseText = await response.text();
        console.log('\n📥 Raw response:');
        console.log('================');
        console.log(responseText);
        console.log('================\n');
        
        if (!responseText) {
            console.log('❌ Empty response from workflow');
            return;
        }
        
        try {
            const jsonResponse = JSON.parse(responseText);
            console.log('📊 Parsed JSON response:');
            console.log(JSON.stringify(jsonResponse, null, 2));
            
            console.log('\n🔍 VALIDATION CHECKS:');
            console.log('=====================');
            
            // Check the validation criteria from the frontend
            const hasEmailAnalysis = !!(jsonResponse.email_sentiment_analysis);
            const hasDelayAnalysis = !!(jsonResponse.case_handoffs_and_delays); 
            const hasSummary = !!(jsonResponse.summary);
            const isArray = Array.isArray(jsonResponse);
            
            console.log(`✓ Has email_sentiment_analysis: ${hasEmailAnalysis}`);
            console.log(`✓ Has case_handoffs_and_delays: ${hasDelayAnalysis}`);
            console.log(`✓ Has summary: ${hasSummary}`);
            console.log(`✓ Is array: ${isArray}`);
            
            if (isArray && jsonResponse.length > 0) {
                console.log(`✓ Array length: ${jsonResponse.length}`);
                console.log('✓ First array item structure:');
                const firstItem = jsonResponse[0];
                console.log(`   - Has email_sentiment_analysis: ${!!(firstItem.email_sentiment_analysis)}`);
                console.log(`   - Has case_handoffs_and_delays: ${!!(firstItem.case_handoffs_and_delays)}`);
                console.log(`   - Has summary: ${!!(firstItem.summary)}`);
            }
            
            // Check frontend validation condition
            const passesValidation = jsonResponse && (
                jsonResponse.email_sentiment_analysis || 
                jsonResponse.case_handoffs_and_delays || 
                jsonResponse.summary || 
                (Array.isArray(jsonResponse) && jsonResponse.length > 0)
            );
            
            console.log(`\n🎯 FRONTEND VALIDATION RESULT: ${passesValidation ? '✅ PASS' : '❌ FAIL'}`);
            
            if (!passesValidation) {
                console.log('\n❌ This explains why you\'re getting local fallback analysis!');
                console.log('💡 Your workflow needs to return data with these properties:');
                console.log('   - email_sentiment_analysis (array of email analysis objects)');
                console.log('   - case_handoffs_and_delays (array of delay analysis objects)');
                console.log('   - summary (object with areas_for_improvement and strengths)');
                console.log('   OR return an array containing such objects');
            } else {
                console.log('\n✅ Response should pass frontend validation');
                console.log('💭 If you\'re still seeing local fallback, check browser console for errors');
            }
            
        } catch (parseError) {
            console.log('❌ Invalid JSON response:', parseError.message);
            console.log('📝 Raw response was:', responseText);
        }
        
    } catch (error) {
        console.log('❌ Error testing workflow:', error.message);
        if (error.name === 'TimeoutError') {
            console.log('   - Workflow took longer than 30 seconds');
        } else if (error.name === 'TypeError') {
            console.log('   - Connection failed - is n8n running on localhost:5678?');
        }
    }
}

testWorkflow();