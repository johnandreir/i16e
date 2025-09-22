const http = require('http');

// Simulate the data that would typically be sent when "Generate Report" is clicked
const reportData = {
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31",
    reportType: "performance",
    source: "generate-report-button",
    timestamp: new Date().toISOString(),
    filters: {
        includeMetrics: true,
        includeCases: true
    }
};

console.log('🎯 Simulating "Generate Report" button click...');
console.log('📋 Report parameters:', JSON.stringify(reportData, null, 2));

function callWebhookEndpoint(endpoint, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log(`\n🚀 Calling ${endpoint}...`);
        
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                console.log(`✅ ${endpoint} completed with status ${res.statusCode}`);
                resolve({
                    endpoint,
                    status: res.statusCode,
                    response: responseData
                });
            });
        });

        req.on('error', (error) => {
            console.log(`❌ ${endpoint} failed: ${error.message}`);
            reject(error);
        });

        req.setTimeout(30000, () => {
            console.log(`⏰ ${endpoint} timeout`);
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.write(postData);
        req.end();
    });
}

async function triggerGenerateReport() {
    console.log('\n🎬 Starting Generate Report workflow...');
    
    try {
        // Step 1: Call get-cases endpoint (triggers get-performance webhook)
        console.log('\n📊 Step 1: Getting cases data...');
        const getCasesResult = await callWebhookEndpoint('/api/n8n/get-cases', reportData);
        
        // Step 2: Call calculate-metrics endpoint (triggers get-metrics webhook)  
        console.log('\n📈 Step 2: Calculating metrics...');
        const getMetricsResult = await callWebhookEndpoint('/api/n8n/calculate-metrics', reportData);
        
        console.log('\n🏁 Generate Report workflow completed!');
        console.log('\n📋 Summary:');
        console.log(`- Get Cases: ${getCasesResult.status === 200 ? '✅ Success' : '❌ Failed'}`);
        console.log(`- Calculate Metrics: ${getMetricsResult.status === 200 ? '✅ Success' : '❌ Failed'}`);
        
        if (getCasesResult.status === 200) {
            console.log('\n📄 Get Cases Response:', getCasesResult.response);
        }
        
        if (getMetricsResult.status === 200) {
            console.log('\n📄 Calculate Metrics Response:', getMetricsResult.response);
        }
        
    } catch (error) {
        console.log(`\n💥 Generate Report failed: ${error.message}`);
    }
}

console.log('\n🔍 Check the server console for detailed webhook logs showing:');
console.log('   📦 Exact data sent to webhook-test/get-performance');
console.log('   📦 Exact data sent to webhook-test/get-metrics');
console.log('   📥 Response status and headers from N8N');
console.log('   📄 Response data from webhooks');

triggerGenerateReport();