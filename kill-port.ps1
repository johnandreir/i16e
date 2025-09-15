# Kill any process using port 8082
$port = 8082
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($processes) {
    foreach ($process in $processes) {
        $pid = $process.OwningProcess
        Write-Host "Killing process $pid using port $port"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Port $port is now free"
} else {
    Write-Host "Port $port is already free"
}
