# Start API Server in isolated process
Write-Host "Starting MongoDB API Server in isolated process..." -ForegroundColor Green
Write-Host "Server will be protected from accidental shutdowns" -ForegroundColor Yellow
Write-Host "Use 'POST http://localhost:3001/api/server/shutdown' to stop gracefully" -ForegroundColor Cyan
Write-Host ""

# Start in new CMD window with its own process group
$processInfo = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "node mongodb-api-server.cjs" -WorkingDirectory $PWD -WindowStyle Normal -PassThru

Write-Host "API Server started in separate CMD window (PID: $($processInfo.Id))" -ForegroundColor Green
Write-Host "The server window will remain open - you can minimize it but don't close it" -ForegroundColor Yellow
Write-Host "To stop the server, use the shutdown endpoint or close the CMD window" -ForegroundColor Cyan
Write-Host "Check http://localhost:3001/api/health for status" -ForegroundColor Cyan