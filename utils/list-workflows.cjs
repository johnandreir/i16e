const http = require('http');

// Configuration
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOTMwOTc1Mi01M2M2LTQxNTUtYTQxZi03NmNhYmJmOWJiZWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU4OTkyNDAzLCJleHAiOjE3NjE1MjMyMDB9.-PHWM4_1ZW4v4XZtdhOyz9c-P6WwfjcqUFPTmLjxWHw';

// Helper function for HTTP requests
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = responseData ? JSON.parse(responseData) : {};
          resolve({ statusCode: res.statusCode, body: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Get all workflows
async function getAllWorkflows() {
  const options = {
    hostname: 'localhost',
    port: 5678,
    path: '/api/v1/workflows',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log('Available workflows:');
      const workflows = response.body.data || [];
      
      workflows.forEach(workflow => {
        console.log(`- ${workflow.name}: ${workflow.id}`);
      });
    } else {
      console.error('Failed to get workflows:', response.statusCode, response.body);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
getAllWorkflows();