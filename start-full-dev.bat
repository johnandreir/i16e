@echo off
echo Starting Complete Development Environment...
echo.

echo 1. Starting Backend Services (Docker)...
start /min docker-compose -f docker-compose.prod.yml up -d

echo 2. Waiting for backend services to start...
timeout /t 30 /nobreak >nul

echo 3. Running MongoDB validation schema update...
docker exec i16e-mongodb mongosh -u admin -p N0virus1! --authenticationDatabase admin i16e-db /docker-entrypoint-initdb.d/update-validation.js

echo 4. Installing/updating frontend dependencies...
call npm install

echo 5. Starting Frontend Development Server...
echo.
echo Backend Services:
echo - API: http://localhost:3001
echo - N8N: http://localhost:5678
echo - MongoDB: localhost:27017
echo.
echo Frontend will start on: http://localhost:8082
echo.
echo Press Ctrl+C to stop the frontend
echo To stop backend services, run: stop-prod.bat
echo.

npm run dev