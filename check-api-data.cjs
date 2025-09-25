const https = require('https');
const http = require('http');

async function checkPerformanceData() {
  try {
    console.log('Fetching performance data...');
    
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3001/api/performance-data', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ ok: res.statusCode === 200, text: () => data }));
      });
      req.on('error', reject);
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.statusCode}`);
    }
    
    const rawData = response.text();
    const data = JSON.parse(rawData);
    
    console.log('Performance data response:');
    console.log('- Records count:', data.length);
    
    if (data.length > 0) {
      console.log('\nRaw first record structure:');
      console.log(JSON.stringify(data[0], null, 2));
      
      console.log('\nAll record keys:');
      data.forEach((record, i) => {
        console.log(`Record ${i + 1} keys:`, Object.keys(record));
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPerformanceData();