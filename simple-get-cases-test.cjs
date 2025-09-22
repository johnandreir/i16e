const http = require('http');

const testData = {
    test: true,
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31"
};

const postData = JSON.stringify(testData);

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

console.log('🧪 Testing get-cases endpoint (should now use correct webhook URL)...');

const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', chunk => responseData += chunk);
    res.on('end', () => {
        console.log(`📄 Response: ${responseData}`);
        
        try {
            const json = JSON.parse(responseData);
            if (json.success) {
                console.log('✅ SUCCESS: get-cases endpoint is working!');
            } else {
                console.log('❌ FAILED: get-cases endpoint returned error');
            }
        } catch (e) {
            console.log('❌ FAILED: Invalid JSON response');
        }
    });
});

req.on('error', (error) => {
    console.log(`💥 Error: ${error.message}`);
});

req.setTimeout(10000, () => {
    console.log(`⏰ Timeout`);
    req.destroy();
});

req.write(postData);
req.end();