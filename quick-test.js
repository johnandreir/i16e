// Quick test to check specific endpoints
const testUrls = [
  'http://localhost:3001/api/health',
  'http://localhost:3001/api/test/before-n8n',
  'http://localhost:3001/api/n8n/health'
];

async function quickTest() {
  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      
      // All endpoints use GET method now
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Success: ${JSON.stringify(data).slice(0, 100)}...`);
      } else {
        console.log(`  ❌ Failed`);
      }
    } catch (error) {
      console.log(`  💥 Error: ${error.message}`);
    }
    console.log('');
  }
}

quickTest().catch(console.error);