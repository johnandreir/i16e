import { exec, spawn } from 'child_process';
import { join } from 'path';
import http from 'http';

console.log('🚀 Starting Development Environment...');

// Keep track of child processes for cleanup
let mongoAPIServer = null;
let viteServer = null;

// Graceful shutdown handler
function setupGracefulShutdown() {
  const cleanup = () => {
    console.log('\n🛑 Shutting down development environment...');
    
    if (mongoAPIServer) {
      console.log('⏹️ Stopping MongoDB API server...');
      mongoAPIServer.kill('SIGTERM');
    }
    
    if (viteServer) {
      console.log('⏹️ Stopping Vite development server...');
      viteServer.kill('SIGTERM');
    }
    
    // Force exit after 5 seconds
    setTimeout(() => {
      console.log('🔄 Force exiting...');
      process.exit(0);
    }, 5000);
  };

  // Handle different termination signals
  process.on('SIGINT', cleanup);  // Ctrl+C
  process.on('SIGTERM', cleanup); // Termination signal
  process.on('SIGHUP', cleanup);  // Hang up signal
  
  // Handle Windows-specific signals
  if (process.platform === 'win32') {
    process.on('SIGBREAK', cleanup);
  }
}

// Function to check if MongoDB API server is running
function checkMongoAPIHealth() {
  return new Promise((resolve) => {
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
    req.setTimeout(2000);
    req.end();
  });
}

// Function to wait for MongoDB API to be healthy
async function waitForMongoAPI(maxAttempts = 30) {
  console.log('🔄 Waiting for MongoDB API server to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    const isHealthy = await checkMongoAPIHealth();
    if (isHealthy) {
      console.log('✅ MongoDB API server is ready!');
      return true;
    }
    
    console.log(`⏳ Attempt ${i + 1}/${maxAttempts} - MongoDB API not ready yet...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('❌ MongoDB API server failed to start within timeout');
  return false;
}

// Health monitoring function
async function monitorAPIHealth() {
  if (!mongoAPIServer) return;
  
  const isHealthy = await checkMongoAPIHealth();
  if (!isHealthy && mongoAPIServer) {
    console.log('⚠️ MongoDB API server appears unhealthy, checking process...');
    
    // Check if the process is still running
    if (mongoAPIServer.killed || mongoAPIServer.exitCode !== null) {
      console.log('🔄 MongoDB API server process died, restarting...');
      try {
        await startMongoAPIServer();
        console.log('✅ MongoDB API server restarted successfully');
      } catch (error) {
        console.error('❌ Failed to restart MongoDB API server:', error);
      }
    }
  }
}

// Start health monitoring
function startHealthMonitoring() {
  console.log('🏥 Starting health monitoring...');
  
  // Check API health every 30 seconds
  setInterval(monitorAPIHealth, 30000);
  
  // Log status every 2 minutes
  setInterval(() => {
    const apiStatus = mongoAPIServer ? 'Running' : 'Stopped';
    const viteStatus = viteServer ? 'Running' : 'Stopped';
    console.log(`📊 Status: MongoDB API: ${apiStatus}, Vite: ${viteStatus}`);
  }, 120000);
}

// Function to start MongoDB API server
function startMongoAPIServer() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Starting MongoDB API server...');
    
    mongoAPIServer = spawn('node', ['mongodb-api-server.cjs'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    mongoAPIServer.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[MongoDB API] ${output.trim()}`);
      
      // Check if server has started successfully
      if (output.includes('MongoDB API server running on')) {
        console.log('✅ MongoDB API server started successfully');
        resolve(mongoAPIServer);
      }
    });

    mongoAPIServer.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`[MongoDB API Error] ${output.trim()}`);
    });

    mongoAPIServer.on('error', (error) => {
      console.error('❌ Failed to start MongoDB API server:', error);
      mongoAPIServer = null;
      reject(error);
    });

    mongoAPIServer.on('close', (code) => {
      console.log(`🔄 MongoDB API server process exited with code ${code}`);
      mongoAPIServer = null;
      
      // Auto-restart the API server if it crashes unexpectedly
      if (code !== 0 && code !== null) {
        console.log('🔄 MongoDB API server crashed, attempting restart in 3 seconds...');
        setTimeout(() => {
          startMongoAPIServer().catch(err => {
            console.error('❌ Failed to restart MongoDB API server:', err);
          });
        }, 3000);
      }
    });

    mongoAPIServer.on('exit', (code, signal) => {
      if (signal) {
        console.log(`🛑 MongoDB API server terminated by signal: ${signal}`);
      }
      mongoAPIServer = null;
    });

    // Timeout if server doesn't start within 15 seconds
    setTimeout(() => {
      console.log('⏰ MongoDB API server taking longer than expected, continuing...');
      resolve(mongoAPIServer);
    }, 15000);
  });
}

function startViteServer() {
  console.log('Checking for processes using port 8082...');

  // Kill any process using port 8082
  exec('netstat -ano | findstr :8082 | findstr LISTENING', (error, stdout, stderr) => {
    if (stdout) {
      const lines = stdout.trim().split('\n');
      const pids = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return parts[parts.length - 1];
      }).filter(pid => pid && pid !== '0');

      if (pids.length > 0) {
        console.log(`Killing processes: ${pids.join(', ')}`);
        pids.forEach(pid => {
          exec(`taskkill /f /pid ${pid}`, (err) => {
            if (err) {
              console.log(`Process ${pid} may have already been terminated`);
            }
          });
        });
        setTimeout(() => {
          console.log('Port 8082 is now free');
          startVite();
        }, 1000);
      } else {
        console.log('Port 8082 is already free');
        startVite();
      }
    } else {
      console.log('Port 8082 is already free');
      startVite();
    }
  });
}

