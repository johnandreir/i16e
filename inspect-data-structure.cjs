const http = require('http');

// Test function to make HTTP requests without external dependencies
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function inspectDataStructure() {
    console.log('🔍 Inspecting actual data structure...\n');

    try {
        // Check teams data structure
        console.log('=== TEAMS DATA STRUCTURE ===');
        const teamsResponse = await makeRequest('GET', '/api/team');
        if (teamsResponse.status === 200 && Array.isArray(teamsResponse.data) && teamsResponse.data.length > 0) {
            console.log('First team record:');
            console.log(JSON.stringify(teamsResponse.data[0], null, 2));
            console.log(`Team fields: ${Object.keys(teamsResponse.data[0]).join(', ')}\n`);
        }

        // Check DPE data structure
        console.log('=== DPE DATA STRUCTURE ===');
        const dpeResponse = await makeRequest('GET', '/api/dpe');
        if (dpeResponse.status === 200 && Array.isArray(dpeResponse.data) && dpeResponse.data.length > 0) {
            console.log('First DPE record:');
            console.log(JSON.stringify(dpeResponse.data[0], null, 2));
            console.log(`DPE fields: ${Object.keys(dpeResponse.data[0]).join(', ')}\n`);
        }

        // Check Squad data structure
        console.log('=== SQUAD DATA STRUCTURE ===');
        const squadResponse = await makeRequest('GET', '/api/squad');
        if (squadResponse.status === 200 && Array.isArray(squadResponse.data) && squadResponse.data.length > 0) {
            console.log('First squad record:');
            console.log(JSON.stringify(squadResponse.data[0], null, 2));
            console.log(`Squad fields: ${Object.keys(squadResponse.data[0]).join(', ')}`);
        }

    } catch (error) {
        console.error('❌ Inspection failed with error:', error.message);
    }
}

inspectDataStructure();