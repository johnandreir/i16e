# Service Monitoring and Auto-Healing

The DevOps Insight Engine includes comprehensive service monitoring and auto-healing capabilities to ensure maximum uptime and reliability.

## Quick Commands

### Development Monitoring
```bash
# Show service status
./dev-monitor.ps1

# Start all services
./dev-monitor.ps1 -Start

# Restart all services
./dev-monitor.ps1 -Restart

# Stop all services
./dev-monitor.ps1 -Stop
```

### Production Monitoring
```bash
# Start continuous monitoring with auto-healing
./start-monitor.bat

# Or run PowerShell directly
./service-monitor.ps1

# Check status only
./service-monitor.ps1 status

# Custom configuration
./service-monitor.ps1 -CheckInterval 60 -MaxRetries 5
```

## Services Monitored

### 1. MongoDB Database
- **Container**: `devops-insight-engine-mongodb-1`
- **Port**: 27017
- **Health Check**: Container status + connection test
- **Dependencies**: None (core service)
- **Auto-restart**: Yes

### 2. API Server
- **Container**: `devops-insight-engine-api-1`
- **Port**: 3001
- **Health Check**: `http://localhost:3001/api/health`
- **Dependencies**: MongoDB
- **Auto-restart**: Yes

### 3. n8n Workflow Engine
- **Container**: `devops-insight-engine-n8n-1`
- **Port**: 5678
- **Health Check**: `http://localhost:5678/healthz`
- **Dependencies**: MongoDB
- **Auto-restart**: Yes (optional service)

## Monitoring Features

### Health Checks
- **Container Status**: Verifies Docker containers are running
- **HTTP Endpoints**: Tests service responsiveness via health endpoints
- **Dependency Management**: Ensures services start in correct order
- **Real-time Monitoring**: Continuous health verification

### Auto-Healing
- **Automatic Restart**: Failed services are automatically restarted
- **Retry Logic**: Maximum retry attempts to prevent infinite restart loops
- **Dependency Handling**: Restarts dependent services when core services fail
- **Graceful Recovery**: Proper shutdown and startup sequences

### Monitoring Dashboard
The main application includes a **Backend Status** panel that shows:
- Real-time service health
- Connection status to MongoDB and n8n
- API server response times
- Last health check timestamps
- Service availability percentages

### Entity Validation
The **Entity Mapping Validator** component provides:
- Real-time validation of entity relationships
- Detection of orphaned squads and DPEs
- Identification of empty teams and squads
- Comprehensive mapping health reports

## Configuration

### service-monitor.ps1 Parameters
```powershell
-CheckInterval <seconds>   # Health check frequency (default: 30)
-MaxRetries <number>      # Maximum restart attempts (default: 3)
-LogFile <path>           # Log file location (default: service-monitor.log)
```

### Service Configuration
Services can be configured in the `$Services` hashtable within the monitoring scripts:

```powershell
$Services = @{
    "ServiceName" = @{
        Name = "Display Name"
        CheckUrl = "http://localhost:port/health"
        CheckCommand = { docker ps --filter "name=container" --quiet }
        RestartCommand = { docker restart container }
        Dependencies = @("RequiredService1", "RequiredService2")
        IsRequired = $true  # Critical service that must be running
    }
}
```

## Logging

### Log Levels
- **INFO**: Normal operation events
- **WARN**: Non-critical issues (service unhealthy but retrying)
- **ERROR**: Critical failures requiring attention

### Log Format
```
[2024-01-15 14:30:25] [INFO] Starting service monitoring
[2024-01-15 14:30:55] [WARN] API Server is unhealthy, attempting restart
[2024-01-15 14:31:10] [INFO] Successfully restarted API Server
```

### Log File Rotation
The monitoring system automatically manages log files to prevent disk space issues:
- Logs are written to `service-monitor.log` by default
- Historical logs can be archived as needed
- Log verbosity can be adjusted based on environment

## Troubleshooting

### Common Issues

#### Docker Not Running
```
ERROR: Docker is not running or not accessible
```
**Solution**: Start Docker Desktop and ensure Docker daemon is running

#### Services Won't Start
```
ERROR: Failed to restart MongoDB
```
**Solutions**:
1. Check Docker container logs: `docker logs devops-insight-engine-mongodb-1`
2. Verify port availability: `netstat -an | findstr :27017`
3. Check docker-compose.yml configuration
4. Restart Docker Desktop

#### Health Checks Failing
```
WARN: API Server container running but health check failed
```
**Solutions**:
1. Check service logs for startup errors
2. Verify health endpoint accessibility
3. Check for port conflicts
4. Review application configuration

#### Maximum Retries Exceeded
```
ERROR: MongoDB has exceeded maximum retry attempts
```
**Solutions**:
1. Check system resources (memory, disk space)
2. Review Docker container logs
3. Manually restart the problematic service
4. Check for underlying infrastructure issues

### Manual Recovery

If auto-healing fails, manual intervention steps:

1. **Check System Resources**
   ```bash
   docker system df
   docker system prune
   ```

2. **Restart Individual Services**
   ```bash
   docker restart devops-insight-engine-mongodb-1
   docker restart devops-insight-engine-api-1
   docker restart devops-insight-engine-n8n-1
   ```

3. **Full System Restart**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

4. **Check Logs**
   ```bash
   docker-compose logs -f
   docker logs devops-insight-engine-mongodb-1
   ```

## Best Practices

### Development Environment
- Use `dev-monitor.ps1` for quick status checks
- Monitor logs during development: `docker-compose logs -f`
- Regular health checks during testing

### Production Environment
- Run `service-monitor.ps1` as a background service
- Set appropriate check intervals (30-60 seconds)
- Monitor log files for patterns
- Set up alerts for critical failures
- Regular backup of monitoring logs

### Performance Optimization
- Adjust check intervals based on system load
- Monitor resource usage of monitoring scripts
- Use appropriate timeout values for health checks
- Implement log rotation to manage disk space

## Integration with CI/CD

The monitoring system can be integrated with CI/CD pipelines:

```yaml
# Example GitHub Actions integration
- name: Health Check
  run: |
    ./dev-monitor.ps1 -Status
    if ($LASTEXITCODE -ne 0) { exit 1 }
```

## Alerts and Notifications

Future enhancements can include:
- Email notifications for critical failures
- Slack/Teams integration for alerts
- Metrics collection for dashboards
- Integration with monitoring platforms (Prometheus, Grafana)

## Monitoring Metrics

The system tracks:
- Service uptime percentages
- Restart frequency
- Health check response times
- Failure patterns
- Recovery times

This information is valuable for:
- System reliability assessment
- Capacity planning
- Performance optimization
- Incident response improvement