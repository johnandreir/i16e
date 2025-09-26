// Debug performance record structure to find surveyDetails location
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugPerformanceStructure() {
  try {
    console.log('🔍 Debugging performance data structure for survey details...\n');
    
    const response = await fetch('http://localhost:3001/api/performance-data?entity_name=Mharlee Dela Cruz');
    const records = await response.json();
    
    if (!records || records.length === 0) {
      console.log('❌ No records found');
      return;
    }
    
    console.log(`📊 Found ${records.length} records for Mharlee Dela Cruz`);
    
    records.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1} - ${record.date}:`);
      console.log(`  Entity: ${record.entity_name}`);
      console.log(`  Has metrics: ${!!record.metrics}`);
      console.log(`  Has customerSatisfaction: ${!!record.metrics?.customerSatisfaction}`);
      
      if (record.metrics?.customerSatisfaction) {
        const cs = record.metrics.customerSatisfaction;
        console.log(`  Customer Satisfaction Values:`, {
          csat: cs.csat,
          neutral: cs.neutral,
          dsat: cs.dsat,
          total: cs.total
        });
      }
      
      // Check for surveyDetails at ALL possible locations
      console.log(`\n🔍 Survey Details Location Check:`);
      console.log(`  - Root level: ${!!record.surveyDetails} (${record.surveyDetails?.length || 0} items)`);
      console.log(`  - Metrics level: ${!!record.metrics?.surveyDetails} (${record.metrics?.surveyDetails?.length || 0} items)`);
      console.log(`  - CustomerSatisfaction level: ${!!record.metrics?.customerSatisfaction?.surveyDetails} (${record.metrics?.customerSatisfaction?.surveyDetails?.length || 0} items)`);
      
      // Show sample survey detail if found anywhere
      let foundSurveyDetails = null;
      if (record.surveyDetails?.length > 0) {
        foundSurveyDetails = record.surveyDetails;
        console.log(`  ✅ Found at ROOT level`);
      } else if (record.metrics?.surveyDetails?.length > 0) {
        foundSurveyDetails = record.metrics.surveyDetails;
        console.log(`  ✅ Found at METRICS level`);
      } else if (record.metrics?.customerSatisfaction?.surveyDetails?.length > 0) {
        foundSurveyDetails = record.metrics.customerSatisfaction.surveyDetails;
        console.log(`  ✅ Found at CUSTOMER_SATISFACTION level`);
      }
      
      if (foundSurveyDetails) {
        console.log(`  📝 Sample survey detail:`, {
          caseNumber: foundSurveyDetails[0].caseNumber,
          category: foundSurveyDetails[0].category,
          overallSatisfaction: foundSurveyDetails[0].overallSatisfaction,
          feedback: foundSurveyDetails[0].feedback?.substring(0, 50) + '...',
          surveyDate: foundSurveyDetails[0].surveyDate
        });
      } else {
        console.log(`  ❌ No survey details found at any level`);
      }
      
      console.log(`\n📋 All available keys:`);
      console.log(`  Root keys: [${Object.keys(record).join(', ')}]`);
      if (record.metrics) {
        console.log(`  Metrics keys: [${Object.keys(record.metrics).join(', ')}]`);
      }
      if (record.metrics?.customerSatisfaction) {
        console.log(`  CustomerSatisfaction keys: [${Object.keys(record.metrics.customerSatisfaction).join(', ')}]`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugPerformanceStructure();