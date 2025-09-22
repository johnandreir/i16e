const http = require('http');

function testN8NWebhookDetailed(path) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            test: true,
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
            
            res.on('data', chunk => {
                responseData += chunk;
                console.log(`   📦 Received chunk: ${chunk.length} bytes`);
            });
            
            res.on('end', () => {
                console.log(`   📋 Total response: ${responseData.length} bytes`);
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: responseData,
                    length: responseData.length
                });
            });
        });

        req.on('error', (error) => {
            console.log(`   💥 Request error: ${error.message}`);
            reject(error);
        });

        req.setTimeout(15000, () => {
            console.log(`   ⏰ Request timeout after 15 seconds`);
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.write(postData);
        req.end();
    });
}

async function detailedN8NTest() {
    console.log('🔍 Detailed N8N Webhook Testing...\n');

    const webhooks = [
        '/webhook-test/get-performance',
        '/webhook-test/get-metrics'
    ];

    for (const webhook of webhooks) {
        console.log(`Testing: ${webhook}`);
        try {
            const start = Date.now();
            const result = await testN8NWebhookDetailed(webhook);
            const duration = Date.now() - start;
            
            console.log(`   ⏱️ Duration: ${duration}ms`);
            console.log(`   📊 Status: ${result.status}`);
            console.log(`   📏 Content-Length: ${result.headers['content-length'] || 'Not set'}`);
            console.log(`   🎭 Content-Type: ${result.headers['content-type'] || 'Not set'}`);
            
            if (result.data.length === 0) {
                console.log('   🚫 EMPTY RESPONSE');
            } else {
                console.log(`   📄 Response preview: "${result.data.substring(0, 100)}${result.data.length > 100 ? '...' : ''}"`);
                
                if (result.data.trim()) {
                    try {
                        const json = JSON.parse(result.data);
                        console.log('   ✅ Valid JSON response');
                        console.log(`   📊 JSON keys: ${Object.keys(json).join(', ')}`);
                    } catch (parseError) {
                        console.log(`   ❌ Invalid JSON: ${parseError.message}`);
                        console.log(`   🔍 Raw content: "${result.data}"`);
                    }
                } else {
                    console.log('   ⚠️ Empty response body');
                }
            }
        } catch (error) {
            console.log(`   💥 ERROR: ${error.message}`);
        }
        console.log();
    }
}

detailedN8NTest();