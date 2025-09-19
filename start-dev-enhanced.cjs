const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(' Starting DevOps Insight Engine with enhanced features...');

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
  console.log(' Installing dependencies...');
  const install = spawn('npm', ['install'], { 
    stdio: 'inherit', 
    shell: true 
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      startDevServer();
    } else {
      console.error(' Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startDevServer();
}

function startDevServer() {
  console.log(' Starting development server...');
  console.log(' Features enabled:');
  console.log('   Webhook Service Integration');
  console.log('   Backend Status Monitoring');
  console.log('   Self-Healing System');
  console.log('   Health Check Services');
  console.log('');
  
  const dev = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit', 
    shell: true 
  });

  dev.on('close', (code) => {
    console.log(`Development server exited with code ${code}`);
  });

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('\n Shutting down...');
    dev.kill();
    process.exit(0);
  });
}
