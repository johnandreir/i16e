// Pagination Check Node - Complete Code
// Copy this entire file into the Pagination Check node

// This node determines whether pagination should continue
try {
  // Get data from previous nodes
  const apiResponse = $node["eurekaAPI"].json;
  const pageData = $node["Edit Fields"].json.pageData;
  
  console.log('=== PAGINATION CHECK ===');
  
  // Get owner information
  const ownerNames = pageData.ownerNames || [];
  const isSingleOwner = pageData.singleOwnerMode === true;
  const ownerId = pageData.ownerId || 'unknown';
  
  if (isSingleOwner) {
    console.log(`PARALLEL PATH - Checking pagination for owner: ${ownerNames[0]} (ID: ${ownerId})`);
  } else {
    console.log(`Checking pagination for ${ownerNames.length} owners`);
  }
  
  // Check response validity
  if (!apiResponse.results || !Array.isArray(apiResponse.results)) {
    throw new Error('Invalid API response - missing results array');
  }
  
  // Get the result counts
  const totalHits = apiResponse.totalHits || 0;
  const currentResults = apiResponse.results.length || 0;
  const currentStart = pageData.currentStart || 0;
  const pageSize = pageData.pageSize || 30;
  const nextStart = currentStart + currentResults;
  
  console.log(`API response - totalHits: ${totalHits}, currentResults: ${currentResults}, nextStart: ${nextStart}`);
  
  // Get or initialize the progress tracking
  const currentOwnerProgress = { ...pageData.currentOwnerProgress } || {};
  
  // Update progress for each owner
  ownerNames.forEach(owner => {
    if (!currentOwnerProgress[owner]) {
      currentOwnerProgress[owner] = { retrievedResults: 0, totalResults: totalHits, complete: false };
    } else {
      currentOwnerProgress[owner].retrievedResults += currentResults;
      currentOwnerProgress[owner].totalResults = totalHits;
    }
    
    // Check if this owner is now complete
    if (currentOwnerProgress[owner].retrievedResults >= totalHits) {
      currentOwnerProgress[owner].complete = true;
      console.log(`Owner ${owner} processing is COMPLETE. Total results: ${totalHits}`);
    }
  });
  
  // Determine if we should continue pagination
  const shouldContinuePagination = nextStart < totalHits;
  
  if (shouldContinuePagination) {
    console.log(`Continuing pagination - Progress: ${nextStart}/${totalHits}`);
    
    // Return the next pagination data
    return [{
      json: {
        pageData: {
          ownerNames: ownerNames,
          nextStart: nextStart,
          pageSize: pageSize,
          currentOwnerProgress: currentOwnerProgress,
          eurekaDateRange: pageData.eurekaDateRange,
          dateRange: pageData.dateRange,
          entityType: pageData.entityType,
          entityName: pageData.entityName,
          processingMode: pageData.processingMode,
          parallelEnabled: pageData.parallelEnabled,
          singleOwnerMode: isSingleOwner,
          ownerId: ownerId,
          batchId: pageData.batchId
        },
        results: apiResponse.results,
        totalHits: totalHits,
        continuePagination: true
      }
    }];
  } else {
    // All results for this owner retrieved - mark as complete
    console.log(`Pagination complete for this owner batch - Results retrieved: ${nextStart}/${totalHits}`);
    
    // Return the final result for this owner
    return [{
      json: {
        pageData: {
          ownerNames: ownerNames,
          nextStart: null,
          pageSize: pageSize,
          currentOwnerProgress: currentOwnerProgress,
          eurekaDateRange: pageData.eurekaDateRange,
          dateRange: pageData.dateRange,
          entityType: pageData.entityType,
          entityName: pageData.entityName,
          processingMode: pageData.processingMode,
          parallelEnabled: pageData.parallelEnabled,
          singleOwnerMode: isSingleOwner,
          ownerId: ownerId,
          batchId: pageData.batchId,
          isLastPage: true
        },
        results: apiResponse.results,
        totalHits: totalHits,
        continuePagination: false
      }
    }];
  }
} catch (error) {
  console.error('Error in Pagination Check node:', error.message);
  return [{ json: { error: error.message } }];
}