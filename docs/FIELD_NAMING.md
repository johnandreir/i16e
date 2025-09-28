# Field Naming Convention Guide for DevOps Insight Engine

## Overview

This document outlines the field naming conventions used throughout the DevOps Insight Engine to ensure consistency between the API server and MongoDB schema validation.

## Field Naming Standards

### Teams Collection
- `name`: String (required)
- `created_at`: Date (required)
- `updated_at`: Date

### Squads Collection
- `name`: String (required)
- `teamID`: ObjectId
- `created_at`: Date (required)
- `updated_at`: Date

### DPEs Collection
- `name`: String (required)
- `squadID`: ObjectId
- `created_at`: Date (required)
- `updated_at`: Date

## Important Implementation Notes

1. **API Server Implementation**
   - The API server uses a `standardizeEntityFields()` function to ensure consistent field naming.
   - When creating or updating entities, always pass your data through this function to normalize field names.

2. **MongoDB Schema Validation**
   - Schema validation rules are defined in `mongodb-init/init-mongo.js`
   - An additional script `mongodb-init/update-validation.js` is run at startup to ensure schema validation matches the API field names.

3. **Docker Startup Process**
   - The startup scripts (`start-dev.bat`, `start-prod.bat`, `start-full-dev.bat`) include a step to run the validation update script.
   - This ensures schema validation is always in sync with the API field names.

## Troubleshooting

If you encounter validation errors like "Document failed validation":

1. Check that the field names used in your API requests match the conventions above.
2. Verify that the MongoDB schema validation in `init-mongo.js` matches these conventions.
3. Run the update validation script manually:
   ```
   docker exec i16e-mongodb mongosh -u admin -p N0virus1! --authenticationDatabase admin i16e-db /docker-entrypoint-initdb.d/update-validation.js
   ```

By maintaining consistent field naming throughout the codebase, we prevent validation errors and ensure smooth operation of the application.