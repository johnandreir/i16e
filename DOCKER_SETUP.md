# Docker Setup and Operations

This document describes how to run the DevOps Insight Engine using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0 or higher

## Quick Start

### Production Environment

```bash
# Start all services in production mode
docker-compose -f docker-compose.prod.yml up -d

# Or using make (if available)
make prod
```

### Development Environment

```bash
# Start all services in development mode with hot reload
docker-compose -f docker-compose.dev.yml up -d

# Or using make (if available)
make dev
```

## Services

The application consists of 4 main services:

1. **MongoDB** (`i16e-mongodb`) - Database server

   - Port: 27017
   - Admin credentials: admin/N0virus1!

2. **N8N** (`i16e-n8n`) - Workflow automation

   - Port: 5678
   - Web interface: http://localhost:5678

3. **API Server** (`i16e-api`) - Backend API

   - Port: 3001
   - Health check: http://localhost:3001/api/health

4. **Frontend** (`i16e-frontend`) - React application
   - Port: 8082
   - Web interface: http://localhost:8082

## Available Commands

### Using Docker Compose directly

```bash
# Production
docker-compose -f docker-compose.prod.yml up -d        # Start
docker-compose -f docker-compose.prod.yml down         # Stop
docker-compose -f docker-compose.prod.yml logs -f      # View logs
docker-compose -f docker-compose.prod.yml up -d --build # Rebuild and start

# Development
docker-compose -f docker-compose.dev.yml up -d         # Start
docker-compose -f docker-compose.dev.yml down          # Stop
docker-compose -f docker-compose.dev.yml logs -f       # View logs
docker-compose -f docker-compose.dev.yml up -d --build # Rebuild and start
```

### Using Makefile (recommended)

```bash
make help           # Show all available commands

# Production
make prod          # Start production environment
make prod-build    # Build and start production
make prod-down     # Stop production
make prod-logs     # View production logs

# Development
make dev           # Start development environment
make dev-build     # Build and start development
make dev-down      # Stop development
make dev-logs      # View development logs

# Utilities
make clean         # Clean up containers and volumes
make clean-all     # Clean everything including images
make health        # Check health of all services
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

- `i16e-network`: Production network (172.20.0.0/16)
- `i16e-dev-network`: Development network (172.21.0.0/16)

## Health Checks

All services include health checks:

- MongoDB: Database ping
- N8N: HTTP health endpoint
- API: HTTP health endpoint
- Frontend: HTTP availability

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
docker-compose -f docker-compose.prod.yml logs

# Check specific service
docker logs i16e-api
docker logs i16e-frontend
```

### Clean restart

```bash
make clean
make prod-build
```

## Development Features

The development environment includes:

- Hot reload for frontend changes
- Volume mounts for live code editing
- Separate network and containers from production
- Development-friendly environment variables
