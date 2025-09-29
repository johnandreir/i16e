// Test the analyze-sct webhook endpoint
const http = require('http');

async function testAnalyzeSCTWebhook() {
    try {
        console.log('Testing Analyze SCT webhook endpoint...');
        
        const payload = {
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
                    structured_email_thread: "Test email thread"
                }
            ]
        };
        
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        const postData = JSON.stringify(payload);
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/n8n/analyze-sct',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            console.log('Response status:', res.statusCode);
            console.log('Response status message:', res.statusMessage);
            console.log('Response headers:', res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Response body:', data);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Analyze SCT webhook call successful');
                    console.log('🔥 Now the Analyze SCT button should work!');
                } else {
                    console.log('❌ Analyze SCT webhook call failed');
                    console.log('💡 This means the API server is working but n8n webhook is not responding');
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
        });
        
        req.write(postData);
        req.end();
        
    } catch (error) {
        console.error('❌ Error testing analyze SCT webhook:', error.message);
    }
}

testAnalyzeSCTWebhook();