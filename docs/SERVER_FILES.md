# Server Files Overview

This document explains the different server files in the DevOps Insight Engine project and how they relate to each other.

## Key Files

### 1. MongoDB Initialization Scripts

**Location:** `/mongodb-init/init-mongo.js`

**Purpose:** This script runs automatically when the MongoDB container starts for the first time. It:

- Creates database collections with proper schema validation
- Sets up indexes for performance optimization
- Establishes field validation rules
- Runs only on initial database creation

This file is critical for setting up the database structure and ensuring data integrity from the start.

### 2. Main API Server

**Location:** `/server/mongodb-api-server.cjs`

**Purpose:** The primary API server used in production. This server:

- Provides REST API endpoints for the frontend
- Handles direct MongoDB operations using the native MongoDB driver
- Implements field name standardization (converts between camelCase and snake_case)
- Includes extensive error handling and retry logic
- Used by the Docker container as the main backend API

This is the production server that's containerized and used in the Docker setup.

### 3. Alternative Server Implementation

**Location:** `/server/server.js`

**Purpose:** An alternative server implementation that:

- Uses Mongoose ODM instead of the MongoDB native driver
- Has a different architecture and approach to MongoDB connectivity
- May be used for development purposes or specific features
- Is not currently used in the Docker setup

This file represents an alternative approach to the backend but isn't currently the main server.

## Relationships Between Files

1. `init-mongo.js` sets up the database structure that `mongodb-api-server.cjs` interacts with
2. `mongodb-api-server.cjs` contains field standardization logic that ensures proper formatting of data
3. The MongoDB validation schemas defined in `init-mongo.js` enforce what `mongodb-api-server.cjs` can store

## Which One To Use

For production and Docker environments, use `mongodb-api-server.cjs` which is the current standard.

The `server.js` file is maintained as an alternative implementation or for specific use cases, but is not currently the primary server.
