@echo off
echo Viewing Docker Services Logs...
echo.
echo Choose which logs to view:
echo 1) All services
echo 2) API only
echo 3) Frontend only
echo 4) MongoDB only
echo 5) N8N only
echo.
set /p choice=Enter your choice (1-5): 

if "%choice%"=="1" (
    docker-compose -f docker-compose.prod.yml logs -f
) else if "%choice%"=="2" (
    docker logs -f i16e-api
) else if "%choice%"=="3" (
    docker logs -f i16e-frontend
) else if "%choice%"=="4" (
    docker logs -f i16e-mongodb
) else if "%choice%"=="5" (
    docker logs -f i16e-n8n
) else (
    echo Invalid choice. Showing all logs...
    docker-compose -f docker-compose.prod.yml logs -f
)