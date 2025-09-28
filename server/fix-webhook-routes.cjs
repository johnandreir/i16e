// Fix n8n webhook URLs
module.exports = function(app) {
  // Fix the analyze-sct endpoint
  app.post('/api/n8n/webhook/analyze-sct', async (req, res) => {
    console.log('📍 Proxy: Analyze SCT webhook endpoint called directly');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      // Forward to the correct n8n webhook URL
      const n8nHost = process.env.IN_DOCKER === 'true' ? 'n8n' : 'localhost';
      const webhookUrl = `http://${n8nHost}:5678/webhook-test/analyze-sct`;
      console.log('🔄 Forwarding to correct n8n webhook:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
      
      if (!response.ok) {
        throw new Error(`N8N webhook returned status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ N8N webhook response received:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      res.json(data);
    } catch (error) {
      console.error('❌ Error forwarding to n8n webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to forward to n8n webhook',
        error: error.toString()
      });
    }
  });
  
  // Fix the analyze-survey endpoint
  app.post('/api/n8n/webhook/analyze-survey', async (req, res) => {
    console.log('📍 Proxy: Analyze Survey webhook endpoint called directly');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      // Forward to the correct n8n webhook URL
      const n8nHost = process.env.IN_DOCKER === 'true' ? 'n8n' : 'localhost';
      const webhookUrl = `http://${n8nHost}:5678/webhook-test/analyze-survey`;
      console.log('🔄 Forwarding to correct n8n webhook:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
      
      if (!response.ok) {
        throw new Error(`N8N webhook returned status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ N8N webhook response received:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      res.json(data);
    } catch (error) {
      console.error('❌ Error forwarding to n8n webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to forward to n8n webhook',
        error: error.toString()
      });
    }
  });
  
  console.log('🚀 Fixed webhook proxies registered: /api/n8n/webhook/analyze-sct, /api/n8n/webhook/analyze-survey');
};