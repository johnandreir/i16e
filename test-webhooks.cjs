const http = require('http');

function testWebhookEndpoint(path, data) {
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
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.write(postData);
        req.end();
    });
}

async function testWebhooks() {
    console.log('🧪 Testing N8N Webhook Endpoints...\n');

    const testData = {
        dateFrom: "2024-01-01",
        dateTo: "2024-12-31",
        test: true,
        source: "api-test"
    };

    // Test Get Cases webhook
    console.log('1. Testing /api/n8n/get-cases...');
    try {
        const getCasesResult = await testWebhookEndpoint('/api/n8n/get-cases', testData);
        console.log(`   Status: ${getCasesResult.status}`);
        console.log(`   Content-Type: ${getCasesResult.headers['content-type']}`);
        
        if (getCasesResult.status === 200) {
            console.log('   ✅ SUCCESS');
            try {
                const jsonData = JSON.parse(getCasesResult.data);
                console.log(`   📊 Response: ${jsonData.success ? 'Success' : 'Failed'}`);
                if (jsonData.data) {
                    console.log(`   📋 Data received: ${Array.isArray(jsonData.data) ? jsonData.data.length + ' items' : 'Object'}`);
                }
            } catch (parseError) {
                console.log(`   ⚠️ Response: ${getCasesResult.data.substring(0, 100)}...`);
            }
        } else {
            console.log('   ❌ FAILED');
            console.log(`   Response: ${getCasesResult.data}`);
        }
    } catch (error) {
        console.log(`   💥 ERROR: ${error.message}`);
    }

    console.log();

    // Test Calculate Metrics webhook
    console.log('2. Testing /api/n8n/calculate-metrics...');
    try {
        const metricsResult = await testWebhookEndpoint('/api/n8n/calculate-metrics', testData);
        console.log(`   Status: ${metricsResult.status}`);
        console.log(`   Content-Type: ${metricsResult.headers['content-type']}`);
        
        if (metricsResult.status === 200) {
            console.log('   ✅ SUCCESS');
            try {
                const jsonData = JSON.parse(metricsResult.data);
                console.log(`   📊 Response: ${jsonData.success ? 'Success' : 'Failed'}`);
                if (jsonData.data) {
                    console.log(`   📋 Data received: ${Array.isArray(jsonData.data) ? jsonData.data.length + ' items' : 'Object'}`);
                }
            } catch (parseError) {
                console.log(`   ⚠️ Response: ${metricsResult.data.substring(0, 100)}...`);
            }
        } else {
            console.log('   ❌ FAILED');
            console.log(`   Response: ${metricsResult.data}`);
        }
    } catch (error) {
        console.log(`   💥 ERROR: ${error.message}`);
    }

    console.log('\n🏁 Webhook testing completed.');
}

testWebhooks();