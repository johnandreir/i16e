#!/usr/bin/env node

/**
 * MongoDB Database Inspector
 * Check which databases exist and their collections
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://admin:N0virus1!@localhost:27017?authSource=admin';

async function inspectDatabases() {
  let client;
  
  try {
    console.log('🔍 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    // List all databases
    const adminDb = client.db('admin');
    const dbList = await adminDb.admin().listDatabases();
    
    console.log('\n📊 Available databases:');
    for (const db of dbList.databases) {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    }
    
    // Check specific databases
    const targetDatabases = ['i16e-db', 'devops-insight-engine'];
    
    for (const dbName of targetDatabases) {
      console.log(`\n🔍 Inspecting database: ${dbName}`);
      const db = client.db(dbName);
      
      try {
        const collections = await db.listCollections().toArray();
        
        if (collections.length === 0) {
          console.log(`  ❌ Database ${dbName} has no collections or doesn't exist`);
          continue;
        }
        
        console.log(`  ✅ Collections in ${dbName}:`);
        
        for (const collection of collections) {
          const collectionName = collection.name;
          try {
            const count = await db.collection(collectionName).countDocuments();
            console.log(`    - ${collectionName}: ${count} documents`);
            
            // Show sample data for main collections
            if (['teams', 'squads', 'dpes', 'performance_data'].includes(collectionName) && count > 0) {
              const sample = await db.collection(collectionName).findOne();
              console.log(`      Sample: ${JSON.stringify(sample, null, 2).substring(0, 200)}...`);
            }
          } catch (err) {
            console.log(`    - ${collectionName}: Error getting count - ${err.message}`);
          }
        }
      } catch (err) {
        console.log(`  ❌ Error accessing database ${dbName}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to inspect databases:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ Connection closed');
    }
  }
}

// Run the inspection
inspectDatabases();