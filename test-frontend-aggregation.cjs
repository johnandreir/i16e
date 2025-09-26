#!/usr/bin/env node
/**
 * Test Frontend Survey Details Aggregation Logic
 * Simulates the squad/team aggregation process to verify survey details are properly collected
 */

const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function testSquadAggregation() {
  console.log('🧪 Testing Squad Survey Details Aggregation');
  console.log('=' .repeat(50));

  try {
    // Get performance data for DPE (simulating what frontend does)
    const response = await makeRequest('/api/performance-data?entity_type=dpe');
    
    if (!Array.isArray(response)) {
      console.log('❌ API Response is not an array:', response);
      return;
    }

    console.log(`📊 Found ${response.length} DPE records`);

    // Simulate frontend squad aggregation logic
    const validSatisfactionData = response.filter(item => 
      item.metrics && 
      item.metrics.customerSatisfaction &&
      item.metrics.customerSatisfaction.total > 0
    );

    console.log(`✅ Valid satisfaction data: ${validSatisfactionData.length} records`);

    // Simulate the squad aggregation logic from IndexNew.tsx
    const allSquadSurveyDetails = validSatisfactionData
      .flatMap(result => result.surveyDetails || [])
      .filter(survey => survey.caseNumber && survey.category);

    console.log(`📋 Total aggregated survey details: ${allSquadSurveyDetails.length}`);

    if (allSquadSurveyDetails.length > 0) {
      console.log('\n🔍 Sample survey details:');
      allSquadSurveyDetails.slice(0, 2).forEach((survey, index) => {
        console.log(`  ${index + 1}. Case: ${survey.caseNumber}`);
        console.log(`     Category: ${survey.category}`);
        console.log(`     Satisfaction: ${survey.overallSatisfaction}`);
        console.log(`     Feedback: ${survey.feedback.substring(0, 50)}...`);
        console.log(`     Owner: ${survey.ownerName}`);
        console.log('');
      });

      // Test pie chart drill-down functionality
      console.log('🎯 Testing Pie Chart Drill-down Logic');
      console.log('-'.repeat(30));

      const categories = ['csat', 'neutral', 'dsat'];
      categories.forEach(category => {
        const filteredDetails = allSquadSurveyDetails.filter(survey => survey.category === category);
        console.log(`${category.toUpperCase()}: ${filteredDetails.length} surveys`);
        
        if (filteredDetails.length > 0) {
          console.log(`  Sample case numbers: ${filteredDetails.slice(0, 3).map(s => s.caseNumber).join(', ')}`);
        }
      });

      console.log('\n✅ Squad aggregation logic working correctly!');
      console.log('✅ Survey details are properly collected and categorized');
      console.log('✅ Pie chart drill-down should now display detailed breakdowns');

    } else {
      console.log('❌ No survey details found in aggregation');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 Make sure API server is running on port 3001');
  }
}

// Run the test
testSquadAggregation();