@echo off
echo Starting Backend Services (MongoDB + N8N + API)...
docker-compose -f docker-compose.prod.yml up -d
echo.
echo Backend services started!
echo.
echo Backend services running:
echo - API: http://localhost:3001
echo - N8N: http://localhost:5678
echo - MongoDB: localhost:27017
echo.
echo To start the frontend locally, run in a separate terminal:
echo   npm run dev
echo.
echo The frontend will be available at: http://localhost:8082
echo.
echo To stop backend: run stop-prod.bat
pause