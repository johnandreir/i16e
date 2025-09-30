# Docker Setup and Operations

This document describes how to run the DevOps Insight Engine using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0 or higher

## Quick Start

```bash
# Start all services
docker-compose up -d
```

### Docker Commands

```bash
# Start services in the background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and start services
docker-compose up -d --build
```

## Services

The application consists of 3 main Docker services (with Frontend running locally):

1. **MongoDB** (`i16e-mongodb`) - Database server
   - Port: 27017
   - Admin credentials: admin/N0virus1!

2. **N8N** (`i16e-n8n`) - Workflow automation
   - Port: 5678
   - Web interface: http://localhost:5678

3. **API Server** (`i16e-api`) - Backend API
   - Port: 3001
   - Health check: http://localhost:3001/api/health

4. **Frontend** - React application (runs locally via `npm run dev`)
   - Port: 8082
   - Web interface: http://localhost:8082
   - Development server with hot reload

## Available Commands

### Using Docker Compose directly

```bash
# Backend Services
docker-compose up -d                    # Start all backend services
docker-compose down                     # Stop all services  
docker-compose logs -f                  # View logs
docker-compose up -d --build            # Rebuild and start

# Individual Services
docker-compose up -d mongodb            # Start only MongoDB
docker-compose up -d n8n                # Start only N8N
docker-compose up -d api                # Start only API server
```

### Using Batch Scripts (Windows)

```bash
# Main Commands
start-full-dev.bat              # Start everything (backend + frontend)
start.bat                       # Start backend services only
stop.bat                        # Stop all backend services

# Utility Scripts (in /scripts directory)
scripts/check-health.bat        # Check service health
scripts/view-logs.bat          # Interactive log viewer
scripts/cleanup.bat            # Clean up containers and volumes
scripts/monitor-connection.bat  # Monitor connections
scripts/restart-with-fixes.bat # Restart with fixes applied
```

## Environment Variables

Key environment variables are configured in docker-compose files:

- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (production/development)
- `PORT`: API server port (3001)

## Volumes

- `mongodb_data`: MongoDB data persistence
- `n8n_data`: N8N workflow data persistence

## Networks

- `i16e-network`: Main network (172.20.0.0/16) for all backend services

## Health Checks

All backend services include health checks:

- **MongoDB**: Database ping and connection validation
- **N8N**: HTTP health endpoint (`/healthz`)
- **API**: HTTP health endpoint (`/api/health`)
- **Frontend**: Development server runs locally with auto-reload

Use `scripts/check-health.bat` to monitor all services at once.

## Troubleshooting

### Ports already in use

```bash
# Check what's using the ports
netstat -ano | findstr :3001
netstat -ano | findstr :8082
netstat -ano | findstr :5678
netstat -ano | findstr :27017

# Kill processes if needed
taskkill /f /pid <PID>
```

### Services not starting

```bash
# Check logs
docker-compose logs

# Check specific service
docker logs i16e-api
docker logs i16e-mongodb
docker logs i16e-n8n
```

### Clean restart

```bash
# Windows
scripts/cleanup.bat
start.bat

# Manual
docker-compose down
docker system prune -f  
docker-compose up -d --build
```

## Development Features

The hybrid development approach provides:

- **Frontend**: Local development server with hot reload (`npm run dev`)
- **Backend**: Containerized services for consistency
- **Volume Mounts**: Live code editing for server files
- **Fast Startup**: Backend services ready in ~30 seconds
- **Easy Debugging**: Local frontend with containerized backend
- **Data Persistence**: MongoDB and N8N data persisted in Docker volumes

## Hybrid Architecture Benefits

- **Speed**: No frontend Docker rebuilds needed for code changes
- **Consistency**: Backend services run in identical containers
- **Flexibility**: Can develop frontend locally or in container as needed
- **Simplicity**: Single `docker-compose.yml` file for all backend services
