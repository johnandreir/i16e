const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');

async function checkData() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('devops_insights');
    
    // Get recent performance data
    const data = await db.collection('performance_data').find({}).sort({ timestamp: -1 }).limit(5).toArray();
    
    console.log('Recent performance_data records:');
    data.forEach((record, i) => {
      console.log(`\nRecord ${i + 1}:`);
      console.log('- Entity:', record.entity);
      console.log('- Type:', record.type);
      console.log('- SCT:', record.sct);
      console.log('- Closed Cases:', record.closedCases);
      console.log('- Customer Satisfaction:', record.customerSatisfaction ? 'YES' : 'NO');
      if (record.customerSatisfaction) {
        console.log('- Satisfaction Data:', JSON.stringify(record.customerSatisfaction, null, 2));
      }
      console.log('- Timestamp:', record.timestamp);
    });
    
    // Check if any record has customerSatisfaction
    const withSatisfaction = await db.collection('performance_data').countDocuments({ 
      customerSatisfaction: { $exists: true, $ne: null } 
    });
    console.log(`\nTotal records with customerSatisfaction: ${withSatisfaction}`);
    
    // Check total records
    const totalRecords = await db.collection('performance_data').countDocuments();
    console.log(`Total performance_data records: ${totalRecords}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkData();