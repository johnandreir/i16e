@echo off
echo ===================================
echo API Server Status Update Script
echo ===================================

echo 1. Rebuilding API container...
docker-compose up -d --build mongodb-api

echo 2. Waiting for container restart...

echo 3. Waiting for API server to start (10 seconds)...
timeout /t 10 /nobreak > nul

echo 4. Testing API health with improved uptime display...
curl http://localhost:3001/api/health

echo.
echo 5. Testing N8N workflows status...
curl http://localhost:3001/api/n8n/health

echo.
echo ===================================
echo Status updates applied!
echo ===================================
echo.
echo Now you should see:
echo 1. Enhanced uptime information in the MongoDB API status
echo 2. More accurate N8N workflow counts from workflow files
echo ===================================