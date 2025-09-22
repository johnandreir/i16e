#!/usr/bin/env pwsh
# Service Monitor and Auto-Healing Script for DevOps Insight Engine
# This script monitors critical services and automatically restarts them when they fail

param(
    [int]$CheckInterval = 30,  # Check interval in seconds
    [int]$MaxRetries = 3,      # Maximum restart attempts before giving up
    [string]$LogFile = "service-monitor.log"
)

# Configuration
$Script:Services = @{
    "MongoDB" = @{
        Name = "MongoDB"
        CheckUrl = "http://localhost:27017"
        CheckCommand = { docker ps --filter "name=i16e-mongodb" --filter "status=running" --quiet }
        RestartCommand = { docker restart i16e-mongodb }
        Dependencies = @()
        RetryCount = 0
        LastFailure = $null
        HealthStatus = "Unknown"
        IsRequired = $true
    }
    "API-Server" = @{
        Name = "API Server"
        CheckUrl = "http://localhost:3001/api/health"
        CheckCommand = { docker ps --filter "name=i16e-api" --filter "status=running" --quiet }
        RestartCommand = { docker restart i16e-api }
        Dependencies = @("MongoDB")
        RetryCount = 0
        LastFailure = $null
        HealthStatus = "Unknown"
        IsRequired = $true
    }
    "n8n" = @{
        Name = "n8n Workflow Engine"
        CheckUrl = "http://localhost:5678/healthz"
        CheckCommand = { docker ps --filter "name=i16e-n8n" --filter "status=running" --quiet }
        RestartCommand = { docker restart i16e-n8n }
        Dependencies = @("MongoDB")
        RetryCount = 0
        LastFailure = $null
        HealthStatus = "Unknown"
        IsRequired = $false
    }
}

