// Minimal squad creation test
(async () => {
  try {
    console.log('=== Minimal Squad Creation Test ===');
    
    // 1. Get teams first
    console.log('\n1. Getting teams...');
    const teamsResponse = await fetch('http://localhost:3001/api/teams');
    const teams = await teamsResponse.json();
    console.log('Teams:', teams);
    
    if (teams.length === 0) {
      console.log('No teams found. Cannot create squad without team.');
      return;
    }
    
    const team = teams[0];
    console.log('Using team:', team);
    
    // 2. Create squad with minimal data
    console.log('\n2. Creating squad...');
    const squadData = {
      name: 'Test Squad Simple',
      teamID: team.id
    };
    
    console.log('Squad data to send:', squadData);
    
    const response = await fetch('http://localhost:3001/api/squads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(squadData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const result = await response.text();
    console.log('Response body (raw):', result);
    
    try {
      const jsonResult = JSON.parse(result);
      console.log('Response body (parsed):', jsonResult);
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
})();