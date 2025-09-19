@echo off
echo Starting MongoDB API Server...

REM Kill any existing Node.js processes on port 3001
echo Checking for existing processes on port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting MongoDB API server...
node mongodb-api-server.cjs