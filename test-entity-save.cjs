const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';

async function testEntitySave() {
  try {
    console.log('🧪 Testing where entities are being saved...');
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Check i16e-db
    const i16eDb = client.db('i16e-db');
    const i16eTeams = await i16eDb.collection('teams').find({}).toArray();
    const i16eSquads = await i16eDb.collection('squads').find({}).toArray();
    const i16eDpes = await i16eDb.collection('dpes').find({}).toArray();
    
    console.log('\n📊 i16e-db database contents:');
    console.log(`Teams: ${i16eTeams.length}`);
    console.log(`Squads: ${i16eSquads.length}`);
    console.log(`DPEs: ${i16eDpes.length}`);
    
    if (i16eTeams.length > 0) {
      console.log('Sample team:', JSON.stringify(i16eTeams[0], null, 2));
    }
    
    // Check devops-insight-engine database
    const devopsDb = client.db('devops-insight-engine');
    const devopsTeams = await devopsDb.collection('teams').find({}).toArray();
    const devopsSquads = await devopsDb.collection('squads').find({}).toArray();
    const devopsDpes = await devopsDb.collection('dpes').find({}).toArray();
    
    console.log('\n📊 devops-insight-engine database contents:');
    console.log(`Teams: ${devopsTeams.length}`);
    console.log(`Squads: ${devopsSquads.length}`);
    console.log(`DPEs: ${devopsDpes.length}`);
    
    if (devopsTeams.length > 0) {
      console.log('Sample team:', JSON.stringify(devopsTeams[0], null, 2));
    }
    
    await client.close();
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEntitySave();