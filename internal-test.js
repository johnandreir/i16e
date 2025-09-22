console.log('🧪 Testing API endpoints directly...');

setTimeout(async () => {
    try {
        console.log('📞 Making test request to health endpoint...');
        
        const response = await fetch('http://localhost:3001/api/health');
        const data = await response.text();
        
        console.log('✅ Health endpoint response:', response.status);
        console.log('📄 Response data:', data.substring(0, 100));
        
    } catch (error) {
        console.log('❌ Health endpoint failed:', error.message);
    }
    
    try {
        console.log('📞 Making test request to get-cases endpoint...');
        
        const response = await fetch('http://localhost:3001/api/n8n/get-cases', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                test: true,
                dateFrom: '2024-01-01',
                dateTo: '2024-12-31'
            })
        });
        
        const data = await response.text();
        
        console.log('✅ Get-cases endpoint response:', response.status);
        console.log('📄 Response data:', data.substring(0, 100));
        
    } catch (error) {
        console.log('❌ Get-cases endpoint failed:', error.message);
    }
    
}, 5000); // Wait 5 seconds for server to be ready

console.log('⏳ Will test endpoints in 5 seconds...');