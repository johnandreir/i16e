@echo off
echo ===================================
echo MongoDB Connection Monitor
echo ===================================

echo Monitoring MongoDB connection health...
echo Press Ctrl+C to stop monitoring.
echo.

:loop
echo [%date% %time%] Checking MongoDB API server health...
curl -s http://localhost:3001/api/health
echo.

echo Checking MongoDB container status...
docker ps --filter "name=i16e-mongodb" --format "{{.Names}}: {{.Status}}"
echo.

timeout /t 15 /nobreak > nul
goto loop