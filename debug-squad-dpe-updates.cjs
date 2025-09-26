#!/usr/bin/env node

/**
 * Debug DPE and Squad Update Issues
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function debugUpdates() {
  console.log('🐛 Debugging DPE and Squad Updates...\n');

  try {
    // Get squads and DPEs to test with
    console.log('📋 Fetching squads and DPEs...');
    
    const [squadsResponse, dpesResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/squad`),
      axios.get(`${API_BASE_URL}/api/dpe`)
    ]);

    const squads = squadsResponse.data;
    const dpes = dpesResponse.data;

    console.log(`✅ Found ${squads.length} squads, ${dpes.length} DPEs\n`);

    if (squads.length > 0) {
      const testSquad = squads[0];
      console.log('🔄 Testing Squad Update...');
      console.log('Squad to update:', {
        id: testSquad.id,
        name: testSquad.name,
        teamID: testSquad.teamID
      });

      try {
        const updateData = {
          name: `${testSquad.name} (Test Update)`,
          teamID: testSquad.teamID,
          description: 'Test description update'
        };

        console.log('Update payload:', updateData);

        const response = await axios.put(
          `${API_BASE_URL}/api/squad/${testSquad.id}`,
          updateData
        );
        
        console.log('✅ Squad update response:', response.data);
      } catch (error) {
        console.error('❌ Squad update error:', {
          status: error.response?.status,
          message: error.response?.data?.error || error.message,
          details: error.response?.data?.details,
          fullResponse: error.response?.data
        });
      }
    }

    if (dpes.length > 0) {
      const testDPE = dpes[0];
      console.log('\n🔄 Testing DPE Update...');
      console.log('DPE to update:', {
        id: testDPE.id,
        name: testDPE.name,
        squadID: testDPE.squadID
      });

      try {
        const updateData = {
          name: `${testDPE.name} (Test Update)`,
          squadID: testDPE.squadID
          // Note: email and role not included for DPEs
        };

        console.log('Update payload:', updateData);

        const response = await axios.put(
          `${API_BASE_URL}/api/dpe/${testDPE.id}`,
          updateData
        );
        
        console.log('✅ DPE update response:', response.data);
      } catch (error) {
        console.error('❌ DPE update error:', {
          status: error.response?.status,
          message: error.response?.data?.error || error.message,
          details: error.response?.data?.details,
          fullResponse: error.response?.data
        });
      }
    }

  } catch (error) {
    console.error('❌ Failed to connect to API:', error.message);
  }
}

debugUpdates();