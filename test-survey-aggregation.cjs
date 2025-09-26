// Test script to verify survey details aggregation fix
const fetch = require('node-fetch').default || require('node-fetch');

async function testSurveyDetailsAggregation() {
  console.log('🧪 Testing Survey Details Aggregation Fix');
  console.log('==========================================');
  
  try {
    // 1. First, let's check what DPE data looks like
    console.log('📋 Step 1: Checking DPE performance data structure...');
    const dpeResponse = await fetch('http://localhost:3001/api/performance-data?entity_name=Mharlee%20Dela%20Cruz&limit=1');
    
    if (dpeResponse.ok) {
      const dpeData = await dpeResponse.json();
      console.log('📊 DPE Data Structure:', JSON.stringify({
        recordCount: dpeData.length,
        firstRecord: dpeData.length > 0 ? {
          entity_name: dpeData[0]?.entity_name,
          hasMetrics: !!dpeData[0]?.metrics,
          hasCustomerSatisfaction: !!dpeData[0]?.metrics?.customerSatisfaction,
          hasSurveyDetails: !!dpeData[0]?.surveyDetails,
          surveyDetailsCount: dpeData[0]?.surveyDetails?.length || 0,
          rootLevelKeys: Object.keys(dpeData[0] || {})
        } : 'No records found'
      }, null, 2));
      
      // If we have survey details, show sample
      if (dpeData.length > 0 && dpeData[0].surveyDetails) {
        console.log('📝 Sample Survey Details:');
        dpeData[0].surveyDetails.slice(0, 2).forEach((survey, index) => {
          console.log(`   Survey ${index + 1}:`, {
            caseNumber: survey.caseNumber,
            category: survey.category,
            overallSatisfaction: survey.overallSatisfaction,
            feedback: survey.feedback ? survey.feedback.substring(0, 50) + '...' : 'No feedback'
          });
        });
      }
    } else {
      console.log('❌ Failed to fetch DPE data:', dpeResponse.status);
    }
    
    // 2. Check health status
    console.log('\n📋 Step 2: Checking N8N health status...');
    const healthResponse = await fetch('http://localhost:3001/api/n8n/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('🏥 N8N Health:', {
        overall: healthData.overall?.healthy,
        service: healthData.n8nHealth?.n8nServiceStatus?.reachable,
        webhook: healthData.n8nHealth?.n8nWebhookStatus?.getPerformance?.message
      });
    }
    
    // 3. Test fetching multiple DPE data for aggregation simulation
    console.log('\n📋 Step 3: Testing squad aggregation scenario...');
    const squadMembers = ['Mharlee Dela Cruz', 'John Andrei Reyes', 'Jen Daryll Oller'];
    
    const memberPromises = squadMembers.map(async (dpeName) => {
      const response = await fetch(`http://localhost:3001/api/performance-data?entity_name=${encodeURIComponent(dpeName)}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        return data.length > 0 ? { dpeName, data: data[0] } : null;
      }
      return null;
    });
    
    const memberResults = await Promise.all(memberPromises);
    const validResults = memberResults.filter(result => result !== null);
    
    console.log('🔍 Squad Member Data Summary:');
    validResults.forEach(result => {
      console.log(`   ${result.dpeName}: ${result.data.surveyDetails?.length || 0} survey details`);
    });
    
    // Simulate the aggregation logic from the fix
    const allSurveyDetails = validResults
      .flatMap(result => result.data.surveyDetails || [])
      .filter(survey => survey.caseNumber && survey.category);
    
    console.log('\n✅ Aggregation Result:');
    console.log(`   Total Survey Details Collected: ${allSurveyDetails.length}`);
    
    // Group by category to show distribution
    const categoryCount = allSurveyDetails.reduce((acc, survey) => {
      const category = survey.category?.toLowerCase() || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   Category Distribution:', categoryCount);
    
    if (allSurveyDetails.length > 0) {
      console.log('\n🎯 This means the pie chart drill-down should work!');
      console.log('   ✅ Survey details are available for aggregation');
      console.log('   ✅ Categories are properly labeled');
      console.log('   ✅ Case numbers and feedback are present');
    } else {
      console.log('\n❌ No survey details found - drill-down will not work');
      console.log('   This could mean:');
      console.log('   - Survey data hasn\'t been processed');
      console.log('   - API endpoints are not returning surveyDetails');
      console.log('   - Database doesn\'t contain the required survey information');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSurveyDetailsAggregation();