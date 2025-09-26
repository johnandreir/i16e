#!/usr/bin/env node
/**
 * Find all database records to understand the data state
 */

const { MongoClient } = require('mongodb');

const mongoUrl = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';

async function findAllRecords() {
  console.log('🔍 Finding ALL database records...');
  
  let client;
  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('i16e-db');
    const collection = db.collection('performance_data');
    
    // Find all records
    const allRecords = await collection.find({}).sort({ created_at: -1 }).toArray();
    console.log(`📊 Total records in database: ${allRecords.length}`);
    
    allRecords.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1}:`);
      console.log(`   ID: ${record._id}`);
      console.log(`   Entity: ${record.entity_name || record.entity_id}`);
      console.log(`   Date: ${record.date}`);
      console.log(`   Created: ${record.created_at}`);
      console.log(`   Has surveyDetails: ${!!record.surveyDetails}`);
      console.log(`   SurveyDetails count: ${record.surveyDetails ? record.surveyDetails.length : 0}`);
      console.log(`   Has customerSatisfaction: ${!!(record.metrics && record.metrics.customerSatisfaction)}`);
      
      if (record.surveyDetails && record.surveyDetails.length > 0) {
        console.log(`   ✅ This record has survey data!`);
      } else {
        console.log(`   ❌ No survey data`);
      }
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

findAllRecords();