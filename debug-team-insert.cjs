const { MongoClient } = require('mongodb');

async function testTeamInsert() {
  const MONGODB_URI = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('i16e-db');
    const collection = db.collection('teams');
    
    const now = new Date();
    console.log('📅 Current date:', now);
    console.log('📅 Date type:', typeof now);
    
    const teamData = {
      name: 'Debug Test Team',
      createdAt: now,
      updatedAt: now
    };
    
    console.log('📝 Team data to insert:', JSON.stringify(teamData, null, 2));
    console.log('📝 Data types:');
    console.log('  - name:', typeof teamData.name);
    console.log('  - createdAt:', typeof teamData.createdAt, teamData.createdAt instanceof Date);
    console.log('  - updatedAt:', typeof teamData.updatedAt, teamData.updatedAt instanceof Date);
    
    const result = await collection.insertOne(teamData);
    console.log('✅ Insert successful:', result);
    
  } catch (error) {
    console.error('❌ Insert failed:', error.message);
    console.error('❌ Full error:', error);
  } finally {
    await client.close();
  }
}

testTeamInsert();