# Logging function
function Write-ServiceLog {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

# Check service health via HTTP endpoint
function Test-ServiceHealth {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 10
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSeconds -UseBasicParsing
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# Check if Docker container is running
function Test-ContainerRunning {
    param(
        [scriptblock]$CheckCommand
    )
    
    try {
        $result = & $CheckCommand
        return -not [string]::IsNullOrEmpty($result)
    }
    catch {
        return $false
    }
}

# Check individual service
function Test-Service {
    param(
        [string]$ServiceName
    )
    
    $service = $Script:Services[$ServiceName]
    $isHealthy = $false
    
    # Check container status first
    $containerRunning = Test-ContainerRunning -CheckCommand $service.CheckCommand
    
    if (-not $containerRunning) {
        Write-ServiceLog "Container for $($service.Name) is not running" "ERROR"
        $service.HealthStatus = "Container Down"
        return $false
    }
    
    # Check HTTP health endpoint if available
    if ($service.CheckUrl) {
        $httpHealthy = Test-ServiceHealth -Url $service.CheckUrl
        if ($httpHealthy) {
            $isHealthy = $true
            $service.HealthStatus = "Healthy"
        }
        else {
            Write-ServiceLog "$($service.Name) container running but health check failed at $($service.CheckUrl)" "WARN"
            $service.HealthStatus = "Unhealthy"
        }
    }
    else {
        # If no HTTP check, assume healthy if container is running
        $isHealthy = $true
        $service.HealthStatus = "Running"
    }
    
    return $isHealthy
}

# Restart service with dependency handling
function Restart-Service {
    param(
        [string]$ServiceName
    )
    
    $service = $Script:Services[$ServiceName]
    
    Write-ServiceLog "Attempting to restart $($service.Name) (attempt $($service.RetryCount + 1)/$MaxRetries)" "WARN"
    
    try {
        # Stop dependent services first
        $dependentServices = $Script:Services.Keys | Where-Object { 
            $Script:Services[$_].Dependencies -contains $ServiceName 
        }
        
        foreach ($depService in $dependentServices) {
            Write-ServiceLog "Stopping dependent service: $($Script:Services[$depService].Name)" "INFO"
            & $Script:Services[$depService].RestartCommand
            Start-Sleep -Seconds 5
        }
        
        # Restart the failed service
        & $service.RestartCommand
        Start-Sleep -Seconds 10
        
        # Restart dependent services
        foreach ($depService in $dependentServices) {
            Write-ServiceLog "Restarting dependent service: $($Script:Services[$depService].Name)" "INFO"
            & $Script:Services[$depService].RestartCommand
            Start-Sleep -Seconds 5
        }
        
        $service.RetryCount++
        Write-ServiceLog "Successfully restarted $($service.Name)" "INFO"
        
        # Wait for service to stabilize
        Start-Sleep -Seconds 15
        
        # Verify restart was successful
        if (Test-Service -ServiceName $ServiceName) {
            Write-ServiceLog "$($service.Name) restart verified successful" "INFO"
            $service.RetryCount = 0
            $service.LastFailure = $null
            return $true
        }
        else {
            Write-ServiceLog "$($service.Name) restart failed verification" "ERROR"
            return $false
        }
    }
    catch {
        Write-ServiceLog "Failed to restart $($service.Name): $($_.Exception.Message)" "ERROR"
        $service.RetryCount++
        return $false
    }
}

# Main monitoring loop
function Start-ServiceMonitoring {
    Write-ServiceLog "Starting service monitoring (check interval: ${CheckInterval}s, max retries: $MaxRetries)" "INFO"
    Write-ServiceLog "Monitoring services: $($Script:Services.Keys -join ', ')" "INFO"
    
    while ($true) {
        try {
            $allHealthy = $true
            $healthReport = @()
            
            foreach ($serviceName in $Script:Services.Keys) {
                $service = $Script:Services[$serviceName]
                $isHealthy = Test-Service -ServiceName $serviceName
                
                $healthReport += "$($service.Name): $($service.HealthStatus)"
                
                if (-not $isHealthy) {
                    $allHealthy = $false
                    $service.LastFailure = Get-Date
                    
                    if ($service.IsRequired -and $service.RetryCount -lt $MaxRetries) {
                        Write-ServiceLog "$($service.Name) is unhealthy, attempting restart" "WARN"
                        $restartSuccess = Restart-Service -ServiceName $serviceName
                        
                        if (-not $restartSuccess) {
                            Write-ServiceLog "$($service.Name) restart failed, retry count: $($service.RetryCount)/$MaxRetries" "ERROR"
                        }
                    }
                    elseif ($service.RetryCount -ge $MaxRetries) {
                        Write-ServiceLog "$($service.Name) has exceeded maximum retry attempts, manual intervention required" "ERROR"
                    }
                    elseif (-not $service.IsRequired) {
                        Write-ServiceLog "$($service.Name) is unhealthy but not required for core functionality" "WARN"
                    }
                }
                else {
                    # Reset retry count on successful health check
                    if ($service.RetryCount -gt 0) {
                        Write-ServiceLog "$($service.Name) has recovered" "INFO"
                        $service.RetryCount = 0
                        $service.LastFailure = $null
                    }
                }
            }
            
            # Log status summary every 10 checks
            if ((Get-Date).Minute % 10 -eq 0 -and (Get-Date).Second -lt $CheckInterval) {
                Write-ServiceLog "Health Status: $($healthReport -join ' | ')" "INFO"
            }
            
            # Overall system health check
            $requiredServices = $Script:Services.Values | Where-Object { $_.IsRequired }
            $criticalFailures = $requiredServices | Where-Object { $_.RetryCount -ge $MaxRetries }
            
            if ($criticalFailures.Count -gt 0) {
                Write-ServiceLog "CRITICAL: System has $($criticalFailures.Count) failed required services. Manual intervention required!" "ERROR"
                
                # Could send alerts here (email, Slack, etc.)
                # Send-Alert -Message "DevOps Insight Engine has critical service failures"
            }
        }
        catch {
            Write-ServiceLog "Error in monitoring loop: $($_.Exception.Message)" "ERROR"
        }
        
        Start-Sleep -Seconds $CheckInterval
    }
}

# Signal handlers
function Stop-ServiceMonitoring {
    Write-ServiceLog "Received stop signal, shutting down service monitor" "INFO"
    exit 0
}

# Register signal handlers
Register-EngineEvent -SourceIdentifier "PowerShell.Exiting" -Action { Stop-ServiceMonitoring }

# Status report function
function Get-ServiceStatus {
    Write-Host "`n=== DevOps Insight Engine Service Status ===" -ForegroundColor Cyan
    
    foreach ($serviceName in $Script:Services.Keys) {
        $service = $Script:Services[$serviceName]
        $statusColor = switch ($service.HealthStatus) {
            "Healthy" { "Green" }
            "Running" { "Green" }
            "Unhealthy" { "Yellow" }
            "Container Down" { "Red" }
            default { "Gray" }
        }
        
        Write-Host "$($service.Name): " -NoNewline
        Write-Host $service.HealthStatus -ForegroundColor $statusColor
        
        if ($service.RetryCount -gt 0) {
            Write-Host "  Retry Count: $($service.RetryCount)/$MaxRetries" -ForegroundColor Yellow
        }
        
        if ($service.LastFailure) {
            Write-Host "  Last Failure: $($service.LastFailure)" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Help function
function Show-Help {
    Write-Host @"
DevOps Insight Engine Service Monitor

Usage: ./service-monitor.ps1 [options]

Options:
  -CheckInterval <seconds>   : Health check interval (default: 30)
  -MaxRetries <number>      : Maximum restart attempts (default: 3)
  -LogFile <path>           : Log file path (default: service-monitor.log)

Commands:
  status                    : Show current service status
  help                      : Show this help message

Examples:
  ./service-monitor.ps1                           # Start monitoring with defaults
  ./service-monitor.ps1 -CheckInterval 60        # Check every 60 seconds
  ./service-monitor.ps1 -MaxRetries 5            # Allow 5 restart attempts

The monitor will continuously check:
  - MongoDB container and connection
  - API Server container and health endpoint
  - n8n container and health endpoint

Services will be automatically restarted if they fail, with proper
dependency management to ensure restart order.

Press Ctrl+C to stop monitoring.
"@
}

# Main execution
if ($args.Count -gt 0) {
    switch ($args[0].ToLower()) {
        "status" { Get-ServiceStatus; exit 0 }
        "help" { Show-Help; exit 0 }
        default { Write-Host "Unknown command. Use 'help' for usage information."; exit 1 }
    }
}

# Initialize log file
Write-ServiceLog "DevOps Insight Engine Service Monitor Started" "INFO"
Write-ServiceLog "Configuration: CheckInterval=${CheckInterval}s, MaxRetries=$MaxRetries, LogFile=$LogFile" "INFO"

# Check if Docker is available
try {
    $dockerVersion = docker --version
    Write-ServiceLog "Docker detected: $dockerVersion" "INFO"
}
catch {
    Write-ServiceLog "Docker is not available or not in PATH. Service monitoring requires Docker." "ERROR"
    exit 1
}

# Initial status check
Write-ServiceLog "Performing initial health check..." "INFO"
Get-ServiceStatus

# Start monitoring
Start-ServiceMonitoring