#!/usr/bin/env node

/**
 * Comprehensive Entity Update Debug Script
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function debugAllUpdates() {
  console.log('🔍 Comprehensive Entity Update Debug...\n');

  try {
    // Get all entities
    console.log('📋 Fetching all entities...');
    const [teamsResponse, squadsResponse, dpesResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/team`),
      axios.get(`${API_BASE_URL}/api/squad`),
      axios.get(`${API_BASE_URL}/api/dpe`)
    ]);

    const teams = teamsResponse.data;
    const squads = squadsResponse.data;
    const dpes = dpesResponse.data;

    console.log(`✅ Found ${teams.length} teams, ${squads.length} squads, ${dpes.length} DPEs\n`);

    // Test Team Update (working but with error)
    if (teams.length > 0) {
      const team = teams[0];
      console.log('🔄 Testing Team Update (should work but might show error)...');
      console.log('Original team data:', JSON.stringify(team, null, 2));

      try {
        const response = await axios.put(
          `${API_BASE_URL}/api/team/${team.id}`,
          {
            name: `${team.name} - UPDATED`,
            description: team.description || 'Test description'
          }
        );
        console.log('✅ Team update SUCCESS - Response:', JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('❌ Team update FAILED:');
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
      }
    }

    // Test Squad Update
    if (squads.length > 0) {
      const squad = squads[0];
      console.log('\n🔄 Testing Squad Update...');
      console.log('Original squad data:', JSON.stringify(squad, null, 2));

      // First check if the teamID exists in teams
      const teamExists = teams.find(t => t.id === squad.teamID);
      console.log('Team exists for this squad:', !!teamExists);
      
      try {
        const response = await axios.put(
          `${API_BASE_URL}/api/squad/${squad.id}`,
          {
            name: `${squad.name} - UPDATED`,
            teamID: squad.teamID,
            description: squad.description || 'Test description'
          }
        );
        console.log('✅ Squad update SUCCESS - Response:', JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('❌ Squad update FAILED:');
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));

        // Try with a different team ID if the current one doesn't exist
        if (teams.length > 0 && error.response?.status === 400) {
          console.log('\n🔄 Retrying squad update with first team ID...');
          try {
            const retryResponse = await axios.put(
              `${API_BASE_URL}/api/squad/${squad.id}`,
              {
                name: `${squad.name} - UPDATED`,
                teamID: teams[0].id,
                description: squad.description || 'Test description'
              }
            );
            console.log('✅ Squad update RETRY SUCCESS - Response:', JSON.stringify(retryResponse.data, null, 2));
          } catch (retryError) {
            console.error('❌ Squad update RETRY FAILED:');
            console.error('Status:', retryError.response?.status);
            console.error('Data:', JSON.stringify(retryError.response?.data, null, 2));
          }
        }
      }
    }

    // Test DPE Update
    if (dpes.length > 0) {
      const dpe = dpes[0];
      console.log('\n🔄 Testing DPE Update...');
      console.log('Original DPE data:', JSON.stringify(dpe, null, 2));

      // Check if the squadID exists in squads
      const squadExists = squads.find(s => s.id === dpe.squadID);
      console.log('Squad exists for this DPE:', !!squadExists);

      try {
        const response = await axios.put(
          `${API_BASE_URL}/api/dpe/${dpe.id}`,
          {
            name: `${dpe.name} - UPDATED`,
            squadID: dpe.squadID
            // Note: email and role not included for DPEs
          }
        );
        console.log('✅ DPE update SUCCESS - Response:', JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('❌ DPE update FAILED:');
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));

        // Try with a different squad ID if the current one doesn't exist
        if (squads.length > 0 && error.response?.status === 400) {
          console.log('\n🔄 Retrying DPE update with first squad ID...');
          try {
            const retryResponse = await axios.put(
              `${API_BASE_URL}/api/dpe/${dpe.id}`,
              {
                name: `${dpe.name} - UPDATED`,
                squadID: squads[0].id
                // Note: email and role not included for DPEs
              }
            );
            console.log('✅ DPE update RETRY SUCCESS - Response:', JSON.stringify(retryResponse.data, null, 2));
          } catch (retryError) {
            console.error('❌ DPE update RETRY FAILED:');
            console.error('Status:', retryError.response?.status);
            console.error('Data:', JSON.stringify(retryError.response?.data, null, 2));
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
  }
}

debugAllUpdates();