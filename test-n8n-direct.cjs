const http = require('http');

function testN8NWebhook(path) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            test: true,
            source: "direct-test",
            dateFrom: "2024-01-01",
            dateTo: "2024-12-31"
        });
        
        const options = {
            hostname: 'localhost',
            port: 5678,
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
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.write(postData);
        req.end();
    });
}

async function testN8NWebhooks() {
    console.log('🔍 Testing N8N Webhook URLs Directly...\n');

    const webhooks = [
        '/webhook-test/get-performance',
        '/webhook-test/get-metrics'
    ];

    for (const webhook of webhooks) {
        console.log(`Testing: ${webhook}`);
        try {
            const result = await testN8NWebhook(webhook);
            console.log(`   Status: ${result.status}`);
            console.log(`   Content-Type: ${result.headers['content-type'] || 'Not set'}`);
            
            if (result.status === 200) {
                console.log('   ✅ Webhook EXISTS and responds');
                console.log(`   Response: ${result.data.substring(0, 200)}${result.data.length > 200 ? '...' : ''}`);
            } else if (result.status === 404) {
                console.log('   ❌ Webhook NOT FOUND (404)');
            } else {
                console.log(`   ⚠️ Unexpected status: ${result.status}`);
                console.log(`   Response: ${result.data}`);
            }
        } catch (error) {
            console.log(`   💥 ERROR: ${error.message}`);
        }
        console.log();
    }

    console.log('🏁 Direct N8N webhook testing completed.');
}

testN8NWebhooks();