// Script to directly check what's in the database
const { MongoClient } = require('mongodb');

async function checkDatabaseRecords() {
  console.log('🔍 Checking database records directly...');
  
  const mongoUrl = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';
  const dbName = 'i16e-db';
  
  let client;
  
  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('performance_data');
    
    // Find records for Mharlee Dela Cruz
    const records = await collection.find({ 
      entity_name: 'Mharlee Dela Cruz' 
    }).sort({ date: -1 }).toArray();
    
    console.log(`📊 Found ${records.length} records for Mharlee Dela Cruz:`);
    
    records.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1}:`);
      console.log(`   ID: ${record._id}`);
      console.log(`   Date: ${record.date}`);
      console.log(`   Has customerSatisfaction: ${!!record.metrics?.customerSatisfaction}`);
      console.log(`   Has surveyDetails: ${!!record.surveyDetails}`);
      console.log(`   SurveyDetails count: ${record.surveyDetails?.length || 0}`);
      console.log(`   Created: ${record.created_at || 'unknown'}`);
      console.log(`   Updated: ${record.updated_at || 'unknown'}`);
      
      if (record.surveyDetails && record.surveyDetails.length > 0) {
        console.log(`   📝 Sample survey details:`);
        record.surveyDetails.slice(0, 2).forEach((survey, i) => {
          console.log(`      ${i + 1}. Case: ${survey.caseNumber}, Category: ${survey.category}, Satisfaction: ${survey.overallSatisfaction}`);
        });
      }
      
      if (record.metrics?.customerSatisfaction) {
        const cs = record.metrics.customerSatisfaction;
        console.log(`   📈 Satisfaction: ${cs.csat}/${cs.total} CSAT (${cs.csatPercentage}%)`);
      }
    });
    
    // Also check what the API query would return
    console.log('\n🔍 Testing API query filter...');
    const apiQuery = { entity_name: 'Mharlee Dela Cruz' };
    const apiResult = await collection.find(apiQuery).sort({ date: -1 }).toArray();
    console.log(`📡 API query would return ${apiResult.length} records`);
    
    if (apiResult.length > 0) {
      const first = apiResult[0];
      console.log(`📋 First API result:`);
      console.log(`   ID: ${first._id}`);
      console.log(`   Date: ${first.date}`);
      console.log(`   Has surveyDetails: ${!!first.surveyDetails}`);
      console.log(`   SurveyDetails array length: ${first.surveyDetails?.length || 0}`);
      
      if (first.surveyDetails) {
        console.log(`   ✅ SurveyDetails exists and should be returned by API`);
        console.log(`   📝 Sample entry:`, JSON.stringify(first.surveyDetails[0], null, 2));
      } else {
        console.log(`   ❌ SurveyDetails missing from database record`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database records:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

checkDatabaseRecords();