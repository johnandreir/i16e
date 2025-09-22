const http = require('http');

function getDetailedN8NStatus() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3001/api/n8n/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: data
                });
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function showFullStatus() {
    console.log('🔍 Getting detailed N8N health status...\n');
    
    try {
        const result = await getDetailedN8NStatus();
        
        if (result.status === 200) {
            const data = JSON.parse(result.data);
            
            console.log('📊 Complete N8N Health Status:');
            console.log('================================');
            console.log(`Timestamp: ${data.timestamp}`);
            console.log();
            
            console.log('🎯 N8N Service Status:');
            console.log(`  Reachable: ${data.n8nHealth.n8nServiceStatus.reachable}`);
            console.log(`  Message: ${data.n8nHealth.n8nServiceStatus.message}`);
            console.log();
            
            console.log('📋 N8N Workflow Status:');
            console.log(`  Reachable: ${data.n8nHealth.n8nWorkflowStatus.reachable}`);
            console.log(`  Total Count: ${data.n8nHealth.n8nWorkflowStatus.totalCount}`);
            console.log(`  Active Count: ${data.n8nHealth.n8nWorkflowStatus.activeCount}`);
            console.log(`  Message: ${data.n8nHealth.n8nWorkflowStatus.message}`);
            console.log();
            
            console.log('🔗 N8N Webhook Status:');
            console.log(`  Get Cases - Reachable: ${data.n8nHealth.n8nWebhookStatus.getCases.reachable}`);
            console.log(`  Get Cases - Message: ${data.n8nHealth.n8nWebhookStatus.getCases.message}`);
            console.log(`  Calculate Metrics - Reachable: ${data.n8nHealth.n8nWebhookStatus.calculateMetrics.reachable}`);
            console.log(`  Calculate Metrics - Message: ${data.n8nHealth.n8nWebhookStatus.calculateMetrics.message}`);
            console.log();
            
            console.log('🏁 Overall Status:');
            console.log(`  Healthy: ${data.overall.healthy}`);
            console.log(`  Message: ${data.overall.message}`);
            
        } else {
            console.log(`❌ Failed with status: ${result.status}`);
        }
    } catch (error) {
        console.log(`💥 ERROR: ${error.message}`);
    }
}

showFullStatus();