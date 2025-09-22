const { MongoClient } = require('mongodb');

async function clearAllData() {
  const uri = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';
  const client = new MongoClient(uri);
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('i16e-db');
    console.log('✅ Connected to i16e-db database');
    
    // Collections to clear
    const collections = ['teams', 'squads', 'dpes', 'performance_data'];
    
    console.log('🗑️  Starting data clearing process...');
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const countBefore = await collection.countDocuments();
        
        if (countBefore > 0) {
          const result = await collection.deleteMany({});
          console.log(`✅ Cleared ${collectionName}: ${result.deletedCount} documents deleted`);
        } else {
          console.log(`ℹ️  ${collectionName}: already empty`);
        }
      } catch (error) {
        console.error(`❌ Error clearing ${collectionName}:`, error.message);
      }
    }
    
    // Also clear the old devops-insight-engine database if it exists
    console.log('\n🗑️  Clearing old devops-insight-engine database...');
    try {
      const oldDb = client.db('devops-insight-engine');
      const oldCollections = await oldDb.listCollections().toArray();
      
      for (const col of oldCollections) {
        try {
          const collection = oldDb.collection(col.name);
          const countBefore = await collection.countDocuments();
          
          if (countBefore > 0) {
            const result = await collection.deleteMany({});
            console.log(`✅ Cleared old ${col.name}: ${result.deletedCount} documents deleted`);
          }
        } catch (error) {
          console.error(`❌ Error clearing old ${col.name}:`, error.message);
        }
      }
    } catch (error) {
      console.log('ℹ️  No old devops-insight-engine database found or error accessing it');
    }
    
    console.log('\n🎉 Data clearing completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to clear data:', error.message);
  } finally {
    await client.close();
  }
}

clearAllData();