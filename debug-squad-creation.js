// Debug squad creation issue
import('./src/lib/entityService.ts').then(async ({ default: EntityService }) => {
  const service = new EntityService();
  
  console.log('=== Debugging Squad Creation Issue ===');
  
  try {
    // 1. Test the API endpoint directly
    console.log('\n1. Testing raw API calls:');
    
    // Test teams endpoint
    const teamsResponse = await fetch('http://localhost:3001/api/teams');
    const teamsData = await teamsResponse.json();
    console.log('Teams API response:', teamsData);
    
    if (teamsData.length > 0) {
      const teamToUse = teamsData[0];
      console.log('Team to use for squad creation:', teamToUse);
      
      // Test squad creation via raw API
      console.log('\n2. Testing raw squad creation API:');
      const squadData = {
        name: 'Debug Squad ' + Date.now(),
        teamID: teamToUse.id  // Use the id field from API response
      };
      console.log('Squad data to send:', squadData);
      
      const squadResponse = await fetch('http://localhost:3001/api/squads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(squadData)
      });
      
      console.log('Squad creation response status:', squadResponse.status);
      const squadResult = await squadResponse.json();
      console.log('Squad creation response:', squadResult);
      
      if (squadResponse.ok) {
        console.log('✅ Raw API call successful!');
      } else {
        console.log('❌ Raw API call failed:', squadResult);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
});