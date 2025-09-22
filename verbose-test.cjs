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
    path: '/api/n8n/calculate-metrics',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('📍 Testing calculate-metrics endpoint with verbose logging...');
console.log(`📤 Request: ${options.method} ${options.hostname}:${options.port}${options.path}`);
console.log(`📦 Body: ${postData}`);

const req = http.request(options, (res) => {
    console.log(`📥 Response Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`📋 Response Headers:`, res.headers);
    
    let responseData = '';
    res.on('data', chunk => {
        console.log(`📨 Data chunk received: ${chunk.length} bytes`);
        responseData += chunk;
    });
    
    res.on('end', () => {
        console.log(`✅ Response complete: ${responseData.length} bytes total`);
        console.log(`📄 Response body: ${responseData}`);
        
        try {
            const json = JSON.parse(responseData);
            console.log(`✅ Valid JSON response`);
            console.log(`📊 Success: ${json.success}`);
            console.log(`💬 Message: ${json.message}`);
        } catch (parseError) {
            console.log(`❌ JSON Parse Error: ${parseError.message}`);
        }
    });
});

req.on('error', (error) => {
    console.log(`💥 Request Error: ${error.message}`);
});

req.setTimeout(10000, () => {
    console.log(`⏰ Request timeout`);
    req.destroy();
});

req.write(postData);
req.end();