#!/usr/bin/env node
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Raw response:', data);
        try {
          const parsed = JSON.parse(data);
          console.log('Parsed response:', JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (e) {
          console.log('Parse error:', e.message);
          resolve(data);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

makeRequest('/api/n8n/health');