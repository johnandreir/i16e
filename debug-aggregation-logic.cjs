#!/usr/bin/env node
/**
 * Debug Frontend Aggregation Logic
 * Investigate why validSatisfactionData is empty
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

async function debugAggregation() {
  console.log('🔍 Debug Frontend Aggregation Logic');
  console.log('=' .repeat(50));

  try {
    const response = await makeRequest('/api/performance-data?entity_type=dpe');
    
    console.log(`📊 API Response: ${response.length} records`);
    
    response.forEach((item, index) => {
      console.log(`\n📋 Record ${index + 1}:`);
      console.log(`  Entity: ${item.entity_name}`);
      console.log(`  Has metrics: ${!!item.metrics}`);
      
      if (item.metrics) {
        console.log(`  Has customerSatisfaction: ${!!item.metrics.customerSatisfaction}`);
        
        if (item.metrics.customerSatisfaction) {
          const cs = item.metrics.customerSatisfaction;
          console.log(`  CS total: ${cs.total}`);
          console.log(`  CS csat: ${cs.csat}`);
          console.log(`  CS neutral: ${cs.neutral}`);
          console.log(`  CS dsat: ${cs.dsat}`);
          
          // Check the validation condition from frontend
          const isValid = cs.total > 0;
          console.log(`  ✅ Passes validation (total > 0): ${isValid}`);
        }
      }
      
      console.log(`  Has surveyDetails: ${!!item.surveyDetails}`);
      console.log(`  SurveyDetails count: ${item.surveyDetails ? item.surveyDetails.length : 0}`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugAggregation();