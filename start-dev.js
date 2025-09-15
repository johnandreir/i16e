import { exec, spawn } from 'child_process';
import { join } from 'path';

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
  const vite = spawn('cmd', ['/c', 'npx', 'vite', '--port', '8082'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  vite.on('error', (error) => {
    console.error('Failed to start via cmd npx vite:', error.message);
    tryDirectViteApproach();
  });

  vite.on('close', (code) => {
    console.log(`Vite process exited with code ${code}`);
  });
}

function tryDirectViteApproach() {
  console.log('Trying direct vite approach...');
  
  // Use path.join for cross-platform compatibility
  const vitePath = join(process.cwd(), 'node_modules', '.bin', 'vite.cmd');
  
  // For Windows, use cmd to execute the batch file
  const vite = spawn('cmd', ['/c', vitePath, '--port', '8082'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  vite.on('error', (error) => {
    console.error('Failed to start vite via cmd:', error.message);
    console.log('\nTrying Node.js direct approach...');
    
    // Fallback: try using node directly with vite's main file
    const viteMainPath = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
    const fallbackVite = spawn('node', [viteMainPath, '--port', '8082'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    fallbackVite.on('error', (fallbackError) => {
      console.error('Node.js direct approach also failed:', fallbackError.message);
      showManualInstructions();
    });
    
    fallbackVite.on('close', (code) => {
      console.log(`Fallback process exited with code ${code}`);
    });
  });

  vite.on('close', (code) => {
    console.log(`Vite process exited with code ${code}`);
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