function startVite() {
  console.log('Starting development server on port 8082...');
  
  // Check if we're running in PowerShell
  const isInPowerShell = process.env.PSModulePath !== undefined || 
                         process.env.POWERSHELL_DISTRIBUTION_CHANNEL !== undefined ||
                         process.env.PSEdition !== undefined;
  
  if (isInPowerShell) {
    console.log('PowerShell detected. Using cmd to run vite to avoid execution policy issues...');
  }
  
  // Always use cmd for Windows compatibility and to avoid PowerShell execution policy issues
  viteServer = spawn('cmd', ['/c', 'npx', 'vite', '--port', '8082'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  viteServer.on('error', (error) => {
    console.error('Failed to start via cmd npx vite:', error.message);
    viteServer = null;
    tryDirectViteApproach();
  });

  viteServer.on('close', (code) => {
    console.log(`🔄 Vite process exited with code ${code}`);
    viteServer = null;
  });

  viteServer.on('exit', (code, signal) => {
    if (signal) {
      console.log(`🛑 Vite server terminated by signal: ${signal}`);
    }
    viteServer = null;
  });
}

function tryDirectViteApproach() {
  console.log('Trying direct vite approach...');
  
  // Use path.join for cross-platform compatibility
  const vitePath = join(process.cwd(), 'node_modules', '.bin', 'vite.cmd');
  
  // For Windows, use cmd to execute the batch file
  viteServer = spawn('cmd', ['/c', vitePath, '--port', '8082'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  viteServer.on('error', (error) => {
    console.error('Failed to start vite via cmd:', error.message);
    console.log('\nTrying Node.js direct approach...');
    viteServer = null;
    
    // Fallback: try using node directly with vite's main file
    const viteMainPath = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
    viteServer = spawn('node', [viteMainPath, '--port', '8082'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    viteServer.on('error', (fallbackError) => {
      console.error('Node.js direct approach also failed:', fallbackError.message);
      viteServer = null;
      showManualInstructions();
    });
    
    viteServer.on('close', (code) => {
      console.log(`🔄 Fallback Vite process exited with code ${code}`);
      viteServer = null;
    });

    viteServer.on('exit', (code, signal) => {
      if (signal) {
        console.log(`🛑 Fallback Vite server terminated by signal: ${signal}`);
      }
      viteServer = null;
    });
  });

  viteServer.on('close', (code) => {
    console.log(`🔄 Direct Vite process exited with code ${code}`);
    viteServer = null;
  });

  viteServer.on('exit', (code, signal) => {
    if (signal) {
      console.log(`🛑 Direct Vite server terminated by signal: ${signal}`);
    }
    viteServer = null;
  });
}

function showManualInstructions() {
  console.log('\n--- MANUAL STARTUP INSTRUCTIONS ---');
  console.log('The automatic startup failed. Please start the server manually:');
  console.log('');
  console.log('Option 1 - Using Command Prompt (RECOMMENDED):');
  console.log('1. Open Command Prompt (cmd)');
  console.log('2. Navigate to:', process.cwd());
  console.log('3. Run: npx vite --port 8082');
  console.log('');
  console.log('Option 2 - Using PowerShell (if execution policy allows):');
  console.log('1. Open PowerShell as Administrator');
  console.log('2. Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser');
  console.log('3. Navigate to:', process.cwd());
  console.log('4. Run: npx vite --port 8082');
  console.log('');
  console.log('Option 3 - Direct vite command:');
  console.log('1. Open Command Prompt (cmd)');
  console.log('2. Navigate to:', process.cwd());
  console.log('3. Run: node_modules\\.bin\\vite.cmd --port 8082');
}

// Enhanced startup with better error handling and process management
async function startDevelopment() {
  // Setup graceful shutdown first
  setupGracefulShutdown();
  
  console.log('🔧 Setting up development environment...');
  
  // Check if MongoDB API is already running
  const isMongoAPIRunning = await checkMongoAPIHealth();
  
  if (!isMongoAPIRunning) {
    console.log('⚠️ MongoDB API server not detected. Starting it now...');
    
    try {
      await startMongoAPIServer();
      
      // Wait for the server to be healthy
      const apiReady = await waitForMongoAPI(30); // Increased timeout
      if (!apiReady) {
        console.log('❌ MongoDB API server started but not responding to health checks.');
        console.log('⚠️ Continuing with frontend startup - API may need more time to initialize...');
      }
    } catch (error) {
      console.log('❌ Failed to start MongoDB API server:', error.message);
      console.log('⚠️ Continuing with frontend startup - you may need to start the API manually...');
    }
  } else {
    console.log('✅ MongoDB API server already running');
  }

  // Now start the Vite dev server
  console.log('🌐 Starting Vite development server...');
  startViteServer();
  
  // Start health monitoring after everything is up
  setTimeout(startHealthMonitoring, 5000);
  
  // Keep the process alive and handle any additional monitoring
  console.log('✅ Development environment started successfully');
  console.log('📝 Press Ctrl+C to stop all services');
  console.log('🏥 Health monitoring active - servers will auto-restart if they crash');
}

// Start the development environment
startDevelopment().catch(error => {
  console.error('💥 Failed to start development environment:', error);
  process.exit(1);
});