// Test creating a team directly via the MongoDB API
async function testCreateTeam() {
  try {
    console.log('🧪 Testing team creation via MongoDB API...');
    
    const testTeam = {
      name: `Test Team ${Date.now()}`
    };
    
    // For Node.js without fetch
    const http = require('http');
    
    const postData = JSON.stringify(testTeam);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/teams',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response data:', data);
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCreateTeam();

// Wait a bit and then check both databases
setTimeout(async () => {
  const { MongoClient } = require('mongodb');
  const MONGODB_URI = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';
  
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    // Check i16e-db
    const i16eDb = client.db('i16e-db');
    const i16eTeams = await i16eDb.collection('teams').find({}).toArray();
    
    // Check devops-insight-engine database
    const devopsDb = client.db('devops-insight-engine');
    const devopsTeams = await devopsDb.collection('teams').find({}).toArray();
    
    console.log('\n📊 After API test:');
    console.log(`i16e-db teams: ${i16eTeams.length}`);
    console.log(`devops-insight-engine teams: ${devopsTeams.length}`);
    
    if (i16eTeams.length > 0) {
      console.log('Latest i16e-db team:', JSON.stringify(i16eTeams[i16eTeams.length-1], null, 2));
    }
    if (devopsTeams.length > 0) {
      console.log('Latest devops-insight-engine team:', JSON.stringify(devopsTeams[devopsTeams.length-1], null, 2));
    }
    
    await client.close();
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}, 2000);