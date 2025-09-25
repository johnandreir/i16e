const https = require('https');
const http = require('http');

// Create fresh performance records with customer satisfaction data included
const testRecordsWithSatisfaction = [
  {
    entity_id: "Mharlee Dela Cruz",
    entity_name: "Mharlee Dela Cruz", 
    entity_type: "dpe",
    date: "2025-09-25",
    metrics: {
      sct: 15.5,
      closedCases: 8,
      customerSatisfaction: {
        csat: 6,
        neutral: 1,
        dsat: 1,
        total: 8,
        csatPercentage: 75,
        neutralPercentage: 12.5,
        dsatPercentage: 12.5
      }
    },
    cases_count: 8,
    sample_cases: [
      {
        case_id: "TM-001",
        title: "Test Case 1",
        status: "Resolved",
        priority: "P2",
        case_age_days: 12,
        owner_full_name: "Mharlee Dela Cruz",
        created_date: "2025-09-10T10:00:00Z",
        closed_date: "2025-09-22T15:30:00Z",
        products: "[\"Apex One\"]"
      }
    ],
    created_at: new Date().toISOString(),
    source: "test-data-with-satisfaction"
  },
  {
    entity_id: "John Andrei Reyes",
    entity_name: "John Andrei Reyes",
    entity_type: "dpe", 
    date: "2025-09-25",
    metrics: {
      sct: 22.3,
      closedCases: 12,
      customerSatisfaction: {
        csat: 9,
        neutral: 2,
        dsat: 1,
        total: 12,
        csatPercentage: 75,
        neutralPercentage: 16.7,
        dsatPercentage: 8.3
      }
    },
    cases_count: 12,
    sample_cases: [
      {
        case_id: "TM-002", 
        title: "Test Case 2",
        status: "Resolved",
        priority: "P1",
        case_age_days: 8,
        owner_full_name: "John Andrei Reyes",
        created_date: "2025-09-15T09:00:00Z",
        closed_date: "2025-09-23T14:00:00Z",
        products: "[\"Trend Vision One\"]"
      }
    ],
    created_at: new Date().toISOString(),
    source: "test-data-with-satisfaction"
  },
  {
    entity_id: "Jen Daryll Oller",
    entity_name: "Jen Daryll Oller",
    entity_type: "dpe",
    date: "2025-09-25", 
    metrics: {
      sct: 18.7,
      closedCases: 6,
      customerSatisfaction: {
        csat: 4,
        neutral: 1,
        dsat: 1,
        total: 6,
        csatPercentage: 66.7,
        neutralPercentage: 16.7,
        dsatPercentage: 16.7
      }
    },
    cases_count: 6,
    sample_cases: [
      {
        case_id: "TM-003",
        title: "Test Case 3", 
        status: "Resolved",
        priority: "P3",
        case_age_days: 25,
        owner_full_name: "Jen Daryll Oller",
        created_date: "2025-09-01T11:00:00Z",
        closed_date: "2025-09-24T16:00:00Z",
        products: "[\"Deep Security\"]"
      }
    ],
    created_at: new Date().toISOString(),
    source: "test-data-with-satisfaction"
  }
];

async function createTestDataWithSatisfaction() {
  try {
    console.log('🆕 Creating fresh test performance data with customer satisfaction...');
    
    // Clear existing test data first (ignore errors)
    try {
      console.log('🗑️ Attempting to clear existing data...');
      // We'll just overwrite with new data since delete might not be available
    } catch (e) {
      console.log('⚠️ Could not clear existing data, will create new records');
    }
    
    console.log('📤 Creating new performance records with satisfaction data...');
    
    for (let i = 0; i < testRecordsWithSatisfaction.length; i++) {
      const record = testRecordsWithSatisfaction[i];
      console.log(`\n📝 Creating record ${i + 1}: ${record.entity_name}`);
      console.log(`   - SCT: ${record.metrics.sct}`);
      console.log(`   - Closed Cases: ${record.metrics.closedCases}`);
      console.log(`   - CSAT: ${record.metrics.customerSatisfaction.csatPercentage}%`);
      console.log(`   - DSAT: ${record.metrics.customerSatisfaction.dsatPercentage}%`);
      
      const postData = JSON.stringify(record);
      
      const response = await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 3001,
          path: '/api/performance-data',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({
            status: res.statusCode,
            data: data
          }));
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
      });
      
      if (response.status === 200 || response.status === 201) {
        console.log(`   ✅ Successfully created ${record.entity_name}`);
      } else {
        console.error(`   ❌ Failed to create ${record.entity_name}:`, response.status, response.data);
      }
    }
    
    // Verify the created records
    console.log('\n🔍 Verifying created records...');
    const verifyResponse = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3001/api/performance-data', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          status: res.statusCode,
          data: JSON.parse(data)
        }));
      });
      req.on('error', reject);
    });
    
    if (verifyResponse.status === 200) {
      const allRecords = verifyResponse.data;
      console.log(`📊 Total records in database: ${allRecords.length}`);
      
      const recordsWithSatisfaction = allRecords.filter(record => !!record.metrics?.customerSatisfaction);
      console.log(`📈 Records with satisfaction data: ${recordsWithSatisfaction.length}`);
      
      recordsWithSatisfaction.forEach(record => {
        const cs = record.metrics.customerSatisfaction;
        console.log(`   ✅ ${record.entity_name}:`);
        console.log(`      - CSAT: ${cs.csatPercentage}% (${cs.csat}/${cs.total})`);
        console.log(`      - Neutral: ${cs.neutralPercentage}% (${cs.neutral}/${cs.total})`);
        console.log(`      - DSAT: ${cs.dsatPercentage}% (${cs.dsat}/${cs.total})`);
      });
      
      if (recordsWithSatisfaction.length > 0) {
        console.log('\n🎉 SUCCESS! Customer satisfaction data has been added to performance records!');
        console.log('');
        console.log('🌐 Now test the frontend:');
        console.log('   1. Refresh the browser (http://localhost:8082)');
        console.log('   2. Select "Mharlee Dela Cruz", "John Andrei Reyes", or "Jen Daryll Oller"');
        console.log('   3. Generate a report');
        console.log('   4. The Customer Satisfaction Distribution chart should now show data!');
        console.log('   5. For Squad Mharlee, it should aggregate the satisfaction data from all 3 DPEs');
      } else {
        console.log('❌ No records with satisfaction data found. Check the API server logs.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestDataWithSatisfaction();