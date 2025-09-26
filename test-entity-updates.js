const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testEntityUpdates() {
  console.log('🧪 Testing Entity Update Endpoints');
  console.log('=====================================\n');

  // Test data
  const testTeam = {
    name: 'Test Team Updated',
    description: 'Updated description for test team'
  };

  const testSquad = {
    name: 'Test Squad Updated', 
    teamID: '507f1f77bcf86cd799439011', // placeholder ID
    description: 'Updated description for test squad'
  };

  const testDPE = {
    name: 'Test DPE Updated',
    squadID: '507f1f77bcf86cd799439011', // placeholder ID
    email: 'test@example.com',
    role: 'Developer'
  };

  // Test Team Update
  console.log('1. Testing Team Update...');
  try {
    const response = await fetch(`${BASE_URL}/api/team/507f1f77bcf86cd799439011`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTeam)
    });

    console.log('📍 Team Update Status:', response.status);
    const result = await response.json();
    console.log('📍 Team Update Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Team Update Error:', error.message);
  }

  console.log('\n');

  // Test Squad Update
  console.log('2. Testing Squad Update...');
  try {
    const response = await fetch(`${BASE_URL}/api/squad/507f1f77bcf86cd799439011`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSquad)
    });

    console.log('📍 Squad Update Status:', response.status);
    const result = await response.json();
    console.log('📍 Squad Update Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Squad Update Error:', error.message);
  }

  console.log('\n');

  // Test DPE Update
  console.log('3. Testing DPE Update...');
  try {
    const response = await fetch(`${BASE_URL}/api/dpe/507f1f77bcf86cd799439011`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testDPE)
    });

    console.log('📍 DPE Update Status:', response.status);
    const result = await response.json();
    console.log('📍 DPE Update Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ DPE Update Error:', error.message);
  }

  console.log('\n=====================================');
  console.log('🏁 Entity Update Tests Completed');
}

// Run tests
testEntityUpdates().catch(console.error);