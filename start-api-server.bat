@echo off
echo Starting MongoDB API Server...
echo This server is protected from accidental shutdowns.
echo Use Ctrl+C twice quickly to shutdown, or POST to /api/server/shutdown
echo.
node mongodb-api-server.cjs
pause