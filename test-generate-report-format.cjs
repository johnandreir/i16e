const http = require('http');

// Simulate Generate Report click with correct data format
const simulateGenerateReport = async () => {
    console.log('🎯 Simulating "Generate Report" button click...');
    console.log('🔍 This will show the exact data being sent to http://localhost:5678/webhook-test/get-performance\n');

    // Example: When user selects "Mharlee Dela Cruz" and date range Aug 1-30, 2025
    const testPayload = {
        owner_full_name: [
            "Mharlee Dela Cruz"
        ],
        closed_date: [
            "2025-08-01T00:00:00Z TO 2025-08-30T23:59:59Z"
        ]
    };

    console.log('📦 Payload format that will be sent to N8N webhook:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('\n🚀 Sending to API proxy endpoint...\n');

    try {
        const response = await fetch('http://localhost:3001/api/n8n/get-cases', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
        });

        const result = await response.text();
        
        console.log('📊 Response Status:', response.status);
        console.log('📄 Response:', result);
        
        if (response.ok) {
            console.log('\n✅ SUCCESS! Check the server console above for detailed webhook logs.');
            console.log('   You should see:');
            console.log('   📍 N8N get-cases endpoint called');
            console.log('   📦 Request body received with your payload');
            console.log('   🎯 Target webhook URL: http://n8n:5678/webhook-test/get-performance');
            console.log('   📤 Data being sent to webhook');
            console.log('   📥 N8N webhook response status and headers');
        } else {
            console.log('\n❌ Request failed with status:', response.status);
        }

    } catch (error) {
        console.log('\n💥 Error:', error.message);
    }
};

console.log('🧪 Testing Generate Report webhook trigger...');
console.log('📋 Expected data format:');
console.log('   • owner_full_name: Array of DPE names mapped to selected entity');
console.log('   • closed_date: Array with date range in "YYYY-MM-DDTHH:mm:ssZ TO YYYY-MM-DDTHH:mm:ssZ" format');
console.log('   • Time range: Always 00:00:00 to 23:59:59\n');

simulateGenerateReport();