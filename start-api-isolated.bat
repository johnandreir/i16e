@echo off
echo Starting MongoDB API Server in isolated process...
echo Server will be protected from accidental shutdowns
echo Use 'POST http://localhost:3001/api/server/shutdown' to stop gracefully
echo.

REM Start Node.js server with title for easy identification
start "MongoDB API Server" /D "%~dp0" cmd /k "node mongodb-api-server.cjs"

echo MongoDB API Server started in separate window
echo You can minimize the server window but don't close it
echo The server should be running on http://localhost:3001
pause