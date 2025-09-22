#!/usr/bin/env pwsh
# Development Service Monitor for DevOps Insight Engine
# Lightweight monitoring for development environment

param(
    [switch]$Status,
    [switch]$Restart,
    [switch]$Stop,
    [switch]$Start,
    [switch]$Help
)

# Service definitions
$Services = @{
    "mongodb" = @{
        Name = "MongoDB"
        Container = "i16e-mongodb"
        Port = 27017
        HealthCheck = "http://localhost:27017"
    }
    "api" = @{
        Name = "API Server"
        Container = "i16e-api"
        Port = 3001
        HealthCheck = "http://localhost:3001/api/health"
    }
    "n8n" = @{
        Name = "n8n"
        Container = "i16e-n8n"
        Port = 5678
        HealthCheck = "http://localhost:5678/healthz"
    }
}

function Test-ServiceHealth {
    param([string]$Url, [int]$Timeout = 5)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $Timeout -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Test-ContainerRunning {
    param([string]$Container)
    
    try {
        $result = docker ps --filter "name=$Container" --filter "status=running" --quiet
        return -not [string]::IsNullOrEmpty($result)
    }
    catch {
        return $false
    }
}

function Get-ServiceStatus {
    Write-Host "`n=== DevOps Insight Engine Status ===" -ForegroundColor Cyan
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""
    
    foreach ($serviceKey in $Services.Keys) {
        $service = $Services[$serviceKey]
        
        # Check container status
        $containerRunning = Test-ContainerRunning -Container $service.Container
        
        Write-Host "$($service.Name) ($($service.Container)):" -ForegroundColor Yellow
        
        if ($containerRunning) {
            Write-Host "  Container: " -NoNewline
            Write-Host "Running" -ForegroundColor Green
            
            # Check health endpoint
            if ($service.HealthCheck) {
                $healthy = Test-ServiceHealth -Url $service.HealthCheck
                Write-Host "  Health: " -NoNewline
                if ($healthy) {
                    Write-Host "OK" -ForegroundColor Green
                } else {
                    Write-Host "FAILED" -ForegroundColor Red
                }
            }
            
            Write-Host "  Port: $($service.Port)" -ForegroundColor Gray
        } else {
            Write-Host "  Container: " -NoNewline
            Write-Host "Not Running" -ForegroundColor Red
        }
        Write-Host ""
    }
}

function Start-Services {
    Write-Host "Starting DevOps Insight Engine services..." -ForegroundColor Cyan
    
    try {
        # Check if docker-compose.yml exists
        if (-not (Test-Path "docker-compose.yml")) {
            Write-Host "ERROR: docker-compose.yml not found in current directory" -ForegroundColor Red
            return $false
        }
        
        docker-compose up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Services started successfully" -ForegroundColor Green
            Start-Sleep -Seconds 10
            Get-ServiceStatus
            return $true
        } else {
            Write-Host "Failed to start services" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "Error starting services: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Stop-Services {
    Write-Host "Stopping DevOps Insight Engine services..." -ForegroundColor Cyan
    
    try {
        docker-compose down
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Services stopped successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "Failed to stop services" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "Error stopping services: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Restart-Services {
    Write-Host "Restarting DevOps Insight Engine services..." -ForegroundColor Cyan
    
    if (Stop-Services) {
        Start-Sleep -Seconds 5
        return Start-Services
    }
    return $false
}

function Show-Help {
    Write-Host @"
DevOps Insight Engine Service Manager

Usage: ./dev-monitor.ps1 [command]

Commands:
  -Status     : Show current service status
  -Start      : Start all services via docker-compose
  -Stop       : Stop all services via docker-compose
  -Restart    : Restart all services
  -Help       : Show this help message

If no command is provided, shows status by default.

Services monitored:
  - MongoDB (port 27017)
  - API Server (port 3001)
  - n8n Workflow Engine (port 5678)

Examples:
  ./dev-monitor.ps1 -Status    # Show status
  ./dev-monitor.ps1 -Start     # Start services
  ./dev-monitor.ps1 -Restart   # Restart services
"@
}

# Main execution logic
if ($Help) {
    Show-Help
    exit 0
}

if ($Start) {
    Start-Services
    exit 0
}

if ($Stop) {
    Stop-Services
    exit 0
}

if ($Restart) {
    Restart-Services
    exit 0
}

# Default action is to show status
Get-ServiceStatus