/**
 * MongoDB validation checker module for the API server
 * This checks and fixes MongoDB validation issues on demand
 */

const { MongoClient } = require('mongodb');

/**
 * Checks and fixes MongoDB validation issues
 * @param {string} mongoUri - MongoDB connection URI
 * @returns {Promise<object>} - Result of the validation check
 */
async function checkAndFixValidation(mongoUri) {
  console.log('🔍 Starting MongoDB validation check and fix...');
  
  const client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB for validation check');
    
    const db = client.db('i16e-db');
    
    // Update team collection validation
    console.log('🔄 Updating teams collection validation...');
    try {
      await db.command({
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
      console.log('✅ Successfully updated teams validation');
    } catch (error) {
      console.error('❌ Error updating teams validation:', error.message);
    }
    
    // Update squads collection validation
    console.log('🔄 Updating squads collection validation...');
    try {
      await db.command({
        collMod: 'squads',
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
      console.log('✅ Successfully updated squads validation');
    } catch (error) {
      console.error('❌ Error updating squads validation:', error.message);
    }
    
    // Update DPEs collection validation
    console.log('🔄 Updating dpes collection validation...');
    try {
      await db.command({
        collMod: 'dpes',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'created_at'],
            properties: {
              name: {
                bsonType: 'string',
                description: 'DPE name must be a string and is required'
              },
              squadID: {
                bsonType: 'objectId',
                description: 'Squad ID must be an ObjectId'
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
      console.log('✅ Successfully updated dpes validation');
    } catch (error) {
      console.error('❌ Error updating dpes validation:', error.message);
    }
    
    console.log('✅ MongoDB validation check and fix completed');
    return { success: true, message: 'Validation check and fix completed' };
  } catch (error) {
    console.error('❌ Error during validation check:', error);
    return { success: false, error: error.message };
  } finally {
    await client.close();
    console.log('✅ Closed MongoDB connection after validation check');
  }
}

module.exports = {
  checkAndFixValidation
};