// No Pagination Path Node - Complete Code
// Copy this entire file into the "No Pagination Path" node after the Pagination Check

// This node handles results when there's no need to paginate further
try {
  // Get results from the Pagination Check node
  const paginationData = $node["Pagination Check"].json;
  const pageData = paginationData.pageData;
  const results = paginationData.results;
  
  // Get owner information
  const ownerNames = pageData.ownerNames || [];
  const isSingleOwner = pageData.singleOwnerMode === true;
  const ownerId = pageData.ownerId || 'unknown';
  
  console.log('=== NO PAGINATION PATH ===');
  if (isSingleOwner) {
    const owner = ownerNames[0];
    console.log(`PARALLEL PATH - Processing complete for owner: ${owner} (ID: ${ownerId})`);
    console.log(`Total results: ${paginationData.totalHits}`);
  }
  
  // Return with all the necessary metadata for merging
  return {
    json: {
      parallelResults: {
        ownerNames: ownerNames,
        results: results || [],
        totalHits: paginationData.totalHits || 0,
        ownerId: ownerId,
        batchId: pageData.batchId,
        isComplete: true,
        dateRange: pageData.dateRange,
        entityType: pageData.entityType,
        entityName: pageData.entityName
      }
    }
  };
} catch (error) {
  console.error('Error in No Pagination Path node:', error.message);
  return { json: { error: error.message } };
}