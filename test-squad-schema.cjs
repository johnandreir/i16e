#!/usr/bin/env node

/**
 * Test Squad Collection Schema
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';

async function testSquadCollection() {
  console.log('🔍 Testing Squad Collection Schema...\n');

  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('i16e-db');
    
    // Get sample Squad records
    const squads = await db.collection('squads').find({}).limit(3).toArray();
    console.log(`\n📄 Sample Squad records (${squads.length} found):`);
    
    squads.forEach((squad, index) => {
      console.log(`\nSquad ${index + 1}:`);
      console.log(`  _id: ${squad._id} (type: ${typeof squad._id})`);
      console.log(`  name: ${squad.name}`);
      console.log(`  teamID variants:`);
      console.log(`    - teamID: ${squad.teamID} (${typeof squad.teamID})`);
      console.log(`    - teamId: ${squad.teamId} (${typeof squad.teamId})`);
      console.log(`    - team_id: ${squad.team_id} (${typeof squad.team_id})`);
      console.log(`  description: ${squad.description}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔒 MongoDB connection closed');
    }
  }
}

testSquadCollection();