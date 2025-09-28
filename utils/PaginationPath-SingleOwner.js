// Pagination Path Node - Complete Code
// Copy this entire file into the "Pagination Path" node after the Pagination Check

// This node prepares data for pagination continuation
try {
  // Get data from the Pagination Check node
  const paginationData = $node["Pagination Check"].json;
  const pageData = paginationData.pageData;
  
  // Get owner information
  const ownerNames = pageData.ownerNames || [];
  const isSingleOwner = pageData.singleOwnerMode === true;
  const ownerId = pageData.ownerId || 'unknown';
  
  console.log('=== PAGINATION PATH ===');
  if (isSingleOwner) {
    const owner = ownerNames[0];
    const progress = pageData.currentOwnerProgress?.[owner];
    console.log(`PARALLEL PATH - Continuing pagination for owner: ${owner} (ID: ${ownerId})`);
    if (progress) {
      console.log(`Progress: ${progress.retrievedResults}/${progress.totalResults}`);
    }
  }
  
  // Pass all the necessary data for continuation
  return {
    json: {
      ownerNames: ownerNames,
      eurekaDateRange: pageData.eurekaDateRange,
      dateRange: pageData.dateRange,
      entityType: pageData.entityType,
      entityName: pageData.entityName,
      processingMode: pageData.processingMode,
      parallelEnabled: pageData.parallelEnabled,
      pageData: pageData,
      singleOwnerMode: isSingleOwner,
      ownerId: ownerId,
      batchId: pageData.batchId
    }
  };
} catch (error) {
  console.error('Error in Pagination Path node:', error.message);
  return { json: { error: error.message } };
}