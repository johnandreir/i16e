const http = require('http');

function testWebhookPath(path) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ test: true });
        
        const options = {
            hostname: 'localhost',
            port: 5678,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            resolve(res.statusCode);
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => resolve(null));

        req.write(postData);
        req.end();
    });
}

async function findWorkingWebhooks() {
    console.log('🔍 Searching for working webhook paths...\n');

    const pathsToTest = [
        '/webhook-test/get-performance',
        '/webhook-test/get-metrics', 
        '/webhook/get-performance',
        '/webhook/get-metrics',
        '/webhook/get-cases',
        '/webhook/calculate-metrics',
        '/webhook-test/get-cases',
        '/webhook-test/calculate-metrics',
        '/webhook/performance',
        '/webhook/metrics'
    ];

    const results = [];
    
    for (const path of pathsToTest) {
        const status = await testWebhookPath(path);
        const result = { path, status };
        results.push(result);
        
        if (status === 200) {
            console.log(`✅ ${path} → ${status} (WORKING)`);
        } else if (status === 404) {
            console.log(`❌ ${path} → ${status} (NOT FOUND)`);
        } else if (status) {
            console.log(`⚠️ ${path} → ${status}`);
        } else {
            console.log(`💥 ${path} → TIMEOUT/ERROR`);
        }
    }

    console.log('\n📊 Summary of working webhooks:');
    const working = results.filter(r => r.status === 200);
    if (working.length > 0) {
        working.forEach(w => console.log(`   ✅ ${w.path}`));
    } else {
        console.log('   ❌ No working webhooks found');
    }
}

findWorkingWebhooks();