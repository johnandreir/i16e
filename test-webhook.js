// Test the webhook endpoint
const http = require('http');

async function testWebhook() {
    try {
        console.log('Testing webhook endpoint...');
        
        const payload = {
            entityType: "dpe",
            entityName: "Test DPE", 
            ownerNames: ["Test DPE"],
            eurekaDateRange: "2024-01-01T00:00:00Z TO 2024-12-31T23:59:59Z",
            owner_full_name: ["Test DPE"],
            closed_date: ["2024-01-01T00:00:00Z TO 2024-12-31T23:59:59Z"]
        };
        
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        const postData = JSON.stringify(payload);
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/n8n/get-cases',
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
                    console.log('✅ Webhook call successful');
                    console.log('🔥 Now the Generate Report button should work!');
                } else {
                    console.log('❌ Webhook call failed');
                    console.log('💡 This is expected if n8n is not running on localhost:5678');
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
        });
        
        req.write(postData);
        req.end();
        
    } catch (error) {
        console.error('❌ Error testing webhook:', error.message);
    }
}

testWebhook();