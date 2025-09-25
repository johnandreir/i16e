// Debug script to check satisfaction data availability
const { MongoClient } = require('mongodb');

async function debugSatisfactionData() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    
    const db = client.db('devops_insight');
    const collection = db.collection('performance_data');
    
    console.log('\n📊 CHECKING SATISFACTION DATA AVAILABILITY');
    console.log('=' .repeat(50));
    
    // Get all unique entities
    const entities = await collection.distinct('entity_name');
    console.log(`\n🔍 Found ${entities.length} unique entities in performance_data:`);
    entities.forEach(entity => console.log(`  - ${entity}`));
    
    console.log('\n📈 SATISFACTION DATA STATUS:');
    console.log('-'.repeat(50));
    
    for (const entityName of entities) {
      // Get most recent record for this entity
      const records = await collection.find({ entity_name: entityName })
        .sort({ date: -1 })
        .limit(1)
        .toArray();
      
      if (records.length > 0) {
        const record = records[0];
        const hasCustomerSatisfaction = !!(record.metrics?.customerSatisfaction);
        const hasSurveyDetails = !!(record.surveyDetails);
        
        console.log(`\n📍 ${entityName}:`);
        console.log(`   Date: ${record.date}`);
        console.log(`   CustomerSatisfaction: ${hasCustomerSatisfaction ? '✅ YES' : '❌ NO'}`);
        console.log(`   SurveyDetails: ${hasSurveyDetails ? '✅ YES' : '❌ NO'}`);
        
        if (hasCustomerSatisfaction) {
          const cs = record.metrics.customerSatisfaction;
          console.log(`   CSAT: ${cs.csat}/${cs.total} (${cs.csatPercentage}%)`);
          console.log(`   Neutral: ${cs.neutral}/${cs.total} (${cs.neutralPercentage}%)`);
          console.log(`   DSAT: ${cs.dsat}/${cs.total} (${cs.dsatPercentage}%)`);
        }
        
        if (hasSurveyDetails) {
          console.log(`   Survey count: ${record.surveyDetails.length}`);
        }
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('-'.repeat(30));
    
    const entitiesWithSatisfaction = [];
    const entitiesWithoutSatisfaction = [];
    
    for (const entityName of entities) {
      const records = await collection.find({ entity_name: entityName })
        .sort({ date: -1 })
        .limit(1)
        .toArray();
      
      if (records.length > 0 && records[0].metrics?.customerSatisfaction) {
        entitiesWithSatisfaction.push(entityName);
      } else {
        entitiesWithoutSatisfaction.push(entityName);
      }
    }
    
    console.log(`✅ Entities WITH satisfaction data (${entitiesWithSatisfaction.length}):`);
    entitiesWithSatisfaction.forEach(name => console.log(`   - ${name}`));
    
    console.log(`❌ Entities WITHOUT satisfaction data (${entitiesWithoutSatisfaction.length}):`);
    entitiesWithoutSatisfaction.forEach(name => console.log(`   - ${name}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 13) {
      console.log('\n💡 Authentication required. Trying to connect without auth...');
      // Try different connection approaches here if needed
    }
    
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔗 MongoDB connection closed');
    }
  }
}

// Run the debug script
console.log('🚀 Starting satisfaction data debug...');
debugSatisfactionData().catch(console.error);