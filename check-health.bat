@echo off
echo Checking Backend Services Health...
echo.
echo ================================
echo CONTAINER STATUS:
echo ================================
docker ps
echo.
echo ================================
echo HEALTH CHECKS:
echo ================================
echo Checking MongoDB API...
curl -f http://localhost:3001/api/health 2>nul && echo API: HEALTHY || echo API: UNHEALTHY
echo.
echo Checking N8N...
curl -f http://localhost:5678/healthz 2>nul && echo N8N: HEALTHY || echo N8N: UNHEALTHY
echo.
echo ================================
echo FRONTEND STATUS:
echo ================================
echo Frontend should be running locally with: npm run dev
echo Check http://localhost:8082 manually
echo.
pause