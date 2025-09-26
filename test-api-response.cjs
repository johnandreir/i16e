// Direct API test to see exact response
const fetch = require('node-fetch').default || require('node-fetch');

async function testApiResponse() {
  try {
    console.log('🧪 Testing API Response Structure');
    
    const response = await fetch('http://localhost:3001/api/performance-data?entity_name=Mharlee%20Dela%20Cruz&limit=1');
    const data = await response.json();
    
    console.log('📡 Raw API Response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testApiResponse();