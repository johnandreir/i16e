@echo off
echo Starting Clean N8N API Server...

REM Kill any existing Node processes
taskkill /F /IM node.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start the new clean server
echo Starting new N8N API server on port 3001...
node n8n-api-server.cjs

pause