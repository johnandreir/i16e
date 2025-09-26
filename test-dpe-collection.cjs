#!/usr/bin/env node

/**
 * Test DPE Collection and ObjectId Issues
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';

async function testDPECollection() {
  console.log('🔍 Testing DPE Collection Issues...\n');

  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('i16e-db');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Check if 'dpes' collection exists
    const dpeCollection = collections.find(col => col.name === 'dpes');
    if (!dpeCollection) {
      console.log('\n❌ DPE collection not found!');
      // Try alternative names
      const alternatives = ['dpe', 'DPEs', 'DPE'];
      for (const alt of alternatives) {
        const altCollection = collections.find(col => col.name === alt);
        if (altCollection) {
          console.log(`✅ Found alternative collection: ${alt}`);
        }
      }
      return;
    }

    console.log('\n✅ DPE collection found');

    // Get sample DPE records
    const dpes = await db.collection('dpes').find({}).limit(3).toArray();
    console.log(`\n📄 Sample DPE records (${dpes.length} found):`);
    
    dpes.forEach((dpe, index) => {
      console.log(`\nDPE ${index + 1}:`);
      console.log(`  _id: ${dpe._id} (type: ${typeof dpe._id})`);
      console.log(`  name: ${dpe.name}`);
      console.log(`  squadID variants:`);
      console.log(`    - squadID: ${dpe.squadID} (${typeof dpe.squadID})`);
      console.log(`    - squadId: ${dpe.squadId} (${typeof dpe.squadId})`);
      console.log(`    - squad_id: ${dpe.squad_id} (${typeof dpe.squad_id})`);
      console.log(`  email: ${dpe.email}`);
      console.log(`  role: ${dpe.role}`);
      
      // Test ObjectId validation
      try {
        const isValidId = ObjectId.isValid(dpe._id.toString());
        console.log(`  ObjectId valid: ${isValidId}`);
        
        if (dpe.squadID) {
          const isValidSquadId = ObjectId.isValid(dpe.squadID.toString());
          console.log(`  SquadID valid: ${isValidSquadId}`);
        }
      } catch (error) {
        console.log(`  ObjectId test error: ${error.message}`);
      }
    });

    // Test a simple update operation
    if (dpes.length > 0) {
      const testDpe = dpes[0];
      console.log(`\n🔄 Testing update operation on DPE: ${testDpe.name}`);
      
      try {
        const updateResult = await db.collection('dpes').findOneAndUpdate(
          { _id: testDpe._id },
          { $set: { name: testDpe.name + ' (TEST)' } },
          { returnDocument: 'after' }
        );
        
        console.log('✅ Update test successful');
        console.log('Update result:', updateResult);
        
        // Revert the change
        await db.collection('dpes').findOneAndUpdate(
          { _id: testDpe._id },
          { $set: { name: testDpe.name } },
          { returnDocument: 'after' }
        );
        console.log('✅ Reverted test change');
        
      } catch (error) {
        console.error('❌ Update test failed:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔒 MongoDB connection closed');
    }
  }
}

testDPECollection();