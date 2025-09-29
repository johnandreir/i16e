// Comprehensive High SCT Email Scrubber Workflow Analysis

console.log('=== HIGH SCT EMAIL SCRUBBER WORKFLOW ANALYSIS ===\n');

// Expected High SCT Email Scrubber output format based on your description
const expectedOutputFormat = {
    email_sentiment_analysis: [
        {
            case_id: "string",
            problem: "string", 
            recommendations: ["string"]
        }
    ],
    case_handoffs_and_delays: [
        {
            case_id: "string",
            problem: "string",
            recommendations: ["string"] 
        }
    ],
    summary: {
        areas_for_improvement: ["string"],
        strengths: ["string"]
    },
    cases_analyzed: ["array of case objects"]
};

console.log('Expected High SCT Email Scrubber Output Format:');
console.log(JSON.stringify(expectedOutputFormat, null, 2));
console.log('\n' + '='.repeat(60) + '\n');

async function analyzeWorkflowIntegration() {
    
    console.log('1. CHECKING n8n SERVICE STATUS');
    console.log('-'.repeat(30));
    
    try {
        // Check if n8n is running
        const healthResponse = await fetch('http://localhost:5678/rest/health', {
            method: 'GET'
        });
        
        if (healthResponse.ok) {
            console.log('✅ n8n service is running');
        } else {
            console.log('❌ n8n service health check failed:', healthResponse.status);
        }
    } catch (error) {
        console.log('❌ n8n service is not accessible:', error.message);
        console.log('💡 Make sure n8n is running on localhost:5678');
        console.log('   Command: npx n8n start');
        return;
    }
    
    console.log('\n2. CHECKING WEBHOOK ENDPOINT');
    console.log('-'.repeat(30));
    
    // Test payload
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
                structured_email_thread: "Customer: Issue with the system.\nSupport: Let me help you with that.\nCustomer: Thank you!"
            }
        ]
    };
    
    try {
        console.log('Calling webhook: http://localhost:5678/webhook-test/analyze-sct');
        const webhookResponse = await fetch('http://localhost:5678/webhook-test/analyze-sct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload)
        });
        
        console.log('Webhook Response Status:', webhookResponse.status);
        console.log('Webhook Response Headers:', Object.fromEntries(webhookResponse.headers.entries()));
        
        if (webhookResponse.ok) {
            const result = await webhookResponse.json();
            
            console.log('\n3. ANALYZING WEBHOOK RESPONSE');
            console.log('-'.repeat(30));
            
            console.log('Response Type:', typeof result);
            console.log('Is Array:', Array.isArray(result));
            
            if (Array.isArray(result)) {
                console.log('Array Length:', result.length);
                if (result.length > 0) {
                    console.log('First Item Type:', typeof result[0]);
                    console.log('First Item Keys:', Object.keys(result[0]));
                }
            } else {
                console.log('Object Keys:', Object.keys(result));
            }
            
            console.log('\nFull Response:');
            console.log(JSON.stringify(result, null, 2));
            
            console.log('\n4. CHECKING FOR HIGH SCT EMAIL SCRUBBER FORMAT');
            console.log('-'.repeat(50));
            
            const dataToCheck = Array.isArray(result) ? (result.length > 0 ? result[0] : {}) : result;
            
            console.log('✅ Has email_sentiment_analysis:', !!dataToCheck.email_sentiment_analysis);
            console.log('✅ Has case_handoffs_and_delays:', !!dataToCheck.case_handoffs_and_delays);
            console.log('✅ Has summary:', !!dataToCheck.summary);
            console.log('✅ Has cases_analyzed:', !!dataToCheck.cases_analyzed);
            
            if (dataToCheck.email_sentiment_analysis) {
                console.log('   📧 email_sentiment_analysis length:', dataToCheck.email_sentiment_analysis.length);
            }
            if (dataToCheck.case_handoffs_and_delays) {
                console.log('   ⏱️  case_handoffs_and_delays length:', dataToCheck.case_handoffs_and_delays.length);
            }
            if (dataToCheck.summary) {
                console.log('   📋 summary keys:', Object.keys(dataToCheck.summary));
            }
            if (dataToCheck.cases_analyzed) {
                console.log('   📊 cases_analyzed length:', dataToCheck.cases_analyzed.length);
            }
            
            console.log('\n5. UI INTEGRATION CHECK');
            console.log('-'.repeat(25));
            
            // Check if format matches what the UI expects
            const hasRequiredFormat = (
                dataToCheck.email_sentiment_analysis ||
                dataToCheck.case_handoffs_and_delays ||
                dataToCheck.summary
            );
            
            if (hasRequiredFormat) {
                console.log('✅ Response matches High SCT Email Scrubber format');
                console.log('💡 This should work with the UI integration');
                
                // Simulate the UI processing
                console.log('\n6. SIMULATING UI PROCESSING');
                console.log('-'.repeat(30));
                
                let aiInsights = [];
                
                if (dataToCheck.email_sentiment_analysis && dataToCheck.email_sentiment_analysis.length > 0) {
                    dataToCheck.email_sentiment_analysis.forEach((item, index) => {
                        aiInsights.push({
                            id: `email-${index + 1}`,
                            title: `Email Communication Analysis: Case ${item.case_id}`,
                            description: item.problem,
                            category: 'communication'
                        });
                    });
                }
                
                if (dataToCheck.case_handoffs_and_delays && dataToCheck.case_handoffs_and_delays.length > 0) {
                    dataToCheck.case_handoffs_and_delays.forEach((item, index) => {
                        aiInsights.push({
                            id: `delay-${index + 1}`,
                            title: `Process Delay Analysis: Case ${item.case_id}`,
                            description: item.problem,
                            category: 'process'
                        });
                    });
                }
                
                console.log('Generated AI Insights:', aiInsights.length);
                console.log('Insights Preview:', aiInsights.map(i => i.title));
                
            } else {
                console.log('❌ Response does NOT match High SCT Email Scrubber format');
                console.log('💡 This explains why the UI is not showing results');
                console.log('🔧 The workflow needs to return the expected format');
            }
            
        } else {
            const errorText = await webhookResponse.text();
            console.log('❌ Webhook call failed:', errorText);
        }
        
    } catch (error) {
        console.log('❌ Webhook test failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(60));
}

analyzeWorkflowIntegration().catch(console.error);