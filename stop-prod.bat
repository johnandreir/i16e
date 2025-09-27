@echo off
echo Stopping Backend Services...
docker-compose -f docker-compose.prod.yml down
echo.
echo Backend services stopped!
echo.
echo Note: If you're running the frontend with 'npm run dev', 
echo stop it manually with Ctrl+C in that terminal.
pause