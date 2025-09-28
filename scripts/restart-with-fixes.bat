@echo off
echo ===================================
echo MongoDB Connection Stability Fix
echo ===================================

echo 1. Stopping containers...
docker-compose down

echo 2. Applying emergency fixes...
echo This will improve MongoDB connection stability

echo 3. Restarting with improved settings...
docker-compose up -d

echo 4. Waiting for services to start (30 seconds)...
timeout /t 30 /nobreak > nul

echo 5. Running MongoDB emergency fixes...
docker exec i16e-mongodb mongosh -u admin -p N0virus1! --authenticationDatabase admin i16e-db /docker-entrypoint-initdb.d/emergency-fix.js

echo 6. Checking API server health...
curl http://localhost:3001/api/health

echo.
echo ===================================
echo Fix applied successfully!
echo ===================================
echo If you continue to see MongoDB connection issues, please check:
echo  1. MongoDB logs: docker logs i16e-mongodb
echo  2. API server logs: docker logs i16e-api
echo  3. Network connectivity: docker network inspect i16e-network
echo ===================================