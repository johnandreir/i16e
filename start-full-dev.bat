@echo off
echo DevOps Insight Engine - Full echo To stop backend services, run: stop.bat
echo.

npm run dev -- --port 8082lopment Environment
echo ===============================================
echo.

echo 1. Starting Backend Services (Docker)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker containers.
    echo Make sure Docker is running and try again.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Waiting for backend services to initialize (30 seconds)...
timeout /t 30 /nobreak >nul
echo.

echo 3. Running MongoDB validation schema update...
docker exec i16e-mongodb mongosh -u admin -p N0virus1! --authenticationDatabase admin i16e-db /docker-entrypoint-initdb.d/update-validation.js
if %errorlevel% neq 0 (
    echo [WARNING] Validation schema update might not have completed successfully.
    echo The application will continue to start, but data validation might be incomplete.
    echo.
)

echo.
echo 4. Installing/updating frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [WARNING] Some dependencies may not have installed correctly.
)

echo.
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
echo To stop all backend services, run: stop.bat
echo.

npm run dev