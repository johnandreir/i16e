const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting Intelliperformance with MongoDB API...');

// Function to check if MongoDB API server is running
function checkMongoAPIHealth() {
  return new Promise((resolve) => {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
}

// Function to start MongoDB API server
function startMongoAPI() {
  return new Promise((resolve, reject) => {
    console.log('📡 Starting MongoDB API server...');
    
    const mongoApiProcess = spawn('node', ['mongodb-api-server.cjs'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    mongoApiProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📊 MongoDB API:', output.trim());
      
      if (output.includes('MongoDB API Server running on port')) {
        resolve(mongoApiProcess);
      }
    });

    mongoApiProcess.stderr.on('data', (data) => {
      console.error('❌ MongoDB API Error:', data.toString());
    });

    mongoApiProcess.on('error', (error) => {
      console.error('❌ Failed to start MongoDB API server:', error);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      reject(new Error('MongoDB API server startup timeout'));
    }, 30000);
  });
}

// Function to start the main application
function startMainApp() {
  console.log('🌐 Starting main application...');
  
  const mainProcess = spawn('npm', ['run', 'dev:full'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  mainProcess.on('error', (error) => {
    console.error('❌ Failed to start main application:', error);
  });

  return mainProcess;
}

// Main startup sequence
async function startApplication() {
  try {
    // Check if MongoDB API is already running
    const isRunning = await checkMongoAPIHealth();
    
    let mongoApiProcess = null;
    
    if (!isRunning) {
      console.log('🔄 MongoDB API server not detected, starting...');
      mongoApiProcess = await startMongoAPI();
      
      // Wait a bit for the server to fully initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify it's actually running
      const healthCheck = await checkMongoAPIHealth();
      if (!healthCheck) {
        throw new Error('MongoDB API server health check failed');
      }
      
      console.log('✅ MongoDB API server is healthy');
    } else {
      console.log('✅ MongoDB API server already running');
    }

    // Start the main application
    const mainProcess = startMainApp();

    // Handle shutdown gracefully
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      
      if (mongoApiProcess) {
        console.log('🔌 Stopping MongoDB API server...');
        mongoApiProcess.kill('SIGTERM');
      }
      
      if (mainProcess) {
        console.log('🔌 Stopping main application...');
        mainProcess.kill('SIGTERM');
      }
      
      process.exit(0);
    });

    console.log('🎉 Application stack started successfully!');
    console.log('📊 MongoDB API: http://localhost:3001/api/health');
    console.log('🌐 Main App: http://localhost:8082');
    
  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    process.exit(1);
  }
}

// Start the application
startApplication();