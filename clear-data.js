#!/usr/bin/env node

/**
 * Data Clearing Script for DevOps Insight Engine
 * Clears all data from specified MongoDB collections: dpes, performance_data, squads, teams
 */

const API_BASE_URL = 'http://localhost:3001/api';

async function clearCollections() {
  const collections = ['dpes', 'performance_data', 'squads', 'teams'];
  
  console.log('🗑️  Starting data clearing process...');
  console.log(`📊 Target collections: ${collections.join(', ')}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/collections/clear`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collections })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    
    console.log('\n✅ Data clearing completed!');
    console.log(`📊 Total documents deleted: ${result.totalDeleted}`);
    console.log('\n📝 Collection details:');
    
    for (const [collection, details] of Object.entries(result.collections)) {
      const status = details.success ? '✅' : '❌';
      const count = details.success ? details.deletedCount || 0 : 'N/A';
      const error = details.success ? '' : ` (Error: ${details.error})`;
      console.log(`  ${status} ${collection}: ${count} documents${error}`);
    }
    
    if (result.success) {
      console.log('\n🎉 All collections cleared successfully!');
      console.log('💡 You can now add new entities without any old data conflicts.');
    } else {
      console.log('\n⚠️  Some collections had issues. Check the details above.');
    }

  } catch (error) {
    console.error('\n❌ Failed to clear data:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('  1. Make sure the MongoDB API server is running (npm run dev or start-mongodb-api.bat)');
    console.log('  2. Check that MongoDB is accessible at the configured connection string');
    console.log('  3. Verify the API server is listening on http://localhost:3001');
    process.exit(1);
  }
}

// Run the script
clearCollections();