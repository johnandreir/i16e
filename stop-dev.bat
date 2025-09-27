@echo off
echo Stopping Development Backend Services...
docker-compose -f docker-compose.dev.yml down
echo.
echo Development backend services stopped!
echo.
echo Note: If you're running the frontend with 'npm run dev',
echo stop it manually with Ctrl+C in that terminal.
pause