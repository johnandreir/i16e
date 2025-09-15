@echo off
echo Starting DevOps Insight Engine Development Server...
echo.
echo Checking for processes on port 8082...
netstat -ano | findstr :8082 | findstr LISTENING >nul
if %errorlevel% == 0 (
    echo Port 8082 is in use. Attempting to kill processes...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8082 ^| findstr LISTENING') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    timeout /t 2 >nul
) else (
    echo Port 8082 is free.
)

echo.
echo Starting Vite development server on port 8082...
npx vite --port 8082

pause