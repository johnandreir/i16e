@echo off
echo Starting Complete Development Environment...
echo.

echo 1. Starting Backend Services (Docker)...
start /min docker-compose -f docker-compose.prod.yml up -d

echo 2. Waiting for backend services to start...
timeout /t 10 /nobreak >nul

echo 3. Installing/updating frontend dependencies...
call npm install

echo 4. Starting Frontend Development Server...
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