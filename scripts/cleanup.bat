@echo off
echo Docker Cleanup - Removing stopped containers and unused images...
echo.
echo WARNING: This will remove all stopped containers and unused Docker images!
set /p confirm=Are you sure? (y/N): 

if /i "%confirm%"=="y" (
    echo.
    echo Stopping all services...
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.dev.yml down
    
    echo.
    echo Cleaning up Docker system...
    docker system prune -f
    
    echo.
    echo Cleanup complete!
) else (
    echo Cleanup cancelled.
)
pause