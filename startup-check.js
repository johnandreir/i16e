#!/usr/bin/env node
/**
 * Comprehensive startup script for DevOps Insight Engine
 * Checks all prerequisites before starting the server
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkPrerequisite(name, checkFn, fixFn = null) {
  try {
    log(`\n🔍 Checking ${name}...`, 'cyan');
    const result = await checkFn();
    if (result.success) {
      log(`✅ ${name}: ${result.message}`, 'green');
      return true;
    } else {
      log(`❌ ${name}: ${result.message}`, 'red');
      if (fixFn) {
        log(`🔧 Attempting to fix ${name}...`, 'yellow');
        await fixFn();
        return await checkPrerequisite(name, checkFn);
      }
      return false;
    }
  } catch (error) {
    log(`❌ ${name}: ${error.message}`, 'red');
    return false;
  }
}

// Prerequisite check functions
const checks = {
  async nodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    return {
      success: majorVersion >= 18,
      message: majorVersion >= 18 
        ? `Node.js ${version} (✓ >= 18.0.0)` 
        : `Node.js ${version} (requires >= 18.0.0)`
    };
  },

  async envFile() {
    try {
      await fs.access('.env');
      const envContent = await fs.readFile('.env', 'utf-8');
      const requiredVars = [
        'MONGODB_URI',
        'VITE_API_URL', 
        'VITE_N8N_BASE_URL',
        'VITE_N8N_WORKFLOW_ID'
      ];
      
      const missingVars = requiredVars.filter(varName => 
        !envContent.includes(`${varName}=`)
      );
      
      return {
        success: missingVars.length === 0,
        message: missingVars.length === 0 
          ? 'All required environment variables present'
          : `Missing variables: ${missingVars.join(', ')}`
      };
    } catch (error) {
      return {
        success: false,
        message: '.env file not found'
      };
    }
  },

  async nodeModules() {
    try {
      await fs.access('node_modules');
      await fs.access('package.json');
      return {
        success: true,
        message: 'Dependencies installed'
      };
    } catch (error) {
      return {
        success: false,
        message: 'node_modules not found - run npm install'
      };
    }
  },

  async dockerContainers() {
    try {
      const { stdout } = await execAsync('docker ps --format "{{.Names}}" --filter "status=running"');
      const runningContainers = stdout.trim().split('\n').filter(name => name);
      
      const requiredContainers = ['mongodb', 'n8n'];
      const missingContainers = requiredContainers.filter(
        container => !runningContainers.includes(container)
      );
      
      return {
        success: missingContainers.length === 0,
        message: missingContainers.length === 0
          ? `All containers running: ${requiredContainers.join(', ')}`
          : `Missing containers: ${missingContainers.join(', ')}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Docker not available or containers not running'
      };
    }
  },

  async portAvailability() {
    try {
      const { stdout } = await execAsync('netstat -ano | findstr ":3001"');
      if (stdout.includes('LISTENING')) {
        return {
          success: false,
          message: 'Port 3001 is already in use'
        };
      }
      return {
        success: true,
        message: 'Port 3001 is available'
      };
    } catch (error) {
      // If netstat fails or port not found, consider it available
      return {
        success: true,
        message: 'Port 3001 is available'
      };
    }
  },

  async mongodbConnection() {
    try {
      // Simple connection test without importing mongoose
      const { stdout } = await execAsync('docker exec mongodb mongosh --eval "db.runCommand({ping: 1})" --quiet');
      return {
        success: stdout.includes('"ok" : 1'),
        message: stdout.includes('"ok" : 1') 
          ? 'MongoDB container is responsive'
          : 'MongoDB container not responding'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Cannot connect to MongoDB container'
      };
    }
  },

  async n8nConnection() {
    try {
      // Test n8n container health
      const { stdout } = await execAsync('docker exec n8n wget -q --spider http://localhost:5678/healthz && echo "healthy" || echo "unhealthy"');
      return {
        success: stdout.trim() === 'healthy',
        message: stdout.trim() === 'healthy' 
          ? 'N8n container is healthy'
          : 'N8n container not responding'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Cannot check n8n container health'
      };
    }
  }
};

// Fix functions
const fixes = {
  async installDependencies() {
    log('📦 Installing dependencies...', 'yellow');
    await execAsync('npm install');
    log('✅ Dependencies installed', 'green');
  },

  async killPort3001() {
    try {
      const { stdout } = await execAsync('netstat -ano | findstr ":3001.*LISTENING"');
      if (stdout) {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            await execAsync(`taskkill /f /pid ${pid}`);
            log(`🔄 Killed process ${pid} using port 3001`, 'yellow');
          }
        }
      }
    } catch (error) {
      log(`⚠️  Could not kill processes on port 3001: ${error.message}`, 'yellow');
    }
  }
};

async function runPrerequisiteChecks() {
  log('🚀 DevOps Insight Engine - Prerequisite Checker', 'bright');
  log('================================================', 'cyan');

  const checks_to_run = [
    ['Node.js Version', checks.nodeVersion],
    ['Environment File', checks.envFile],
    ['Dependencies', checks.nodeModules, fixes.installDependencies],
    ['Docker Containers', checks.dockerContainers],
    ['Port Availability', checks.portAvailability, fixes.killPort3001],
    ['MongoDB Connection', checks.mongodbConnection],
    ['N8n Connection', checks.n8nConnection]
  ];

  const results = [];
  for (const [name, checkFn, fixFn] of checks_to_run) {
    const success = await checkPrerequisite(name, checkFn, fixFn);
    results.push({ name, success });
  }

  log('\n📊 Prerequisites Summary:', 'bright');
  log('========================', 'cyan');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${icon} ${result.name}`, color);
  });

  log(`\n📈 Score: ${passed}/${total} checks passed`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n🎉 All prerequisites met! Starting server...', 'green');
    return true;
  } else {
    log('\n⚠️  Some prerequisites failed. Please fix the issues above.', 'yellow');
    return false;
  }
}

// Main execution
async function main() {
  const prerequisitesPassed = await runPrerequisiteChecks();
  
  if (!prerequisitesPassed) {
    log('\n❌ Prerequisites check failed. Exiting...', 'red');
    process.exit(1);
  }

  // Start the server
  log('\n🚀 Starting DevOps Insight Engine server...', 'green');
  
  try {
    const { spawn } = await import('child_process');
    const server = spawn('node', ['server.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });

    server.on('error', (error) => {
      log(`❌ Server error: ${error.message}`, 'red');
      process.exit(1);
    });

    server.on('exit', (code) => {
      if (code !== 0) {
        log(`❌ Server exited with code ${code}`, 'red');
        process.exit(code);
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('\n🛑 Gracefully shutting down...', 'yellow');
      server.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      log('\n🛑 Received SIGTERM, shutting down...', 'yellow');
      server.kill('SIGTERM');
    });

  } catch (error) {
    log(`❌ Failed to start server: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`❌ Startup script error: ${error.message}`, 'red');
    process.exit(1);
  });
}

export default { runPrerequisiteChecks };