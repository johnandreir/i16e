const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`🌐 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Register routes and log them
console.log('🔗 Registering routes...');

// Basic health check
app.get('/api/health', (req, res) => {
  console.log('🏥 Basic health check called');
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    server: 'running',
    message: 'API server is running'
  });
});
console.log('✅ Registered: GET /api/health');

// Simple debug endpoint
app.get('/api/simple-debug', (req, res) => {
  console.log('🔍 Simple debug endpoint called');
  res.json({ 
    message: 'Simple debug endpoint works', 
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});
console.log('✅ Registered: GET /api/simple-debug');

// N8N Health Check - simplified version
app.get('/api/n8n/health', async (req, res) => {
  console.log('🎯 N8N Health endpoint called!');
  
  try {
    // Basic N8N connection test
    let n8nReachable = false;
    let workflowCount = 0;
    
    try {
      const response = await fetch('http://localhost:5678/rest/workflows', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        n8nReachable = true;
        workflowCount = data.data ? data.data.length : 0;
      }
    } catch (error) {
      console.log('⚠️ N8N connection failed:', error.message);
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      n8nHealth: {
        reachable: n8nReachable,
        workflowCount: workflowCount,
        message: n8nReachable ? 
          `N8N is running with ${workflowCount} workflows` : 
          'N8N service not accessible'
      }
    };

    console.log('📊 N8N Health result:', result);
    res.json(result);

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
console.log('✅ Registered: GET /api/n8n/health');

// List all routes endpoint
app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    }
  });
  res.json({ routes });
});
console.log('✅ Registered: GET /api/routes');

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

// Error handling
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Simple N8N API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 N8N health: http://localhost:${PORT}/api/n8n/health`);
  console.log(`🔧 Debug: http://localhost:${PORT}/api/simple-debug`);
  console.log(`📋 Routes list: http://localhost:${PORT}/api/routes`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down Simple N8N API Server...');
  process.exit(0);
});