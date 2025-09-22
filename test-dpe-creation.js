import http from 'http';

console.log('=== Testing DPE Creation ===');

// Get squads first
const getSquads = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/squads',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const squads = JSON.parse(body);
          resolve(squads);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

// Create DPE
const createDPE = (name, squadID) => {
  return new Promise((resolve, reject) => {
    const dpeData = JSON.stringify({ name, squadID });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/dpes',
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
    console.log('1. Getting squads...');
    const squads = await getSquads();
    const squad = squads[0];
    console.log('Squad:', squad);

    console.log('\n2. Creating DPE...');
    const result = await createDPE('John Developer', squad.id);
    console.log('Status:', result.status);
    console.log('Response:', result.body);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();