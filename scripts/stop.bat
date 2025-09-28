@echo off
echo Stopping All Services...
cd %~dp0\..
docker-compose down
echo.
echo All services stopped!
echo.
echo Note: If you're running the frontend with 'npm run dev', 
echo stop it manually with Ctrl+C in that terminal.
pause