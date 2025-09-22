import http from 'http';

console.log('=== Testing Squad Creation with New Name ===');

// Get teams first
const getTeams = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/teams',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const teams = JSON.parse(body);
          resolve(teams);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// Create squad
const createSquad = (name, teamID) => {
  return new Promise((resolve, reject) => {
    const squadData = JSON.stringify({ name, teamID });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/squads',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(squadData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.write(squadData);
    req.end();
  });
};

(async () => {
  try {
    console.log('1. Getting teams...');
    const teams = await getTeams();
    const team = teams[0];
    console.log('Team:', team);

    console.log('\n2. Creating squad with unique name...');
    const result = await createSquad('Marketing Squad', team.id);
    console.log('Status:', result.status);
    console.log('Response:', result.body);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();