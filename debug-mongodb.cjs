const { MongoClient } = require('mongodb');

async function debugMongoDB() {
  try {
    console.log('🔍 Debugging MongoDB connection and databases...');
    
    const MONGODB_URI = 'mongodb://admin:N0virus1!@localhost:27017?authSource=admin';
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('✅ Connected to MongoDB');
    
    // List all databases
    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();
    
    console.log('\n📊 Available databases:');
    result.databases.forEach(db => {
      console.log(`- ${db.name}: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
    });
    
    // Check i16e-db specifically
    console.log('\n🔍 Checking i16e-db database:');
    const i16eDb = client.db('i16e-db');
    const collections = await i16eDb.listCollections().toArray();
    
    console.log('Collections in i16e-db:');
    for (const collection of collections) {
      console.log(`- ${collection.name}`);
      
      // Check if this collection has any validation rules
      if (collection.options && collection.options.validator) {
        console.log(`  ⚠️  Has validation rules:`, JSON.stringify(collection.options.validator, null, 2));
      }
    }
    
    // Try to manually insert a team into i16e-db
    console.log('\n🧪 Testing manual team insertion into i16e-db...');
    try {
      const teamsCollection = i16eDb.collection('teams');
      const testTeam = {
        name: `Manual Test Team ${Date.now()}`,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const insertResult = await teamsCollection.insertOne(testTeam);
      console.log('✅ Manual insertion successful:', insertResult.insertedId);
      
      // Verify it's there
      const teams = await teamsCollection.find({}).toArray();
      console.log(`📊 Teams in i16e-db after manual insert: ${teams.length}`);
      
    } catch (insertError) {
      console.error('❌ Manual insertion failed:', insertError);
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugMongoDB();