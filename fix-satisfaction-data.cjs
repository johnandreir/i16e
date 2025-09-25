const https = require('https');
const http = require('http');

// Sample customer satisfaction data to add to existing performance records
const satisfactionDataSamples = {
  "Mharlee Dela Cruz": {
    csat: 6,
    neutral: 1,
    dsat: 1,
    total: 8,
    csatPercentage: 75,
    neutralPercentage: 12.5,
    dsatPercentage: 12.5
  },
  "John Andrei Reyes": {
    csat: 9,
    neutral: 2,
    dsat: 1,
    total: 12,
    csatPercentage: 75,
    neutralPercentage: 16.7,
    dsatPercentage: 8.3
  },
  "Jen Daryll Oller": {
    csat: 4,
    neutral: 1,
    dsat: 1,
    total: 6,
    csatPercentage: 66.7,
    neutralPercentage: 16.7,
    dsatPercentage: 16.7
  }
};

async function addSatisfactionToPerformanceData() {
  try {
    console.log('🔧 Adding customer satisfaction data to existing performance records...');
    
    // First, get existing performance data
    console.log('📡 Fetching existing performance data...');
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
    
    if (getResponse.status !== 200) {
      throw new Error(`Failed to fetch performance data: ${getResponse.status}`);
    }
    
    const existingRecords = getResponse.data;
    console.log(`📊 Found ${existingRecords.length} existing performance records`);
    
    if (existingRecords.length === 0) {
      console.log('❌ No existing performance records found. Create some performance data first.');
      return;
    }
    
    // Clear existing data first
    console.log('🗑️ Clearing existing performance data...');
    const deleteResponse = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/performance-data',
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
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
      req.end();
    });
    
    // Update records with satisfaction data
    console.log('🔄 Adding customer satisfaction data to records...');
    
    const updatedRecords = existingRecords.map(record => {
      const entityName = record.entity_name;
      const satisfactionData = satisfactionDataSamples[entityName];
      
      console.log(`📝 Processing: ${entityName}`);
      console.log(`   - Has satisfaction data: ${!!satisfactionData}`);
      
      if (satisfactionData) {
        // Add customerSatisfaction to the metrics
        const updatedRecord = {
          ...record,
          metrics: {
            ...record.metrics,
            customerSatisfaction: satisfactionData
          },
          updated_at: new Date().toISOString(),
          source: record.source + ' + satisfaction-added'
        };
        
        console.log(`   ✅ Added satisfaction data: CSAT ${satisfactionData.csatPercentage}%, DSAT ${satisfactionData.dsatPercentage}%`);
        return updatedRecord;
      } else {
        console.log(`   ⚠️ No satisfaction data available for ${entityName}`);
        return record;
      }
    });
    
    // Save updated records
    console.log('💾 Saving updated performance records...');
    
    for (let i = 0; i < updatedRecords.length; i++) {
      const record = updatedRecords[i];
      console.log(`📤 Saving record ${i + 1}: ${record.entity_name}`);
      
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
        console.log(`   ✅ Successfully saved ${record.entity_name}`);
      } else {
        console.error(`   ❌ Failed to save ${record.entity_name}:`, response.status);
      }
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying updated records...');
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
      const verifiedRecords = verifyResponse.data;
      console.log(`📊 Verified ${verifiedRecords.length} updated records`);
      
      verifiedRecords.forEach(record => {
        const hasCustomerSatisfaction = !!record.metrics?.customerSatisfaction;
        console.log(`   - ${record.entity_name}: Has satisfaction data = ${hasCustomerSatisfaction}`);
        
        if (hasCustomerSatisfaction) {
          const cs = record.metrics.customerSatisfaction;
          console.log(`     CSAT: ${cs.csatPercentage}%, Neutral: ${cs.neutralPercentage}%, DSAT: ${cs.dsatPercentage}%`);
        }
      });
    }
    
    console.log('\n✅ Customer satisfaction data has been added to performance records!');
    console.log('🌐 Now test the frontend - the customer satisfaction charts should display data.');
    console.log('🔄 Refresh the browser and select a DPE or squad to see the satisfaction distribution.');
    
  } catch (error) {
    console.error('❌ Error adding satisfaction data:', error);
  }
}

addSatisfactionToPerformanceData();