// Simple test for analyze-sct webhook
const http = require('http');

async function testAnalyzeSCTEndpoint() {
    console.log('Testing Analyze SCT endpoint...');
    
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
    
    console.log('Testing API server endpoint: /api/n8n/analyze-sct');
    
    const postData = JSON.stringify(testPayload);
    
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
        console.log('Response headers:', res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Response body:', data);
        });
    });
    
    req.on('error', (error) => {
        console.error('Request error:', error.message);
    });
    
    req.write(postData);
    req.end();
}

testAnalyzeSCTEndpoint();