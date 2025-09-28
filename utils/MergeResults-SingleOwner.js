// Merge Results Node - Complete Code 
// Copy this entire file into the Merge node after all parallel branches

// This node merges results from all parallel owner paths
try {
  // Get all inputs from parallel owner branches
  const inputItems = $input.all();
  
  console.log('=== MERGING PARALLEL RESULTS ===');
  console.log(`Merging results from ${inputItems.length} parallel owner paths`);
  
  // Extract and merge all results
  let allResults = [];
  let totalOwnersProcessed = 0;
  let totalResults = 0;
  let entityInfo = null;
  
  for (const item of inputItems) {
    // Skip items without parallelResults
    if (!item.json || !item.json.parallelResults) {
      console.warn('Skipping invalid item without parallelResults');
      continue;
    }
    
    const parallelData = item.json.parallelResults;
    
    // Increment processed owners count
    if (parallelData.ownerNames && Array.isArray(parallelData.ownerNames)) {
      totalOwnersProcessed += parallelData.ownerNames.length;
    }
    
    // Add results
    if (parallelData.results && Array.isArray(parallelData.results)) {
      allResults = [...allResults, ...parallelData.results];
      totalResults += parallelData.results.length;
    }
    
    // Save entity info from any valid response
    if (!entityInfo && parallelData.entityName && parallelData.entityType) {
      entityInfo = {
        entityName: parallelData.entityName,
        entityType: parallelData.entityType,
        dateRange: parallelData.dateRange
      };
    }
  }
  
  console.log(`Successfully merged ${totalResults} results from ${totalOwnersProcessed} owners`);
  
  // Return the combined results
  return {
    json: {
      mergedResults: {
        results: allResults,
        totalResults: totalResults,
        totalOwnersProcessed: totalOwnersProcessed,
        ...entityInfo,
        timestamp: new Date().toISOString()
      }
    }
  };
} catch (error) {
  console.error('Error in Merge Results node:', error.message);
  return { json: { error: error.message } };
}