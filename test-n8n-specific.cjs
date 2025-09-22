const http = require('http');

function testN8NHealth() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3001/api/n8n/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function testN8N() {
    console.log('🎯 Testing N8N Health endpoint specifically...\n');
    
    try {
        const result = await testN8NHealth();
        console.log(`Status: ${result.status}`);
        console.log(`Content-Type: ${result.headers['content-type']}`);
        console.log(`Data length: ${result.data.length}`);
        
        if (result.status === 200) {
            console.log('✅ SUCCESS! N8N Health endpoint is working');
            try {
                const jsonData = JSON.parse(result.data);
                console.log('\n📊 N8N Health Details:');
                console.log(`- Service Reachable: ${jsonData.n8nHealth?.n8nServiceStatus?.reachable}`);
                console.log(`- Workflow Count: ${jsonData.n8nHealth?.n8nWorkflowStatus?.totalCount}`);
                console.log(`- Active Workflows: ${jsonData.n8nHealth?.n8nWorkflowStatus?.activeCount}`);
                console.log(`- Overall Healthy: ${jsonData.overall?.healthy}`);
            } catch (parseError) {
                console.log('⚠️ Could not parse JSON response');
            }
        } else {
            console.log('❌ FAILED');
            console.log(`Response: ${result.data}`);
        }
    } catch (error) {
        console.log(`💥 ERROR: ${error.message}`);
    }
}

testN8N();