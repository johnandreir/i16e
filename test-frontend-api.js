// Test frontend entityService with new singular endpoints
import { EntityService } from '../src/lib/entityService.ts';

const baseUrl = 'http://localhost:3001/api';
const entityService = new EntityService(baseUrl);

console.log('=== Testing Frontend EntityService with Singular Endpoints ===');

async function testEntityService() {
  try {
    console.log('1. Testing getTeamsWithIds()...');
    const teams = await entityService.getTeamsWithIds();
    console.log('Teams:', teams);

    console.log('\n2. Testing getSquadsWithIds()...');
    const squads = await entityService.getSquadsWithIds();
    console.log('Squads:', squads);

    console.log('\n3. Testing getDPEsWithIds()...');
    const dpes = await entityService.getDPEsWithIds();
    console.log('DPEs:', dpes);

    console.log('\n✅ All frontend API calls working correctly!');
  } catch (error) {
    console.error('❌ Error testing frontend:', error);
  }
}

testEntityService();