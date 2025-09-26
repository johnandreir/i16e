#!/usr/bin/env node

/**
 * Minimal Squad and DPE Update Test
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function minimalTest() {
  console.log('🧪 Minimal Squad/DPE Update Test...\n');

  try {
    // Test with a simple squad update - no validation checks
    console.log('📋 Getting first squad...');
    const squadsResponse = await axios.get(`${API_BASE_URL}/api/squad`);
    const squads = squadsResponse.data;
    
    if (squads.length > 0) {
      const squad = squads[0];
      console.log('Found squad:', {
        id: squad.id,
        name: squad.name,
        teamID: squad.teamID,
        description: squad.description
      });

      console.log('\n🔄 Attempting minimal squad update...');
      
      // Try with exact same data first
      try {
        const response = await axios.put(
          `${API_BASE_URL}/api/squad/${squad.id}`,
          {
            name: squad.name,
            teamID: squad.teamID,
            description: squad.description || 'test'
          }
        );
        console.log('✅ Squad update successful:', response.data);
      } catch (error) {
        console.error('❌ Squad update failed:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data?.error);
        console.error('Details:', error.response?.data?.details);
        if (error.response?.data) {
          console.error('Full response:', JSON.stringify(error.response.data, null, 2));
        }
      }
    }

    // Similar test for DPE
    console.log('\n📋 Getting first DPE...');
    const dpesResponse = await axios.get(`${API_BASE_URL}/api/dpe`);
    const dpes = dpesResponse.data;
    
    if (dpes.length > 0) {
      const dpe = dpes[0];
      console.log('Found DPE:', {
        id: dpe.id,
        name: dpe.name,
        squadID: dpe.squadID,
        email: dpe.email,
        role: dpe.role
      });

      console.log('\n🔄 Attempting minimal DPE update...');
      
      try {
        const response = await axios.put(
          `${API_BASE_URL}/api/dpe/${dpe.id}`,
          {
            name: dpe.name,
            squadID: dpe.squadID
            // Note: email and role not included for DPEs
          }
        );
        console.log('✅ DPE update successful:', response.data);
      } catch (error) {
        console.error('❌ DPE update failed:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data?.error);
        console.error('Details:', error.response?.data?.details);
        if (error.response?.data) {
          console.error('Full response:', JSON.stringify(error.response.data, null, 2));
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

minimalTest();