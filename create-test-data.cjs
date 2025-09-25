const { MongoClient } = require('mongodb');

async function createTestData() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('devops_insights');
    const collection = db.collection('performance_data');
    
    // Clear existing data
    await collection.deleteMany({});
    console.log('Cleared existing performance_data');
    
    // Create test data with customer satisfaction
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
        created_at: new Date(),
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
        created_at: new Date(),
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
        created_at: new Date(),
        source: "test-data"
      }
    ];
    
    // Insert test data
    const result = await collection.insertMany(testData);
    console.log(`Inserted ${result.insertedCount} test records`);
    
    // Verify insertion
    const count = await collection.countDocuments();
    console.log(`Total records in performance_data: ${count}`);
    
    // Check one record to verify structure
    const sampleRecord = await collection.findOne();
    console.log('Sample record structure:', {
      entity_name: sampleRecord.entity_name,
      hasSCT: !!sampleRecord.metrics.sct,
      hasClosedCases: !!sampleRecord.metrics.closedCases,
      hasCustomerSatisfaction: !!sampleRecord.metrics.customerSatisfaction,
      satisfactionKeys: sampleRecord.metrics.customerSatisfaction ? Object.keys(sampleRecord.metrics.customerSatisfaction) : []
    });
    
    console.log('✅ Test data created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

createTestData();