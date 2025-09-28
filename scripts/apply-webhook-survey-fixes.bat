@echo off
echo ===================================================
echo DevOps Insight Engine: Webhook and Survey Chart Fix
echo ===================================================
echo.

echo Step 1: Fix webhook health check (prevent empty triggers)
node fix-webhook-health-check.cjs
if %errorlevel% neq 0 (
  echo Error fixing webhook health check!
  exit /b %errorlevel%
)
echo.

echo Step 2: Fix survey chart fallback data
node fix-survey-chart-fallback.cjs
if %errorlevel% neq 0 (
  echo Error fixing survey chart fallback data!
  exit /b %errorlevel%
)
echo.

echo ===================================================
echo All fixes applied successfully!
echo ===================================================
echo.
echo Next steps:
echo 1. Restart the MongoDB API server to apply the webhook fix
echo 2. Refresh the frontend to apply the survey chart fix
echo.
echo Run these commands:
echo - stop-dev.bat
echo - start-dev.bat
echo.