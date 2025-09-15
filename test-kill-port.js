import { exec } from 'child_process';

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
        console.log('✅ Port cleanup completed successfully');
      }, 1000);
    } else {
      console.log('Port 8082 is already free');
      console.log('✅ Port cleanup completed successfully');
    }
  } else {
    console.log('Port 8082 is already free');
    console.log('✅ Port cleanup completed successfully');
  }
});
