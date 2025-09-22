const http = require('http');

function detailedTest(path) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:3001${path}`, (res) => {
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
        req.setTimeout(3000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function detailedTestRun() {
    console.log('🔬 Detailed endpoint testing...\n');
    
    // Test working endpoint
    try {
        console.log('Testing /api/health (working):');
        const health = await detailedTest('/api/health');
        console.log(`  Status: ${health.status}`);
        console.log(`  Content-Type: ${health.headers['content-type']}`);
        console.log(`  Data length: ${health.data.length}`);
        console.log(`  Data preview: ${health.data.substring(0, 100)}...\n`);
    } catch (error) {
        console.log(`  Error: ${error.message}\n`);
    }
    
    // Test non-working endpoint
    try {
        console.log('Testing /api/simple-debug (not working):');
        const debug = await detailedTest('/api/simple-debug');
        console.log(`  Status: ${debug.status}`);
        console.log(`  Content-Type: ${debug.headers['content-type']}`);
        console.log(`  Data length: ${debug.data.length}`);
        console.log(`  Data: ${debug.data}`);
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
}

detailedTestRun();