#!/bin/sh
# This script is run when the MongoDB container starts
# It ensures that the validation schema is always updated properly

# Wait for MongoDB to be fully available
echo "Waiting for MongoDB to be ready..."
sleep 10

# Run the validation update script
echo "Updating MongoDB validation schemas..."
mongosh -u admin -p N0virus1! --authenticationDatabase admin i16e-db /docker-entrypoint-initdb.d/update-validation.js

echo "MongoDB validation setup complete."