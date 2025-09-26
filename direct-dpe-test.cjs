#!/usr/bin/env node

/**
 * Direct DPE Update Test - Replicate exact API operation
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';
const API_BASE_URL = 'http://localhost:3001';

async function directDPEUpdateTest() {
  console.log('🔍 Direct DPE Update Test...\n');

  try {
    // First, get a DPE from the API
    console.log('📋 Getting DPE from API...');
    const dpesResponse = await fetch(`${API_BASE_URL}/api/dpe`);
    const dpes = await dpesResponse.json();
    
    if (dpes.length === 0) {
      console.log('❌ No DPEs found');
      return;
    }

    const testDPE = dpes[0];
    console.log('🎯 Test DPE:', JSON.stringify(testDPE, null, 2));

    // Now try to replicate the exact update operation that the API does
    console.log('\n🔄 Connecting to MongoDB directly...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('i16e-db');
    
    const updateData = {
      name: testDPE.name + ' (DIRECT TEST)',
      squadID: testDPE.squadID, // String, not ObjectId
      email: testDPE.email || 'test@example.com',
      role: testDPE.role || 'Test Role'
    };

    console.log('📝 Update data:', updateData);
    console.log('📝 DPE ID:', testDPE.id);
    console.log('📝 DPE ID type:', typeof testDPE.id);
    console.log('📝 DPE ID ObjectId valid:', ObjectId.isValid(testDPE.id));

    try {
      console.log('\n🔄 Executing direct MongoDB update...');
      const directResult = await db.collection('dpes').findOneAndUpdate(
        { _id: new ObjectId(testDPE.id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      console.log('✅ Direct MongoDB update successful:', directResult);
      
      // Revert the change
      await db.collection('dpes').findOneAndUpdate(
        { _id: new ObjectId(testDPE.id) },
        { $set: { name: testDPE.name } },
        { returnDocument: 'after' }
      );
      console.log('✅ Reverted change');
      
    } catch (directError) {
      console.error('❌ Direct MongoDB update failed:', directError);
    }

    await client.close();

    // Now try the API update
    console.log('\n🔄 Trying API update...');
    try {
      const apiUpdateResponse = await fetch(
        `${API_BASE_URL}/api/dpe/${testDPE.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: testDPE.name + ' (API TEST)',
            squadID: testDPE.squadID
            // Note: email and role not included for DPEs
          })
        }
      );
      
      if (apiUpdateResponse.ok) {
        const result = await apiUpdateResponse.json();
        console.log('✅ API update successful:', result);
      } else {
        console.error('❌ API update failed with status:', apiUpdateResponse.status);
        const errorText = await apiUpdateResponse.text();
        console.error('Error response:', errorText);
      }
    } catch (apiError) {
      console.error('❌ API update failed:');
      console.error('Status:', apiError.response?.status);
      console.error('Error:', apiError.response?.data?.error);
      console.error('Details:', apiError.response?.data?.details);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

directDPEUpdateTest();