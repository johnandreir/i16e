const http = require('http');

function testAPIEndpoint(path, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: responseData
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Timeout after 30 seconds'));
        });

        req.write(postData);
        req.end();
    });
}

async function detailedAPITest() {
    console.log('🧪 Detailed API Endpoint Testing...\n');

    const testData = {
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
        test: true
    };

    // Test 1: Get Cases
    console.log('1️⃣ Testing /api/n8n/get-cases...');
    try {
        const start = Date.now();
        const result = await testAPIEndpoint('/api/n8n/get-cases', testData);
        const duration = Date.now() - start;
        
        console.log(`   ⏱️ Duration: ${duration}ms`);
        console.log(`   📊 Status: ${result.status}`);
        console.log(`   📋 Response: ${result.data.substring(0, 200)}${result.data.length > 200 ? '...' : ''}`);
        
        if (result.status === 200) {
            try {
                const json = JSON.parse(result.data);
                console.log(`   ✅ Success: ${json.success}`);
            } catch (e) {
                console.log(`   ⚠️ Invalid JSON response`);
            }
        }
    } catch (error) {
        console.log(`   💥 Error: ${error.message}`);
    }

    console.log();

    // Test 2: Calculate Metrics
    console.log('2️⃣ Testing /api/n8n/calculate-metrics...');
    try {
        const start = Date.now();
        const result = await testAPIEndpoint('/api/n8n/calculate-metrics', testData);
        const duration = Date.now() - start;
        
        console.log(`   ⏱️ Duration: ${duration}ms`);
        console.log(`   📊 Status: ${result.status}`);
        console.log(`   📋 Response: ${result.data.substring(0, 200)}${result.data.length > 200 ? '...' : ''}`);
        
        if (result.status === 200) {
            try {
                const json = JSON.parse(result.data);
                console.log(`   ✅ Success: ${json.success}`);
            } catch (e) {
                console.log(`   ⚠️ Invalid JSON response`);
            }
        }
    } catch (error) {
        console.log(`   💥 Error: ${error.message}`);
    }

    console.log('\n🏁 Detailed testing completed.');
}

detailedAPITest();