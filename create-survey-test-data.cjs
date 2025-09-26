// Script to populate test survey data for testing the drill-down fix
const { MongoClient } = require('mongodb');

async function createTestSurveyData() {
  console.log('🚀 Creating test survey data for drill-down testing...');
  
  const mongoUrl = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';
  const dbName = 'i16e-db';
  
  let client;
  
  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('performance_data');
    
    // Test DPEs for different entities
    const testDPEs = [
      { name: 'Mharlee Dela Cruz', squad: 'Alpha Squad', team: 'Backend Team' },
      { name: 'John Andrei Reyes', squad: 'Alpha Squad', team: 'Backend Team' },
      { name: 'Jen Daryll Oller', squad: 'Beta Squad', team: 'Frontend Team' }
    ];
    
    const sampleSurveyDetails = [
      {
        caseNumber: 'TM-03677360',
        overallSatisfaction: 5,
        category: 'csat',
        feedback: 'Excellent support! The DPE was very knowledgeable and helped resolve the issue quickly.',
        surveyDate: new Date().toISOString(),
        customerName: 'John Smith',
        productArea: 'Trend Vision One',
        ownerName: 'Mharlee Dela Cruz'
      },
      {
        caseNumber: 'TM-03526262',
        overallSatisfaction: 4,
        category: 'csat',
        feedback: 'Good service, took a bit longer than expected but the solution worked.',
        surveyDate: new Date().toISOString(),
        customerName: 'Jane Doe',
        productArea: 'Apex One',
        ownerName: 'Mharlee Dela Cruz'
      },
      {
        caseNumber: 'TM-03411789',
        overallSatisfaction: 3,
        category: 'neutral',
        feedback: 'Service was okay, solution worked but communication could be better.',
        surveyDate: new Date().toISOString(),
        customerName: 'Bob Wilson',
        productArea: 'Cloud One',
        ownerName: 'John Andrei Reyes'
      },
      {
        caseNumber: 'TM-03322156',
        overallSatisfaction: 2,
        category: 'dsat',
        feedback: 'Took too long to resolve, multiple back-and-forth emails, frustrating experience.',
        surveyDate: new Date().toISOString(),
        customerName: 'Alice Brown',
        productArea: 'Trend Vision One',
        ownerName: 'Jen Daryll Oller'
      }
    ];
    
    // Create test records for each DPE
    const operations = [];
    
    for (const dpe of testDPEs) {
      // Generate survey details for this DPE
      const dpeSurveys = sampleSurveyDetails
        .filter(survey => survey.ownerName === dpe.name)
        .concat([
          // Add more surveys for variety
          ...sampleSurveyDetails.slice(0, 2).map((survey, index) => ({
            ...survey,
            caseNumber: `TM-TEST-${dpe.name.replace(/\s/g, '')}-${index + 1}`,
            ownerName: dpe.name,
            customerName: `Customer ${index + 1}`,
            feedback: `Test feedback ${index + 1} for ${dpe.name}: ${survey.feedback}`
          }))
        ]);
      
      // Calculate satisfaction metrics
      const csat = dpeSurveys.filter(s => s.category === 'csat').length;
      const neutral = dpeSurveys.filter(s => s.category === 'neutral').length;  
      const dsat = dpeSurveys.filter(s => s.category === 'dsat').length;
      const total = csat + neutral + dsat;
      
      const customerSatisfaction = {
        csat,
        neutral,
        dsat,
        total,
        csatPercentage: total > 0 ? Math.round((csat / total) * 100) : 0,
        neutralPercentage: total > 0 ? Math.round((neutral / total) * 100) : 0,
        dsatPercentage: total > 0 ? Math.round((dsat / total) * 100) : 0,
        lastUpdated: new Date().toISOString(),
        source: 'test-survey-data'
      };
      
      // Update or insert performance record with survey data
      operations.push({
        updateOne: {
          filter: { 
            entity_name: dpe.name,
            date: new Date().toISOString().split('T')[0] // Today's date
          },
          update: {
            $set: {
              entity_name: dpe.name,
              entity_type: 'dpe',
              date: new Date().toISOString().split('T')[0],
              metrics: {
                sct: Math.random() * 10 + 5, // Random SCT between 5-15
                closedCases: dpeSurveys.length,
                customerSatisfaction
              },
              cases_count: dpeSurveys.length,
              surveyDetails: dpeSurveys, // Survey details at root level
              sample_cases: dpeSurveys.map(survey => ({
                case_id: survey.caseNumber,
                title: `Sample case for ${survey.caseNumber}`,
                status: 'Resolved',
                priority: 'P3',
                owner_full_name: dpe.name,
                products: survey.productArea
              })),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          upsert: true
        }
      });
    }
    
    console.log(`📝 Executing ${operations.length} database operations...`);
    const result = await collection.bulkWrite(operations);
    
    console.log('✅ Test survey data created successfully!');
    console.log(`   - Matched: ${result.matchedCount}`);
    console.log(`   - Modified: ${result.modifiedCount}`);
    console.log(`   - Upserted: ${result.upsertedCount}`);
    
    // Verify the data was created
    console.log('\n🔍 Verifying test data...');
    const verifyRecords = await collection.find({ 
      entity_name: { $in: testDPEs.map(d => d.name) },
      'metrics.customerSatisfaction': { $exists: true }
    }).toArray();
    
    console.log(`✅ Found ${verifyRecords.length} records with satisfaction data`);
    verifyRecords.forEach(record => {
      const cs = record.metrics.customerSatisfaction;
      console.log(`   ${record.entity_name}: ${cs.csat}/${cs.total} CSAT (${cs.csatPercentage}%), ${record.surveyDetails?.length || 0} survey details`);
    });
    
    console.log('\n🎯 Test data is ready! You can now:');
    console.log('   1. Select a DPE (Mharlee Dela Cruz, John Andrei Reyes, or Jen Daryll Oller)');
    console.log('   2. Generate a report');
    console.log('   3. Click on CSAT/Neutral/DSAT pie chart slices');
    console.log('   4. See detailed survey breakdown with case numbers and feedback');
    console.log('\n   For squad/team testing:');
    console.log('   - Alpha Squad contains: Mharlee Dela Cruz, John Andrei Reyes');
    console.log('   - Backend Team contains: Alpha Squad (both DPEs above)');
    console.log('   - Survey details should now aggregate properly for drill-down!');
    
  } catch (error) {
    console.error('❌ Error creating test survey data:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

createTestSurveyData();