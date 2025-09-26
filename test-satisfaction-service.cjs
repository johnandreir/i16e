// Test satisfaction data service directly
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSatisfactionDataService() {
  try {
    console.log('🔍 Testing CustomerSatisfactionService directly...\n');
    
    // Simulate the service call
    const entityName = 'Mharlee Dela Cruz';
    const entityType = 'dpe';
    
    console.log(`Fetching satisfaction data for ${entityType}: ${entityName}`);
    
    // Query performance_data collection for this entity
    const response = await fetch(
      `http://localhost:3001/api/performance-data?entity_name=${encodeURIComponent(entityName)}`
    );
    
    if (!response.ok) {
      console.warn(`MongoDB API returned ${response.status} for satisfaction data`);
      return null;
    }
    
    const performanceRecords = await response.json();
    
    if (!performanceRecords || performanceRecords.length === 0) {
      console.log(`📭 No performance records found for ${entityType}: ${entityName}`);
      return null;
    }
    
    console.log(`📊 Found ${performanceRecords.length} performance records for ${entityName}`);
    
    // Get the most recent record with satisfaction data
    const recentRecord = performanceRecords
      .filter((record) => record.metrics?.customerSatisfaction)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    if (!recentRecord) {
      console.log(`No satisfaction metrics found for ${entityType}: ${entityName}`);
      return null;
    }
    
    console.log(`✅ Found satisfaction data for ${entityName}:`, recentRecord.metrics.customerSatisfaction);
    console.log(`📊 Survey details at root level:`, {
      hasSurveyDetails: !!recentRecord.surveyDetails,
      surveyDetailsLength: recentRecord.surveyDetails?.length || 0,
      isArray: Array.isArray(recentRecord.surveyDetails)
    });
    
    if (recentRecord.surveyDetails && recentRecord.surveyDetails.length > 0) {
      console.log('📝 Sample survey details:');
      recentRecord.surveyDetails.slice(0, 2).forEach((survey, index) => {
        console.log(`  Survey ${index + 1}:`, {
          caseNumber: survey.caseNumber,
          category: survey.category,
          overallSatisfaction: survey.overallSatisfaction,
          feedback: survey.feedback?.substring(0, 50) + '...'
        });
      });
    }
    
    // Create the return object as the service would
    const result = {
      entityName,
      entityType,
      entityId: recentRecord.entity_id || recentRecord._id,
      owner_full_name: recentRecord.entity_name,
      satisfactionData: recentRecord.metrics.customerSatisfaction,
      surveyDetails: recentRecord.surveyDetails || []
    };
    
    console.log('\n🎯 Final result object:');
    console.log('  entityName:', result.entityName);
    console.log('  entityType:', result.entityType);
    console.log('  surveyDetails length:', result.surveyDetails.length);
    console.log('  surveyDetails is array:', Array.isArray(result.surveyDetails));
    
    // Test filtering like the click handler would do
    console.log('\n🔍 Testing segment filtering:');
    ['csat', 'neutral', 'dsat'].forEach(segment => {
      const segmentSurveys = result.surveyDetails.filter(survey => {
        const category = survey.category?.toLowerCase();
        return category === segment.toLowerCase();
      });
      console.log(`  ${segment.toUpperCase()}: ${segmentSurveys.length} surveys`);
      if (segmentSurveys.length > 0) {
        console.log(`    Cases: ${segmentSurveys.map(s => s.caseNumber).join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSatisfactionDataService();