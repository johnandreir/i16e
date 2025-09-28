const { MongoClient } = require('mongodb');

async function checkPerformanceData() {
  const client = new MongoClient('mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('i16e-db');
    const collection = db.collection('performance_data');
    
    // Count total documents
    const count = await collection.countDocuments();
    console.log(`📊 Total documents in performance_data: ${count}`);
    
    if (count === 0) {
      console.log('❌ No data found in performance_data collection');
      return;
    }
    
    // Get sample documents
    const samples = await collection.find({}).limit(3).toArray();
    console.log('\n📋 Sample documents:');
    
    samples.forEach((doc, index) => {
      console.log(`\n🔹 Document ${index + 1}:`);
      console.log(`  Entity: ${doc.entity_name} (${doc.entity_type})`);
      console.log(`  Date: ${doc.date}`);
      console.log(`  Full JSON structure:`);
      console.log(JSON.stringify(doc, null, 2));
    });
    
    // Check for specific entities
    const entities = await collection.distinct('entity_name');
    console.log(`\n📝 Available entities: ${entities.join(', ')}`);
    
    // Check recent data
    const recent = await collection.find({}).sort({ date: -1 }).limit(1).toArray();
    if (recent.length > 0) {
      console.log(`\n📅 Most recent data: ${recent[0].date} (${recent[0].entity_name})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔚 Database connection closed');
  }
}

checkPerformanceData().catch(console.error);