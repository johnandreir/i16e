#!/usr/bin/env node

/**
 * Test Entity Management Update Functions
 * Tests PUT endpoints for Teams, Squads, and DPEs
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Test data
const testData = {
  team: {
    name: 'Updated Test Team',
    description: 'Updated description for test team'
  },
  squad: {
    name: 'Updated Test Squad',
    description: 'Updated description for test squad'
  },
  dpe: {
    name: 'Updated Test DPE',
    email: 'updated.test@example.com',
    role: 'Updated Senior Engineer'
  }
};

async function testEntityUpdates() {
  console.log('🧪 Starting Entity Management Update Tests...\n');

  try {
    // First, get some entities to update
    console.log('📋 Fetching existing entities...');
    
    const [teamsResponse, squadsResponse, dpesResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/team`),
      axios.get(`${API_BASE_URL}/api/squad`),
      axios.get(`${API_BASE_URL}/api/dpe`)
    ]);

    const teams = teamsResponse.data;
    const squads = squadsResponse.data;
    const dpes = dpesResponse.data;

    console.log(`✅ Found ${teams.length} teams, ${squads.length} squads, ${dpes.length} DPEs\n`);

    if (teams.length === 0) {
      console.log('❌ No teams found to test updates');
      return;
    }

    // Test Team Update
    console.log('🔄 Testing Team Update...');
    const testTeam = teams[0];
    try {
      const teamUpdateResponse = await axios.put(
        `${API_BASE_URL}/api/team/${testTeam.id}`,
        {
          name: `${testTeam.name} (Updated)`,
          description: 'Updated via test script'
        }
      );
      
      console.log('✅ Team update successful:', teamUpdateResponse.data);
    } catch (error) {
      console.error('❌ Team update failed:', error.response?.data || error.message);
    }

    // Test Squad Update (if squads exist)
    if (squads.length > 0) {
      console.log('\n🔄 Testing Squad Update...');
      const testSquad = squads[0];
      try {
        const squadUpdateResponse = await axios.put(
          `${API_BASE_URL}/api/squad/${testSquad.id}`,
          {
            name: `${testSquad.name} (Updated)`,
            teamID: testSquad.teamID,
            description: 'Updated via test script'
          }
        );
        
        console.log('✅ Squad update successful:', squadUpdateResponse.data);
      } catch (error) {
        console.error('❌ Squad update failed:', error.response?.data || error.message);
      }
    }

    // Test DPE Update (if DPEs exist)
    if (dpes.length > 0) {
      console.log('\n🔄 Testing DPE Update...');
      const testDPE = dpes[0];
      try {
        const dpeUpdateResponse = await axios.put(
          `${API_BASE_URL}/api/dpe/${testDPE.id}`,
          {
            name: `${testDPE.name} (Updated)`,
            squadID: testDPE.squadID
            // Note: email and role not included for DPEs
          }
        );
        
        console.log('✅ DPE update successful:', dpeUpdateResponse.data);
      } catch (error) {
        console.error('❌ DPE update failed:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Failed to connect to API server:', error.message);
    console.error('🔧 Make sure mongodb-api-server.cjs is running on port 3001');
  }
}

// Run the test
console.log('🚀 Entity Management Update Test Script');
console.log('=====================================\n');

testEntityUpdates().then(() => {
  console.log('\n✅ Entity Management Update Tests Complete');
}).catch((error) => {
  console.error('\n❌ Test script failed:', error);
});