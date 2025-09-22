import http from 'http';

console.log('=== Testing New Singular API Endpoints ===');

// Create a new team using /api/team
const createTeam = (name) => {
  return new Promise((resolve, reject) => {
    const teamData = JSON.stringify({ name });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/team',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(teamData)
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
    req.write(teamData);
    req.end();
  });
};

// Create a new squad using /api/squad
const createSquad = (name, teamID) => {
  return new Promise((resolve, reject) => {
    const squadData = JSON.stringify({ name, teamID });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/squad',
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

// Create a new DPE using /api/dpe
const createDPE = (name, squadID) => {
  return new Promise((resolve, reject) => {
    const dpeData = JSON.stringify({ name, squadID });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/dpe',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dpeData)
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
    req.write(dpeData);
    req.end();
  });
};

(async () => {
  try {
    console.log('1. Creating new team via /api/team...');
    const teamResult = await createTeam('Development Team');
    console.log('Team Status:', teamResult.status);
    console.log('Team Response:', teamResult.body);
    
    if (teamResult.status === 200) {
      const team = JSON.parse(teamResult.body);
      
      console.log('\n2. Creating new squad via /api/squad...');
      const squadResult = await createSquad('Backend Squad', team.id);
      console.log('Squad Status:', squadResult.status);
      console.log('Squad Response:', squadResult.body);
      
      if (squadResult.status === 200) {
        const squad = JSON.parse(squadResult.body);
        
        console.log('\n3. Creating new DPE via /api/dpe...');
        const dpeResult = await createDPE('Alice Engineer', squad.id);
        console.log('DPE Status:', dpeResult.status);
        console.log('DPE Response:', dpeResult.body);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();