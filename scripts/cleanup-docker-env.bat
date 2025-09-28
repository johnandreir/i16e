@echo off
echo DevOps Insight Engine - Docker Environment Cleanup
echo ===============================================
echo.
echo This script will clean up old Docker environments and files
echo to transition to the new unified environment.
echo.
echo WARNING: This will remove all Docker containers and volumes
echo for the DevOps Insight Engine!
echo.
set /p confirm=Are you sure you want to proceed? (Y/N): 

if /i "%confirm%" NEQ "Y" goto end

echo.
echo 1. Stopping and removing existing containers...
docker-compose -f docker-compose.yml down -v
docker-compose -f docker-compose.prod.yml down -v
if exist docker-compose.dev.yml docker-compose -f docker-compose.dev.yml down -v

echo.
echo 2. Removing obsolete files...
if exist docker-compose.prod.yml del /f docker-compose.prod.yml
if exist docker-compose.dev.yml del /f docker-compose.dev.yml
if exist start-dev.bat del /f start-dev.bat
if exist start-prod.bat del /f start-prod.bat
if exist start-full-dev.bat del /f start-full-dev.bat
if exist stop-dev.bat del /f stop-dev.bat
if exist stop-prod.bat del /f stop-prod.bat
if exist run-emergency-fix.bat del /f run-emergency-fix.bat
if exist fix-mongodb.bat del /f fix-mongodb.bat

echo.
echo Environment cleanup complete!
echo Use the new start.bat and stop.bat scripts to manage your services.
echo See DOCKER_CHANGES.md for details about the changes.
echo.
pause

:end