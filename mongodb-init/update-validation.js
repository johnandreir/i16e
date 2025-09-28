// MongoDB validation schema update script
// This script checks and updates validation schemas if they don't match expected field names

// Switch to the i16e-db database
db = db.getSiblingDB('i16e-db');

print('Starting validation schema check and update...');

// Function to update collection validation schema
function updateCollectionValidation(collectionName, validationSchema) {
    try {
        // Run the command to update the validation schema
        const result = db.runCommand({
            collMod: collectionName,
            validator: validationSchema,
            validationLevel: 'moderate',
            validationAction: 'error'
        });
        
        if (result.ok === 1) {
            print(`✅ Successfully updated validation schema for collection '${collectionName}'`);
        } else {
            print(`❌ Failed to update validation for '${collectionName}': ${JSON.stringify(result)}`);
        }
    } catch (error) {
        print(`❌ Error updating validation for '${collectionName}': ${error.message}`);
    }
}

// Teams collection validation
const teamsValidation = {
    $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'created_at'],
        properties: {
            name: {
                bsonType: 'string',
                description: 'Team name must be a string and is required'
            },
            created_at: {
                anyOf: [
                    { bsonType: 'date' },
                    { bsonType: 'string' }
                ],
                description: 'Creation date must be a date or date string and is required'
            },
            updated_at: {
                anyOf: [
                    { bsonType: 'date' },
                    { bsonType: 'string' }
                ],
                description: 'Update date must be a date or date string'
            }
        }
    }
};

// Squads collection validation
const squadsValidation = {
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
                anyOf: [
                    { bsonType: 'date' },
                    { bsonType: 'string' }
                ],
                description: 'Creation date must be a date or date string and is required'
            },
            updated_at: {
                anyOf: [
                    { bsonType: 'date' },
                    { bsonType: 'string' }
                ],
                description: 'Update date must be a date or date string'
            }
        }
    }
};

// DPEs collection validation
const dpesValidation = {
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
                anyOf: [
                    { bsonType: 'date' },
                    { bsonType: 'string' }
                ],
                description: 'Creation date must be a date or date string and is required'
            },
            updated_at: {
                anyOf: [
                    { bsonType: 'date' },
                    { bsonType: 'string' }
                ],
                description: 'Update date must be a date or date string'
            }
        }
    }
};

// Update each collection's validation schema
updateCollectionValidation('teams', teamsValidation);
updateCollectionValidation('squads', squadsValidation);
updateCollectionValidation('dpes', dpesValidation);

// Ensure indexes match field names
try {
    // Drop existing indexes that might use old field names
    db.squads.dropIndex({ "name": 1, "team_id": 1 });
    db.squads.dropIndex({ "team_id": 1 });
    db.dpes.dropIndex({ "name": 1, "squad_id": 1 });
    db.dpes.dropIndex({ "squad_id": 1 });
    
    print('✅ Dropped old indexes with outdated field names');
} catch (e) {
    print('⚠️ Some indexes may not exist yet: ' + e.message);
}

// Create proper indexes
try {
    db.teams.createIndex({ name: 1 }, { unique: true });
    db.squads.createIndex({ name: 1, teamID: 1 }, { unique: true });
    db.squads.createIndex({ teamID: 1 });
    db.dpes.createIndex({ name: 1, squadID: 1 }, { unique: true });
    db.dpes.createIndex({ squadID: 1 });
    db.performance_data.createIndex({ entity_id: 1, entity_type: 1, date: -1 });
    
    print('✅ Created indexes with proper field names');
} catch (e) {
    print('❌ Error creating indexes: ' + e.message);
}

print('Validation schema check and update completed!');