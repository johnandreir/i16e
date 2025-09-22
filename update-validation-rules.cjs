const { MongoClient } = require('mongodb');

async function updateValidationRules() {
  try {
    console.log('🔧 Updating MongoDB validation rules...');
    
    const MONGODB_URI = 'mongodb://admin:N0virus1!@localhost:27017?authSource=admin';
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('✅ Connected to MongoDB');
    
    const i16eDb = client.db('i16e-db');
    
    // Update Teams validation
    console.log('📝 Updating teams validation...');
    await i16eDb.command({
      collMod: 'teams',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'created_at'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'Team name must be a string and is required'
            },
            description: {
              bsonType: 'string',
              description: 'Team description must be a string'
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
      }
    });
    console.log('✅ Teams validation updated');
    
    // Update Squads validation
    console.log('📝 Updating squads validation...');
    await i16eDb.command({
      collMod: 'squads',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'teamID', 'created_at'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'Squad name must be a string and is required'
            },
            teamID: {
              bsonType: 'objectId',
              description: 'Team ID must be an ObjectId and is required'
            },
            description: {
              bsonType: 'string',
              description: 'Squad description must be a string'
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
      }
    });
    console.log('✅ Squads validation updated');
    
    // Update DPEs validation
    console.log('📝 Updating dpes validation...');
    await i16eDb.command({
      collMod: 'dpes',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'squadID', 'created_at'],
          properties: {
            name: {
              bsonType: 'string',
              description: 'DPE name must be a string and is required'
            },
            squadID: {
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
      }
    });
    console.log('✅ DPEs validation updated');
    
    // Test inserting a team with new validation
    console.log('\n🧪 Testing team creation with updated validation...');
    const teamsCollection = i16eDb.collection('teams');
    const testTeam = {
      name: `Test Team ${Date.now()}`,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const insertResult = await teamsCollection.insertOne(testTeam);
    console.log('✅ Test team created successfully:', insertResult.insertedId);
    
    // Verify the team is there
    const teams = await teamsCollection.find({}).toArray();
    console.log(`📊 Total teams in i16e-db: ${teams.length}`);
    
    await client.close();
    console.log('✅ Validation rules updated successfully!');
    
  } catch (error) {
    console.error('❌ Failed to update validation rules:', error);
  }
}

updateValidationRules();