// Test script to validate MongoDB entity operations

async function testEntityOperations() {
  const baseUrl = 'http://localhost:3001/api';

  async function request(endpoint, options = {}) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(error.message || 'Network error');
    }
  }
  
  try {
    console.log('=== Testing MongoDB Entity Operations ===');
    
    // Clear existing data first - get all entities and delete them
    console.log('1. Clearing existing data...');
    
    // Delete all DPEs first
    const dpes = await request('/dpes');
    for (const dpe of dpes) {
      if (dpe._id) {
        await request(`/dpes/${dpe._id}`, { method: 'DELETE' });
      }
    }
    
    // Delete all squads
    const squads = await request('/squads');
    for (const squad of squads) {
      if (squad._id) {
        await request(`/squads/${squad._id}`, { method: 'DELETE' });
      }
    }
    
    // Delete all teams
    const teams = await request('/teams');
    for (const team of teams) {
      if (team._id) {
        await request(`/teams/${team._id}`, { method: 'DELETE' });
      }
    }
    
    console.log('✅ Data cleared successfully');
    
    // Test creating a team
    console.log('2. Creating a test team...');
    const team = await request('/teams', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Team', description: 'A test team description' })
    });
    console.log('✅ Team created:', team);
    
    // Test creating a squad
    console.log('3. Creating a test squad...');
    const squad = await request('/squads', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Squad', team_id: team._id, description: 'A test squad description' })
    });
    console.log('✅ Squad created:', squad);
    
    // Test creating a DPE
    console.log('4. Creating a test DPE...');
    const dpe = await request('/dpes', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test DPE', squad_id: squad._id, email: 'test@example.com' })
    });
    console.log('✅ DPE created:', dpe);
    
    // Test reading entities
    console.log('5. Reading all entities...');
    const allTeams = await request('/teams');
    const allSquads = await request('/squads');
    const allDpes = await request('/dpes');
    
    console.log('Teams:', allTeams);
    console.log('Squads:', allSquads);
    console.log('DPEs:', allDpes);
    
    console.log('=== All tests completed successfully! ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEntityOperations();