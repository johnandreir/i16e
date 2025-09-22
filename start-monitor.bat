@echo off
REM Service Monitor Launcher for DevOps Insight Engine
REM This script starts the PowerShell service monitor

setlocal

echo ================================
echo DevOps Insight Engine Monitor
echo ================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is not available or not in PATH
    echo Please ensure PowerShell is installed and accessible
    pause
    exit /b 1
)

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running or not accessible
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo Starting service monitor...
echo.
echo Options:
echo   - Check interval: 30 seconds (default)
echo   - Max retries: 3 (default)
echo   - Log file: service-monitor.log
echo.
echo Press Ctrl+C to stop monitoring
echo.

REM Start PowerShell service monitor
powershell -ExecutionPolicy Bypass -File "%~dp0service-monitor.ps1"

if errorlevel 1 (
    echo.
    echo ERROR: Service monitor failed to start
    pause
    exit /b 1
)

echo.
echo Service monitor stopped
pause