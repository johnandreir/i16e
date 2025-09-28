// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the i16e-db database
db = db.getSiblingDB('i16e-db');

// Create collections with validation schemas
db.createCollection('teams', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'created_at'],
            properties: {
                name: {
                    bsonType: 'string',
                    description: 'Team name must be a string and is required'
                },
                created_at: {
                    bsonType: 'date',
                    description: 'Creation date must be a date and is required'
                },
                updated_at: {
                    bsonType: 'date',
                    description: 'Update date must be a date'
                }
            }
        }
    },
    validationLevel: 'moderate',
    validationAction: 'error'
});

db.createCollection('squads', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'created_at'],
            properties: {
                name: {
                    bsonType: 'string',
                    description: 'Squad name must be a string and is required'
                },
                teamID: {
                    bsonType: 'objectId',
                    description: 'Team ID must be an ObjectId'
                },
                created_at: {
                    bsonType: 'date',
                    description: 'Creation date must be a date and is required'
                },
                updated_at: {
                    bsonType: 'date',
                    description: 'Update date must be a date'
                }
            }
        }
    },
    validationLevel: 'moderate',
    validationAction: 'error'
});

db.createCollection('dpes', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'created_at', 'squadID'],
            properties: {
                name: {
                    bsonType: 'string',
                    description: 'DPE name must be a string and is required'
                },
                squadID: {
                    bsonType: 'objectId',
                    description: 'Squad ID must be an ObjectId and is required for proper relationships'
                },
                status: {
                    bsonType: 'string',
                    enum: ['active', 'inactive', 'archived'],
                    description: 'DPE status must be one of: active, inactive, archived'
                },
                metadata: {
                    bsonType: 'object',
                    description: 'Additional metadata for DPE'
                },
                created_at: {
                    bsonType: 'date',
                    description: 'Creation date must be a date and is required'
                },
                updated_at: {
                    bsonType: 'date',
                    description: 'Update date must be a date'
                }
            }
        }
    },
    validationLevel: 'moderate',
    validationAction: 'error'
});

// Create performance_data collection without validation for debugging
db.createCollection('performance_data');

// Create indexes for better performance
db.teams.createIndex({ name: 1 }, { unique: true });
db.squads.createIndex({ name: 1, teamID: 1 }, { unique: true });
db.squads.createIndex({ teamID: 1 });
db.dpes.createIndex({ name: 1, squadID: 1 }, { unique: true });
db.dpes.createIndex({ squadID: 1 });
db.performance_data.createIndex({ entity_id: 1, entity_type: 1, date: -1 });

print('MongoDB initialization completed successfully!');
print('Collections created: teams, squads, dpes, performance_data');
print('No sample data inserted - collections are empty');
print('Indexes created for optimal performance');