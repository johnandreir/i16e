const https = require('https');
const http = require('http');

const testData = [
  {
    entity_id: "John Smith",
    entity_name: "John Smith", 
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
        owner_full_name: "John Smith",
        created_date: "2025-09-10T10:00:00Z",
        closed_date: "2025-09-22T15:30:00Z",
        products: "[\"Apex One\"]"
      }
    ],
    created_at: new Date().toISOString(),
    source: "test-data"
  },
  {
    entity_id: "Sarah Johnson",
    entity_name: "Sarah Johnson",
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
        owner_full_name: "Sarah Johnson",
        created_date: "2025-09-15T09:00:00Z",
        closed_date: "2025-09-23T14:00:00Z",
        products: "[\"Trend Vision One\"]"
      }
    ],
    created_at: new Date().toISOString(),
    source: "test-data"
  },
  {
    entity_id: "Mike Chen",
    entity_name: "Mike Chen",
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
        owner_full_name: "Mike Chen",
        created_date: "2025-09-01T11:00:00Z",
        closed_date: "2025-09-24T16:00:00Z",
        products: "[\"Deep Security\"]"
      }
    ],
    created_at: new Date().toISOString(),
    source: "test-data"
  }
];

async function createTestData() {
  try {
    console.log('Creating test performance data...');
    
    for (let i = 0; i < testData.length; i++) {
      const record = testData[i];
      console.log(`\nCreating record ${i + 1}: ${record.entity_name}`);
      
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
        console.log(`✅ Created record for ${record.entity_name}`);
      } else {
        console.error(`❌ Failed to create record for ${record.entity_name}:`, response.status, response.data);
      }
    }
    
    console.log('\n🎯 Testing data retrieval...');
    
    // Test retrieval
    const getResponse = await new Promise((resolve, reject) => {
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
    
    if (getResponse.status === 200) {
      console.log(`📊 Retrieved ${getResponse.data.length} performance records`);
      
      if (getResponse.data.length > 0) {
        const sampleRecord = getResponse.data[0];
        console.log('\n📋 Sample record structure:');
        console.log('- Entity:', sampleRecord.entity_name);
        console.log('- Has SCT:', !!sampleRecord.metrics?.sct);
        console.log('- Has Closed Cases:', !!sampleRecord.metrics?.closedCases);
        console.log('- Has Customer Satisfaction:', !!sampleRecord.metrics?.customerSatisfaction);
        
        if (sampleRecord.metrics?.customerSatisfaction) {
          console.log('- CSAT Percentage:', sampleRecord.metrics.customerSatisfaction.csatPercentage);
          console.log('- DSAT Percentage:', sampleRecord.metrics.customerSatisfaction.dsatPercentage);
        }
      }
    }
    
    console.log('\n✅ Test data creation completed!');
    console.log('🌐 Now test the frontend at: http://localhost:8082');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestData();