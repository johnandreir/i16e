const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB connection
const MONGODB_URI = 'mongodb://admin:N0virus1!@localhost:27017/i16e-db?authSource=admin';
let mongoClient = null;

async function connectMongoDB() {
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Basic health check
app.get('/api/health', async (req, res) => {
  console.log('🏥 Basic health check called');
  const isMongoConnected = mongoClient && mongoClient.topology && mongoClient.topology.isConnected();
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    server: 'running',
    mongodb: isMongoConnected ? 'connected' : 'disconnected',
    message: 'API server is running'
  });
});

// Simple debug endpoint
app.get('/api/simple-debug', (req, res) => {
  console.log('🔍 Simple debug endpoint called');
  res.json({ 
    message: 'Simple debug endpoint works', 
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

// N8N Health Check - GET method, no authentication
app.get('/api/n8n/health', async (req, res) => {
  console.log('🎯 N8N Health endpoint called!');
  
  try {
    console.log('🔍 Checking N8N service health...');

    // Check if N8N service is reachable (no auth)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let n8nServiceStatus = {
      reachable: false,
      message: 'N8N service not accessible'
    };

    let workflowStatus = {
      reachable: false,
      activeCount: 0,
      totalCount: 0,
      message: 'Cannot check workflows'
    };

    let webhookStatus = {
      getCases: { reachable: false, message: 'Webhook not accessible' },
      calculateMetrics: { reachable: false, message: 'Webhook not accessible' }
    };

    try {
      // Check N8N service
      const n8nResponse = await fetch('http://localhost:5678', {
        method: 'GET',
        signal: controller.signal
      });

      n8nServiceStatus = {
        reachable: n8nResponse.ok || n8nResponse.status < 500,
        status: n8nResponse.status,
        message: n8nResponse.ok ? 'N8N service is running' : `N8N service returned ${n8nResponse.status}`
      };

      if (n8nServiceStatus.reachable) {
        // Check workflow API
        try {
          const workflowResponse = await fetch('http://localhost:5678/rest/workflows', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
          });

          if (workflowResponse.ok) {
            const workflows = await workflowResponse.json();
            const allWorkflows = workflows.data || [];
            const activeWorkflows = allWorkflows.filter(w => w.active);

            workflowStatus = {
              reachable: true,
              activeCount: activeWorkflows.length,
              totalCount: allWorkflows.length,
              message: `${activeWorkflows.length} active out of ${allWorkflows.length} total workflows`
            };
          }
        } catch (error) {
          console.log('⚠️ Workflow check failed:', error.message);
        }

        // Check webhook endpoints (only get-performance, since get-metrics is now a sub-workflow)
        try {
          const getCasesCheck = await fetch('http://localhost:5678/webhook-test/get-performance', {
            method: 'HEAD',
            signal: controller.signal
          });

          webhookStatus = {
            getCases: {
              reachable: getCasesCheck.status === 200,
              status: getCasesCheck.status,
              message: getCasesCheck.status === 200 ? 'Webhook active and listening' : 
                      getCasesCheck.status === 405 ? 'Webhook endpoint exists but workflow may be inactive' : 
                      'Webhook error'
            },
            calculateMetrics: {
              reachable: true,
              status: 'N/A',
              message: 'Now integrated as sub-workflow (no longer webhook)'
            }
          };
        } catch (error) {
          console.log('⚠️ Webhook check failed:', error.message);
        }
      }
    } catch (error) {
      console.log('⚠️ N8N service check failed:', error.message);
    }

    clearTimeout(timeoutId);

    const overallHealthy = n8nServiceStatus.reachable && 
                          workflowStatus.reachable && 
                          webhookStatus.getCases.reachable;
                          // Note: calculateMetrics is now a sub-workflow, not a webhook

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      n8nHealth: {
        n8nWorkflowStatus: workflowStatus,
        n8nWebhookStatus: webhookStatus,
        n8nServiceStatus: n8nServiceStatus
      },
      overall: {
        healthy: overallHealthy,
        message: overallHealthy ? 
                'N8N service fully operational' : 
                'N8N service has some issues'
      }
    };

    console.log('📊 N8N Health Check Result:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Error in N8N health check:', error);
    res.status(500).json({
      success: false,
      message: 'N8N health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// N8N Get Cases webhook proxy
app.post('/api/n8n/get-cases', async (req, res) => {
  console.log('📍 N8N Get Cases endpoint called');
  console.log('📥 Request body:', req.body);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const n8nResponse = await fetch('http://localhost:5678/webhook-test/get-performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!n8nResponse.ok) {
      throw new Error(`N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }

    const responseData = await n8nResponse.json();
    console.log('✅ N8N Get Cases response received');

    res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in Get Cases webhook:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.name === 'AbortError') {
      statusCode = 408;
      errorMessage = 'Request timeout';
    } else if (error.message.includes('ECONNREFUSED')) {
      statusCode = 503;
      errorMessage = 'N8N service unavailable';
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// N8N Calculate Metrics webhook proxy
app.post('/api/n8n/calculate-metrics', async (req, res) => {
  console.log('📍 N8N Calculate Metrics endpoint called');
  console.log('📥 Request body:', req.body);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const n8nResponse = await fetch('http://localhost:5678/webhook-test/get-metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!n8nResponse.ok) {
      throw new Error(`N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }

    const responseData = await n8nResponse.json();
    console.log('✅ N8N Calculate Metrics response received');

    res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in Calculate Metrics webhook:', error);
    
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.name === 'AbortError') {
      statusCode = 408;
      errorMessage = 'Request timeout';
    } else if (error.message.includes('ECONNREFUSED')) {
      statusCode = 503;
      errorMessage = 'N8N service unavailable';
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test page
app.get('/test-n8n', (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>N8N API Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        button { padding: 10px 20px; margin: 10px; cursor: pointer; }
        .result { margin: 10px 0; padding: 10px; border: 1px solid #ccc; background: #f9f9f9; }
        .error { background: #ffebee; border-color: #f44336; }
        .success { background: #e8f5e8; border-color: #4caf50; }
    </style>
</head>
<body>
    <h1>N8N API Test Page</h1>
    
    <button onclick="testHealth()">Test N8N Health</button>
    <button onclick="testBasicHealth()">Test Basic Health</button>
    <button onclick="testSimpleDebug()">Test Simple Debug</button>
    
    <div id="result" class="result">Click a button to test the endpoints</div>

    <script>
        async function testHealth() {
            await testEndpoint('/api/n8n/health', 'GET', null, 'N8N Health Check');
        }
        
        async function testBasicHealth() {
            await testEndpoint('/api/health', 'GET', null, 'Basic Health Check');
        }
        
        async function testSimpleDebug() {
            await testEndpoint('/api/simple-debug', 'GET', null, 'Simple Debug');
        }
        
        async function testEndpoint(url, method, body, name) {
            const resultDiv = document.getElementById('result');
            resultDiv.className = 'result';
            resultDiv.innerHTML = \`Testing \${name} (\${method})...\`;
            
            try {
                const options = {
                    method,
                    headers: { 'Content-Type': 'application/json' }
                };
                
                if (body) {
                    options.body = JSON.stringify(body);
                }
                
                const response = await fetch(url, options);
                
                resultDiv.className = 'result ' + (response.ok ? 'success' : 'error');
                
                if (response.ok) {
                    const data = await response.json();
                    resultDiv.innerHTML = \`<strong>✅ \${name} Success!</strong><br>Status: \${response.status}<br><pre>\${JSON.stringify(data, null, 2)}</pre>\`;
                } else {
                    const text = await response.text();
                    resultDiv.innerHTML = \`<strong>❌ \${name} Failed!</strong><br>Status: \${response.status}<br>Response: \${text}\`;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = \`<strong>💥 \${name} Error!</strong><br>\${error.message}\`;
            }
        }
    </script>
</body>
</html>`;
  res.send(html);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  console.log('🚀 Starting N8N API Server...');
  
  // Connect to MongoDB
  await connectMongoDB();
  
  // Start Express server
  app.listen(PORT, () => {
    console.log(`✅ N8N API Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 N8N health: http://localhost:${PORT}/api/n8n/health`);
    console.log(`🧪 Test page: http://localhost:${PORT}/test-n8n`);
    console.log(`🔧 Debug: http://localhost:${PORT}/api/simple-debug`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down N8N API Server...');
  if (mongoClient) {
    await mongoClient.close();
    console.log('🔗 MongoDB connection closed');
  }
  process.exit(0);
});

startServer().catch(error => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});