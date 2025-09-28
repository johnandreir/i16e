# Project Structure Reorganization

This document outlines the reorganization of the project structure for the DevOps Insight Engine.

## Directory Structure

The project has been reorganized into the following directories:

### `/n8n-workflows`

Contains all n8n workflow JSON files:

- Aggregate Data.json
- Calculate metrics.json
- Chatbot.json
- Eureka API Service.json
- Eureka API Service.backup.json
- Final Arc.json
- Final Arc - Parallel.json
- Get cases.json
- Process Survey.json

### `/scripts`

Contains batch scripts for operating the system:

- apply-webhook-survey-fixes.bat
- check-health.bat
- cleanup-docker-env.bat
- cleanup.bat
- start.bat
- stop.bat
- view-logs.bat

### `/server`

Contains server-related files:

- mongodb-api-server.cjs - Main API server handling MongoDB operations
- server.js - Alternative Express server implementation using Mongoose

### `/utils`

Contains utility JavaScript and CommonJS files:

- BatchOwnerNames-Simultaneous.js
- BatchOwnerNames-SingleOwner.js
- EditFields-SingleOwner.js
- MergeResults-SingleOwner.js
- NoPaginationPath-SingleOwner.js
- PaginationCheck-SingleOwner.js
- PaginationPath-SingleOwner.js
- check-performance-data.cjs
- check-workflow-status.cjs
- improved-health-check.cjs
- list-workflows.cjs
- start-dev-enhanced.cjs
- test-api.cjs

### `/docker`

Contains Docker-related configuration files:

- Dockerfile.api

### `/docs`

Contains documentation files:

- DOCKER_SETUP.md - Information about Docker configuration and commands
- FIELD_NAMING.md - Field naming conventions for the database
- PROJECT_STRUCTURE.md - This file, explaining the project structure
- QUICK_START.md - Quick start guide for new developers
- SERVER_FILES.md - Information about the server implementation

## Changes Made to Support Reorganization

1. **Docker Compose Configuration**:

   - `docker-compose.yml` references the Dockerfile.api in the docker directory
   - Uses volume mapping for n8n to access workflow files
   - Frontend runs locally with `npm run dev` for better development experience

2. **Script Access**:

   - Added wrapper scripts in the root directory for ease of use
   - Updated paths in scripts to reference files in their new locations

3. **n8n Workflow Access**:
   - Added volume mount to make n8n workflows accessible to n8n container

## How to Use

The main functionality remains the same, but now with a cleaner directory structure:

- To start the system: `start.bat` (in the root directory)
- To stop the system: `stop.bat` (in the root directory)
- Access scripts directly from the `/scripts` directory if needed
- n8n workflows are now located in the `/n8n-workflows` directory
- Utility scripts are in the `/utils` directory

This reorganization ensures a cleaner project structure while maintaining all functionality.

## Server Files Explanation

- **init-mongo.js**: MongoDB initialization script that runs when the MongoDB container starts for the first time. It creates collections with proper validation schemas.
- **mongodb-api-server.cjs**: The main API server that handles MongoDB operations with proper field standardization and error handling. This is the primary server used in Docker.
- **server.js**: An alternative Express server implementation that uses Mongoose instead of the MongoDB native driver.
