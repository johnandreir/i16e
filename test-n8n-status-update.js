// Simple test to verify n8n status updates
const fetch = require('node-fetch');

async function testN8nStatus() {
    try {
        console.log('🔍 Testing updated N8N status...\n');
        
        const response = await fetch('http://localhost:3001/api/n8n/health');
        
        if (!response.ok) {
            console.log('❌ Server not responding');
            return;
        }
        
        const data = await response.json();
        
        console.log('📊 N8N Health Status:');
        console.log('======================');
        console.log(`Timestamp: ${data.timestamp}`);
        console.log('');
        
        console.log('🎯 N8N Service Status:');
        console.log(`  Reachable: ${data.n8nHealth.n8nServiceStatus.reachable}`);
        console.log(`  Message: ${data.n8nHealth.n8nServiceStatus.message}`);
        console.log('');
        
        console.log('📋 N8N Workflow Status:');
        console.log(`  Reachable: ${data.n8nHealth.n8nWorkflowStatus.reachable}`);
        console.log(`  Message: ${data.n8nHealth.n8nWorkflowStatus.message}`);
        
        // Check if the old authentication message is gone
        if (data.n8nHealth.n8nWorkflowStatus.message.includes('authentication required')) {
            console.log('  ❌ OLD MESSAGE STILL PRESENT');
        } else {
            console.log('  ✅ Authentication message removed');
        }
        console.log('');
        
        console.log('🔗 N8N Webhook Status:');
        console.log(`  Get Cases - Reachable: ${data.n8nHealth.n8nWebhookStatus.getCases.reachable}`);
        console.log(`  Get Cases - Message: ${data.n8nHealth.n8nWebhookStatus.getCases.message}`);
        console.log(`  Calculate Metrics - Reachable: ${data.n8nHealth.n8nWebhookStatus.calculateMetrics.reachable}`);
        console.log(`  Calculate Metrics - Message: ${data.n8nHealth.n8nWebhookStatus.calculateMetrics.message}`);
        
        // Check webhook status improvements
        const getCasesMsg = data.n8nHealth.n8nWebhookStatus.getCases.message;
        const metricsMsg = data.n8nHealth.n8nWebhookStatus.calculateMetrics.message;
        
        if (getCasesMsg.includes('listening') && !getCasesMsg.includes('awaiting')) {
            console.log('  ❌ OLD WEBHOOK MESSAGE STILL PRESENT');
        } else {
            console.log('  ✅ Webhook status message updated');
        }
        console.log('');
        
        console.log('🏁 Overall Status:');
        console.log(`  Healthy: ${data.overall.healthy}`);
        console.log(`  Message: ${data.overall.message}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testN8nStatus();