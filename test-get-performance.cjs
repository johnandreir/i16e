const http = require('http');

function testGetPerformanceWebhook() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            test: true,
            dateFrom: "2024-01-01",
            dateTo: "2024-12-31"
        });
        
        const options = {
            hostname: 'localhost',
            port: 5678,
            path: '/webhook-test/get-performance',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log('🔍 Testing get-performance webhook directly...');
        console.log(`📤 Request: POST localhost:5678/webhook-test/get-performance`);
        console.log(`📦 Body: ${postData}`);

        const req = http.request(options, (res) => {
            let responseData = '';
            
            console.log(`📥 Response Status: ${res.statusCode}`);
            console.log(`📋 Response Headers:`, res.headers);
            
            res.on('data', chunk => {
                console.log(`📨 Data chunk: ${chunk.length} bytes`);
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log(`✅ Response complete: ${responseData.length} bytes total`);
                
                if (responseData.length === 0) {
                    console.log('🚫 EMPTY RESPONSE');
                    resolve({ status: res.statusCode, data: '', empty: true });
                } else {
                    console.log(`📄 Response body: "${responseData}"`);
                    
                    try {
                        const json = JSON.parse(responseData);
                        console.log('✅ Valid JSON response');
                        console.log(`📊 JSON structure:`, json);
                        resolve({ status: res.statusCode, data: responseData, json: json, valid: true });
                    } catch (parseError) {
                        console.log(`❌ Invalid JSON: ${parseError.message}`);
                        resolve({ status: res.statusCode, data: responseData, parseError: parseError.message, valid: false });
                    }
                }
            });
        });

        req.on('error', (error) => {
            console.log(`💥 Request Error: ${error.message}`);
            reject(error);
        });

        req.setTimeout(15000, () => {
            console.log(`⏰ Request timeout after 15 seconds`);
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.write(postData);
        req.end();
    });
}

async function main() {
    console.log('🧪 Testing N8N get-performance webhook...\n');

    try {
        const result = await testGetPerformanceWebhook();
        
        console.log('\n📋 Test Summary:');
        console.log(`Status Code: ${result.status}`);
        console.log(`Response Length: ${result.data.length} bytes`);
        console.log(`Valid JSON: ${result.valid ? 'Yes' : 'No'}`);
        console.log(`Empty Response: ${result.empty ? 'Yes' : 'No'}`);
        
        if (result.status === 200 && result.valid) {
            console.log('✅ get-performance webhook is working correctly!');
        } else {
            console.log('❌ get-performance webhook has issues');
            if (result.empty) {
                console.log('   Issue: Empty response from N8N');
            }
            if (!result.valid && !result.empty) {
                console.log('   Issue: Invalid JSON response');
            }
            if (result.status !== 200) {
                console.log(`   Issue: Bad status code ${result.status}`);
            }
        }
        
    } catch (error) {
        console.log('\n📋 Test Summary:');
        console.log(`❌ Test failed: ${error.message}`);
    }
}

main();