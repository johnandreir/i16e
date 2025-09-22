// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the i16e-db database
db = db.getSiblingDB('i16e-db');

// Create collections with validation schemas
db.createCollection('teams', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'createdAt'],
            properties: {
                name: {
                    bsonType: 'string',
                    description: 'Team name must be a string and is required'
                },
                description: {
                    bsonType: 'string',
                    description: 'Team description must be a string'
                },
                createdAt: {
                    bsonType: 'date',
                    description: 'Creation date must be a date and is required'
                },
                updatedAt: {
                    bsonType: 'date',
                    description: 'Update date must be a date'
                }
            }
        }
    }
});

db.createCollection('squads', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'teamId', 'createdAt'],
            properties: {
                name: {
                    bsonType: 'string',
                    description: 'Squad name must be a string and is required'
                },
                teamId: {
                    bsonType: 'objectId',
                    description: 'Team ID must be an ObjectId and is required'
                },
                description: {
                    bsonType: 'string',
                    description: 'Squad description must be a string'
                },
                createdAt: {
                    bsonType: 'date',
                    description: 'Creation date must be a date and is required'
                },
                updatedAt: {
                    bsonType: 'date',
                    description: 'Update date must be a date'
                }
            }
        }
    }
});

db.createCollection('dpes', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'squadId', 'createdAt'],
            properties: {
                name: {
                    bsonType: 'string',
                    description: 'DPE name must be a string and is required'
                },
                squadId: {
                    bsonType: 'objectId',
                    description: 'Squad ID must be an ObjectId and is required'
                },
                email: {
                    bsonType: 'string',
                    description: 'Email must be a string'
                },
                role: {
                    bsonType: 'string',
                    description: 'Role must be a string'
                },
                createdAt: {
                    bsonType: 'date',
                    description: 'Creation date must be a date and is required'
                },
                updatedAt: {
                    bsonType: 'date',
                    description: 'Update date must be a date'
                }
            }
        }
    }
});

// Create performance_data collection without validation for debugging
db.createCollection('performance_data');

// Create indexes for better performance
db.teams.createIndex({ name: 1 }, { unique: true });
db.squads.createIndex({ name: 1, teamId: 1 }, { unique: true });
db.squads.createIndex({ teamId: 1 });
db.dpes.createIndex({ name: 1, squadId: 1 }, { unique: true });
db.dpes.createIndex({ squadId: 1 });
db.performance_data.createIndex({ entityId: 1, entityType: 1, date: -1 });

// Insert sample data
const now = new Date();

// Insert sample teams
const teamResult = db.teams.insertMany([
    {
        name: 'Platform Engineering',
        description: 'Core platform development and infrastructure',
        createdAt: now,
        updatedAt: now
    },
    {
        name: 'DevOps Infrastructure',
        description: 'DevOps tools and infrastructure management',
        createdAt: now,
        updatedAt: now
    },
    {
        name: 'Cloud Operations',
        description: 'Cloud infrastructure and operations',
        createdAt: now,
        updatedAt: now
    }
]);

print('Sample teams inserted:', teamResult.insertedIds.length);

// Get team IDs for squad insertion
const teams = db.teams.find({}).toArray();
const platformTeamId = teams.find(t => t.name === 'Platform Engineering')._id;
const devopsTeamId = teams.find(t => t.name === 'DevOps Infrastructure')._id;
const cloudTeamId = teams.find(t => t.name === 'Cloud Operations')._id;

// Insert sample squads
const squadResult = db.squads.insertMany([
    {
        name: 'Alpha Squad',
        teamId: platformTeamId,
        description: 'Frontend and API development',
        createdAt: now,
        updatedAt: now
    },
    {
        name: 'Beta Squad',
        teamId: platformTeamId,
        description: 'Backend services and databases',
        createdAt: now,
        updatedAt: now
    },
    {
        name: 'Gamma Squad',
        teamId: devopsTeamId,
        description: 'CI/CD and automation',
        createdAt: now,
        updatedAt: now
    },
    {
        name: 'Delta Squad',
        teamId: cloudTeamId,
        description: 'Cloud infrastructure',
        createdAt: now,
        updatedAt: now
    }
]);

print('Sample squads inserted:', squadResult.insertedIds.length);

// Get squad IDs for DPE insertion
const squads = db.squads.find({}).toArray();
const alphaSquadId = squads.find(s => s.name === 'Alpha Squad')._id;
const betaSquadId = squads.find(s => s.name === 'Beta Squad')._id;
const gammaSquadId = squads.find(s => s.name === 'Gamma Squad')._id;
const deltaSquadId = squads.find(s => s.name === 'Delta Squad')._id;

// Insert sample DPEs
const dpeResult = db.dpes.insertMany([
    {
        name: 'John Smith',
        squadId: alphaSquadId,
        email: 'john.smith@company.com',
        role: 'Senior Developer',
        createdAt: now,
        updatedAt: now
    },
    {
        name: 'Jane Doe',
        squadId: alphaSquadId,
        email: 'jane.doe@company.com',
        role: 'Lead Developer',
        createdAt: now,
        updatedAt: now
    },
    {
        name: 'Mike Wilson',
        squadId: betaSquadId,
        email: 'mike.wilson@company.com',
        role: 'Backend Developer',
        createdAt: now,
        updatedAt: now
    },
    {
        name: 'Sarah Connor',
        squadId: betaSquadId,
        email: 'sarah.connor@company.com',
        role: 'Database Specialist',
        createdAt: now,
        updatedAt: now
    },
    {
        name: 'Alex Turner',
        squadId: gammaSquadId,
        email: 'alex.turner@company.com',
        role: 'DevOps Engineer',
        createdAt: now,
        updatedAt: now
    },
    {
        name: 'Emma Watson',
        squadId: deltaSquadId,
        email: 'emma.watson@company.com',
        role: 'Cloud Architect',
        createdAt: now,
        updatedAt: now
    }
]);

print('Sample DPEs inserted:', dpeResult.insertedIds.length);

// Insert sample performance data
const dpes = db.dpes.find({}).toArray();
const performanceData = [];

// Generate performance data for the last 30 days for each DPE
for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    dpes.forEach(dpe => {
        performanceData.push({
            entityId: dpe._id,
            entityType: 'dpe',
            date: date,
            metrics: {
                sct: Math.floor(Math.random() * 15) + 8, // 8-22 days
                cases: Math.floor(Math.random() * 20) + 30, // 30-50 cases
                satisfaction: Math.floor(Math.random() * 25) + 75 // 75-100%
            },
            createdAt: now
        });
    });
}

const performanceResult = db.performance_data.insertMany(performanceData);
print('Sample performance data inserted:', performanceResult.insertedIds.length);

print('MongoDB initialization completed successfully!');
print('Collections created: teams, squads, dpes, performance_data');
print('Sample data inserted for all collections');
print('Indexes created for optimal performance');