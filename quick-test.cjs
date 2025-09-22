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

console.log('Testing calculate-metrics endpoint...');
testAPIEndpoint('/api/n8n/calculate-metrics', {
    test: true,
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31"
}).then(result => {
    console.log(`Status: ${result.status}`);
    console.log(`Response: ${result.data}`);
}).catch(error => {
    console.log(`Error: ${error.message}`);
});