const http = require('http');

const testData = {
    test: true,
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31",
    source: "console-test"
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

console.log('🧪 Testing get-cases endpoint to trigger webhook logs...');
console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));

const req = http.request(options, (res) => {
    console.log(`📊 Response Status: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', chunk => responseData += chunk);
    res.on('end', () => {
        console.log(`📄 Response: ${responseData}`);
        console.log('\n✅ Test completed. Check the server console for detailed webhook logs.');
    });
});

req.on('error', (error) => {
    console.log(`💥 Error: ${error.message}`);
});

req.setTimeout(15000, () => {
    console.log(`⏰ Timeout`);
    req.destroy();
});

req.write(postData);
req.end();