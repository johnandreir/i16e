@echo off
echo DevOps Insight Engine - Unified Startup Script
echo =============================================
echo.

echo 1. Starting Backend Services (MongoDB + N8N + API)...
cd %~dp0\..
docker-compose up -d
echo.
echo Backend services started!
echo.
echo 2. Waiting for MongoDB to initialize (30 seconds)...
timeout /T 30 /NOBREAK > nul

echo 3. Applying MongoDB validation schema (ensures proper field naming)...
docker exec i16e-mongodb mongosh -u admin -p N0virus1! --authenticationDatabase admin i16e-db /docker-entrypoint-initdb.d/update-validation.js

echo.
echo Backend services running:
echo - API: http://localhost:3001
echo - N8N: http://localhost:5678
echo - MongoDB: localhost:27017
echo.
echo To start the frontend locally, run in a separate terminal:
echo   npm run dev
echo.