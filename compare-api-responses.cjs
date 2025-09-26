#!/usr/bin/env node
/**
 * Compare API responses with different query parameters
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

async function compareAPIResponses() {
  console.log('🔍 Comparing API Responses');
  console.log('=' .repeat(50));

  try {
    console.log('📊 Test 1: No query parameters');
    const response1 = await makeRequest('/api/performance-data');
    console.log(`  Records returned: ${response1.length}`);
    
    if (response1.length > 0) {
      const first = response1[0];
      console.log(`  First record: ${first.entity_name}`);
      console.log(`  Has customerSatisfaction: ${!!(first.metrics && first.metrics.customerSatisfaction)}`);
      console.log(`  Has surveyDetails: ${!!first.surveyDetails && first.surveyDetails.length > 0}`);
    }

    console.log('\n📊 Test 2: With entity_type=dpe');
    const response2 = await makeRequest('/api/performance-data?entity_type=dpe');
    console.log(`  Records returned: ${response2.length}`);
    
    if (response2.length > 0) {
      const first = response2[0];
      console.log(`  First record: ${first.entity_name}`);
      console.log(`  Has customerSatisfaction: ${!!(first.metrics && first.metrics.customerSatisfaction)}`);
      console.log(`  Has surveyDetails: ${!!first.surveyDetails && first.surveyDetails.length > 0}`);
    }

    console.log('\n📊 Test 3: With entity_id=Mharlee Dela Cruz');
    const response3 = await makeRequest('/api/performance-data?entity_id=Mharlee Dela Cruz');
    console.log(`  Records returned: ${response3.length}`);
    
    if (response3.length > 0) {
      const first = response3[0];
      console.log(`  First record: ${first.entity_name}`);
      console.log(`  Has customerSatisfaction: ${!!(first.metrics && first.metrics.customerSatisfaction)}`);
      console.log(`  Has surveyDetails: ${!!first.surveyDetails && first.surveyDetails.length > 0}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the comparison
compareAPIResponses();