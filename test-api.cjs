const fetch = require('node-fetch');

async function testAPIEndpoints() {
  console.log('🧪 Testing Performance Data API endpoints...\n');
  
  try {
    // Test 1: Get all performance data
    console.log('📡 Test 1: GET /api/performance-data');
    const response1 = await fetch('http://localhost:3001/api/performance-data');
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log(`✅ Success! Got ${data1.length} records`);
      if (data1.length > 0) {
        console.log('📋 First record structure:');
        const first = data1[0];
        console.log(`  - entity_name: ${first.entity_name}`);
        console.log(`  - entity_type: ${first.entity_type}`);
        console.log(`  - metrics.sct: ${first.metrics?.sct}`);
        console.log(`  - metrics.closedCases: ${first.metrics?.closedCases}`);
        console.log(`  - metrics.customerSatisfaction: ${!!first.metrics?.customerSatisfaction}`);
        console.log(`  - surveyDetails: ${first.surveyDetails ? (Array.isArray(first.surveyDetails) ? first.surveyDetails.length : 'present') : 'null'}`);
      }
    } else {
      console.log(`❌ Failed: ${response1.status} ${response1.statusText}`);
    }

    // Test 2: Get specific entity
    console.log('\n📡 Test 2: GET /api/performance-data?entity_name=Antonio Amante Jr.');
    const response2 = await fetch('http://localhost:3001/api/performance-data?entity_name=Antonio%20Amante%20Jr.');
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log(`✅ Success! Got ${data2.length} records for Antonio Amante Jr.`);
    } else {
      console.log(`❌ Failed: ${response2.status} ${response2.statusText}`);
    }

    // Test 3: Test the CasePerformanceService endpoint format
    console.log('\n📡 Test 3: Testing date range query (like UI uses)');
    const today = new Date();
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = lastMonth.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const response3 = await fetch(`http://localhost:3001/api/performance-data?startDate=${startDate}&endDate=${endDate}`);
    
    if (response3.ok) {
      const data3 = await response3.json();
      console.log(`✅ Success! Got ${data3.length} records for date range ${startDate} to ${endDate}`);
      
      if (data3.length > 0) {
        console.log('\n🎯 This is what the UI should receive:');
        console.log('CasePerformanceService.getPerformanceOverview() format:');
        data3.forEach(record => {
          const converted = {
            owner: record.entity_name,
            sct: record.metrics?.sct || 0,
            totalCases: record.cases_count || 0,
            closedCases: record.metrics?.closedCases || 0,
            openCases: Math.max(0, (record.cases_count || 0) - (record.metrics?.closedCases || 0)),
            cases: record.sample_cases || [],
            satisfaction: record.metrics?.customerSatisfaction ? {
              csatPercentage: record.metrics.customerSatisfaction.csatPercentage
            } : undefined,
            surveyDetails: record.surveyDetails || undefined
          };
          console.log(`📊 ${converted.owner}:`);
          console.log(`   SCT: ${converted.sct} days`);
          console.log(`   Closed Cases: ${converted.closedCases}`);
          console.log(`   Total Cases: ${converted.totalCases}`);
          console.log(`   Satisfaction: ${converted.satisfaction?.csatPercentage || 'N/A'}%`);
          console.log(`   Survey Details: ${converted.surveyDetails?.length || 0} entries`);
          console.log(`   Sample Cases: ${converted.cases?.length || 0} entries`);
        });
      }
    } else {
      console.log(`❌ Failed: ${response3.status} ${response3.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\n💡 Make sure the API server is running: npm run api');
  }
}

testAPIEndpoints().catch(console.error);