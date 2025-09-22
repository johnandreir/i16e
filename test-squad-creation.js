// Test squad creation functionality
import('./src/lib/entityService.ts').then(async ({ default: EntityService }) => {
  const service = new EntityService();
  
  console.log('=== Testing Squad Creation Fix ===');
  
  try {
    // 1. Check if we have any teams to work with
    console.log('\n1. Checking available teams:');
    const teams = await service.getTeamsWithIds();
    console.log('Available teams:', teams.map(t => ({ id: t.id, name: t.name })));
    
    if (teams.length === 0) {
      console.log('No teams available. Creating a test team first...');
      const newTeam = await service.createTeam('Test Team');
      console.log('Created team:', newTeam);
    }
    
    // 2. Get the team to use for squad creation
    const updatedTeams = await service.getTeamsWithIds();
    const teamToUse = updatedTeams[0];
    console.log('\n2. Using team for squad creation:', teamToUse);
    
    // 3. Try to create a squad
    console.log('\n3. Creating squad...');
    const squadName = 'Test Squad ' + Date.now(); // Unique name
    const newSquad = await service.createSquad(squadName, teamToUse.name);
    console.log('Squad created successfully:', newSquad);
    
    // 4. Verify the squad was created
    console.log('\n4. Verifying squad creation...');
    const squads = await service.getSquadsWithIds();
    const createdSquad = squads.find(s => s.name === squadName);
    
    if (createdSquad) {
      console.log('✅ SUCCESS: Squad was successfully created and found in database!');
      console.log('Squad details:', createdSquad);
    } else {
      console.log('❌ FAILED: Squad not found in database after creation');
    }
    
  } catch (error) {
    console.error('❌ Error during squad creation test:', error);
  }
});