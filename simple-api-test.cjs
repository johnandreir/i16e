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

async function testAPI() {
    console.log('🧪 Testing API endpoints after Docker deployment...\n');

    try {
        // Test basic connectivity
        console.log('1. Testing basic connectivity...');
        const teamsResponse = await makeRequest('GET', '/api/team');
        console.log(`GET /api/team - Status: ${teamsResponse.status}`);
        
        if (teamsResponse.status === 200 && Array.isArray(teamsResponse.data)) {
            console.log(`✅ API is responsive, found ${teamsResponse.data.length} teams`);
            
            // Find a team to test updates
            if (teamsResponse.data.length > 0) {
                const testTeam = teamsResponse.data[0];
                console.log(`\n2. Testing Team Update (previous 404 error)...`);
                console.log(`Testing with team: ${testTeam.name} (${testTeam.id})`);
                
                const teamUpdatePayload = {
                    name: testTeam.name + ' [UPDATED]',
                    teamID: testTeam.teamID || testTeam.id
                };
                
                const teamUpdateResponse = await makeRequest('PUT', `/api/team/${testTeam.id}`, teamUpdatePayload);
                console.log(`PUT /api/team/${testTeam.id} - Status: ${teamUpdateResponse.status}`);
                console.log('Response:', teamUpdateResponse.data);
                
                if (teamUpdateResponse.status === 200) {
                    console.log('✅ Team update successful - 404 error fixed!');
                } else {
                    console.log(`❌ Team update failed with status ${teamUpdateResponse.status}`);
                }
            }
        } else {
            console.log(`❌ Unexpected response - Status: ${teamsResponse.status}`);
            console.log('Response:', teamsResponse.data);
        }

        // Test DPE endpoints
        console.log('\n3. Testing DPE endpoints (previous 503 error)...');
        const dpeResponse = await makeRequest('GET', '/api/dpe');
        console.log(`GET /api/dpe - Status: ${dpeResponse.status}`);
        
        if (dpeResponse.status === 200 && Array.isArray(dpeResponse.data)) {
            console.log(`✅ DPE API responsive, found ${dpeResponse.data.length} DPE records`);
            
            if (dpeResponse.data.length > 0) {
                const testDPE = dpeResponse.data[0];
                console.log(`Testing with DPE: ${testDPE.name} (${testDPE.id})`);
                
                const dpeUpdatePayload = {
                    name: testDPE.name + ' [UPDATED]',
                    squadID: testDPE.squadID
                };
                
                const dpeUpdateResponse = await makeRequest('PUT', `/api/dpe/${testDPE.id}`, dpeUpdatePayload);
                console.log(`PUT /api/dpe/${testDPE.id} - Status: ${dpeUpdateResponse.status}`);
                console.log('Response:', dpeUpdateResponse.data);
                
                if (dpeUpdateResponse.status === 200) {
                    console.log('✅ DPE update successful - 503 error fixed!');
                } else {
                    console.log(`❌ DPE update failed with status ${dpeUpdateResponse.status}`);
                }
            }
        } else {
            console.log(`❌ DPE endpoint issue - Status: ${dpeResponse.status}`);
            console.log('Response:', dpeResponse.data);
        }

        // Test Squad endpoints  
        console.log('\n4. Testing Squad endpoints (previous 503 error)...');
        const squadResponse = await makeRequest('GET', '/api/squad');
        console.log(`GET /api/squad - Status: ${squadResponse.status}`);
        
        if (squadResponse.status === 200 && Array.isArray(squadResponse.data)) {
            console.log(`✅ Squad API responsive, found ${squadResponse.data.length} squads`);
            
            if (squadResponse.data.length > 0) {
                const testSquad = squadResponse.data[0];
                console.log(`Testing with Squad: ${testSquad.name} (${testSquad.id})`);
                
                const squadUpdatePayload = {
                    name: testSquad.name + ' [UPDATED]',
                    teamID: testSquad.teamID
                };
                
                const squadUpdateResponse = await makeRequest('PUT', `/api/squad/${testSquad.id}`, squadUpdatePayload);
                console.log(`PUT /api/squad/${testSquad.id} - Status: ${squadUpdateResponse.status}`);
                console.log('Response:', squadUpdateResponse.data);
                
                if (squadUpdateResponse.status === 200) {
                    console.log('✅ Squad update successful - 503 error fixed!');
                } else {
                    console.log(`❌ Squad update failed with status ${squadUpdateResponse.status}`);
                }
            }
        } else {
            console.log(`❌ Squad endpoint issue - Status: ${squadResponse.status}`);
            console.log('Response:', squadResponse.data);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }

    console.log('\n🏁 API testing completed');
}

testAPI();