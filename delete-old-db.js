#!/usr/bin/env node

/**
 * Delete Old Database Script
 * Removes the devops-insight-engine database since we're now using i16e-db
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://admin:N0virus1!@localhost:27017?authSource=admin';

async function deleteOldDatabase() {
  let client;
  
  try {
    console.log('🔍 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const dbName = 'devops-insight-engine';
    console.log(`\n⚠️  About to delete database: ${dbName}`);
    
    // Check what's in the database first
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log(`❌ Database ${dbName} has no collections or doesn't exist`);
      return;
    }
    
    console.log(`📊 Current collections in ${dbName}:`);
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documents`);
    }
    
    // Confirm deletion
    console.log(`\n🗑️  Proceeding to delete database: ${dbName}`);
    
    // Drop the database
    await db.dropDatabase();
    
    console.log(`✅ Successfully deleted database: ${dbName}`);
    
    // Verify deletion
    const adminDb = client.db('admin');
    const dbList = await adminDb.admin().listDatabases();
    const remainingDbs = dbList.databases.map(db => db.name);
    
    if (remainingDbs.includes(dbName)) {
      console.log(`❌ Warning: Database ${dbName} still exists after deletion attempt`);
    } else {
      console.log(`✅ Confirmed: Database ${dbName} has been completely removed`);
    }
    
    console.log(`\n📊 Remaining databases:`);
    for (const db of dbList.databases) {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    }
    
  } catch (error) {
    console.error('❌ Failed to delete database:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ Connection closed');
    }
  }
}

// Run the deletion
deleteOldDatabase();