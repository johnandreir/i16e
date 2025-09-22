const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';
  const client = new MongoClient(uri);
  
  try {
    console.log('🔄 Testing MongoDB connection...');
    await client.connect();
    
    const db = client.db('i16e-db');
    console.log('✅ Connected to i16e-db database');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📊 Collections in i16e-db:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check data in each target collection
    const targetCollections = ['teams', 'squads', 'dpes', 'performance_data'];
    
    for (const collectionName of targetCollections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`📈 ${collectionName}: ${count} documents`);
        
        if (count > 0) {
          const sample = await collection.findOne();
          console.log(`  Sample document:`, JSON.stringify(sample, null, 2));
        }
      } catch (error) {
        console.log(`❌ Error accessing ${collectionName}:`, error.message);
      }
    }
    
    // Also check if there's a devops-insight-engine database
    console.log('\n🔍 Checking for old devops-insight-engine database...');
    const admin = client.db('admin');
    const databases = await admin.admin().listDatabases();
    
    const oldDb = databases.databases.find(db => db.name === 'devops-insight-engine');
    if (oldDb) {
      console.log('⚠️  Found old devops-insight-engine database!');
      const oldDbInstance = client.db('devops-insight-engine');
      const oldCollections = await oldDbInstance.listCollections().toArray();
      console.log('📊 Collections in devops-insight-engine:');
      oldCollections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
      
      for (const collectionName of targetCollections) {
        try {
          const collection = oldDbInstance.collection(collectionName);
          const count = await collection.countDocuments();
          if (count > 0) {
            console.log(`📈 OLD DB ${collectionName}: ${count} documents`);
          }
        } catch (error) {
          // Collection doesn't exist, ignore
        }
      }
    } else {
      console.log('✅ No old devops-insight-engine database found');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();