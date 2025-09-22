const http = require('http');

// Simple HTTP test - no fetch() to avoid issues
function testEndpoint(path) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:3001${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
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

async function testAll() {
    console.log('🧪 Testing with simple HTTP client...\n');
    
    const tests = [
        '/api/health',
        '/api/simple-debug', 
        '/api/n8n/health',
        '/api/routes'
    ];
    
    for (const path of tests) {
        try {
            console.log(`Testing ${path}...`);
            const result = await testEndpoint(path);
            console.log(`  Status: ${result.status}`);
            
            if (result.status === 200) {
                console.log('  ✅ SUCCESS');
                if (path === '/api/routes') {
                    const routes = JSON.parse(result.data);
                    console.log('  📋 Available routes:', routes.routes.map(r => r.path));
                }
            } else {
                console.log('  ❌ FAILED');
            }
        } catch (error) {
            console.log(`  💥 ERROR: ${error.message}`);
        }
        console.log('');
    }
}

testAll();