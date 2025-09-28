@echo off
echo ===================================
echo MongoDB Emergency Fix Script
echo ===================================

echo 1. Stopping MongoDB container...
docker stop i16e-mongodb

echo 2. Starting MongoDB container...
docker start i16e-mongodb

echo 3. Waiting for MongoDB to start (15 seconds)...
timeout /t 15 /nobreak > nul

echo 4. Applying emergency fixes...
docker exec i16e-mongodb mongosh -u admin -p N0virus1! --authenticationDatabase admin i16e-db /docker-entrypoint-initdb.d/emergency-fix.js

echo 5. Restarting API server...
docker restart i16e-api

echo 6. Waiting for API server to start (10 seconds)...
timeout /t 10 /nobreak > nul

echo 7. Testing API health...
curl http://localhost:3001/api/health

echo.
echo ===================================
echo MongoDB validation fix applied!
echo ===================================