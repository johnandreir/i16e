@echo off
echo Checking for processes using port 8082...
set "found=0"
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8082 ^| findstr LISTENING 2^>nul') do (
    if not "%%a"=="" (
        echo Killing process %%a using port 8082
        taskkill /f /pid %%a >nul 2>&1
        set "found=1"
    )
)
if "%found%"=="0" (
    echo Port 8082 is already free
) else (
    echo Port 8082 is now free
)
exit /b 0
