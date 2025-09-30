# Project Structure Reorganization

This document outlines the reorganization of the project structure for the DevOps Insight Engine.

## Directory Structure

The project has been reorganized into the following directories:

### `/n8n-workflows`

Contains all n8n workflow JSON files:

- **Aggregate Data.json** - Data aggregation workflow
- **Calculate metrics.json** - Performance metrics calculation
- **Chatbot.json** - AI chatbot integration workflow
- **Get cases.json** - Case data retrieval workflow
- **Process Survey.json** - Survey data processing workflow

Note: Some legacy workflows may have been removed or consolidated.

### `/scripts`

Contains batch scripts for operating the system:

- **apply-emergency-fix.bat** - Apply emergency fixes to services
- **check-health.bat** - Monitor service health status  
- **cleanup-docker-env.bat** - Complete Docker environment cleanup
- **cleanup.bat** - Clean up Docker containers and volumes
- **monitor-connection.bat** - Monitor database and service connections
- **restart-with-fixes.bat** - Restart services with applied fixes
- **start.bat** - Start backend Docker services only
- **stop.bat** - Stop all backend Docker services
- **update-status-display.bat** - Update service status displays
- **view-logs.bat** - Interactive Docker logs viewer

### `/server`

Contains server-related files:

- mongodb-api-server.cjs - Main API server handling MongoDB operations
- server.js - Alternative Express server implementation using Mongoose

### `/utils`

Contains utility JavaScript and CommonJS files for data processing and testing:

**Data Processing Utilities:**
- **BatchOwnerNames-Simultaneous.js** - Batch owner name processing
- **BatchOwnerNames-SingleOwner.js** - Single owner batch processing
- **EditFields-SingleOwner.js** - Field editing utilities
- **MergeResults-SingleOwner.js** - Data merging utilities
- **NoPaginationPath-SingleOwner.js** - Non-paginated data handling
- **PaginationCheck-SingleOwner.js** - Pagination validation
- **PaginationPath-SingleOwner.js** - Paginated data processing

**Development & Testing Utilities:**
- **check-performance-data.cjs** - Performance data validation
- **check-workflow-status.cjs** - Workflow status monitoring
- **improved-health-check.cjs** - Enhanced health checking
- **list-workflows.cjs** - N8N workflow listing
- **start-dev-enhanced.cjs** - Enhanced development startup
- **test-api.cjs** - API endpoint testing

### `/docker`

Contains Docker-related configuration files:

- **Dockerfile.api** - API server container definition

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
   - Uses volume mapping for n8n to access workflow files in `/n8n-workflows`
   - MongoDB initialization scripts mounted from `/mongodb-init`
   - Frontend runs locally with `npm run dev` for better development experience

2. **Script Organization**:
   - Main startup scripts (`start-full-dev.bat`, `start.bat`, `stop.bat`) in root directory
   - Utility scripts organized in `/scripts` directory
   - All scripts updated to reference correct file locations

3. **Server Structure**:
   - Main API server (`mongodb-api-server.cjs`) in `/server` directory
   - Alternative server implementation (`server.js`) for different use cases

4. **Documentation Structure**:
   - All documentation moved to `/docs` directory for better organization
   - Includes setup guides, project structure, and technical documentation

## How to Use

The main functionality remains the same, but now with a cleaner directory structure:

### Quick Start Commands
- **Full Development Environment**: `start-full-dev.bat` (root directory)
- **Backend Services Only**: `start.bat` (root directory)  
- **Stop All Services**: `stop.bat` (root directory)

### Advanced Operations
- **Health Monitoring**: `scripts/check-health.bat`
- **View Logs**: `scripts/view-logs.bat`
- **Clean Environment**: `scripts/cleanup.bat`
- **Emergency Fixes**: `scripts/apply-emergency-fix.bat`

### Development
- **Server Code**: Located in `/server` directory
- **N8N Workflows**: Located in `/n8n-workflows` directory
- **Utility Scripts**: Located in `/utils` directory
- **Documentation**: Located in `/docs` directory

### File Organization Benefits
- **Clear Separation**: Frontend, backend, scripts, and documentation are clearly separated
- **Easy Maintenance**: Related files are grouped together
- **Better Navigation**: Logical directory structure for different components
- **Scalability**: Easy to add new components without cluttering root directory

This reorganization ensures a cleaner project structure while maintaining all functionality.

## Server Files Explanation

- **init-mongo.js**: MongoDB initialization script that runs when the MongoDB container starts for the first time. It creates collections with proper validation schemas.
- **mongodb-api-server.cjs**: The main API server that handles MongoDB operations with proper field standardization and error handling. This is the primary server used in Docker.
- **server.js**: An alternative Express server implementation that uses Mongoose instead of the MongoDB native driver.
