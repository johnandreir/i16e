// Edit Fields Node - Complete Code
// Copy this entire file into the Edit Fields node

// This node handles pagination and API parameters for each individual owner
try {
  // Get input data from previous nodes
  const batchData = $node["BatchOwnerNames"].json;
  
  // Check if Pagination Check node has been executed yet
  let pageData = null;
  try {
    if ($node["Pagination Check"] && $node["Pagination Check"].json) {
      pageData = $node["Pagination Check"].json.pageData || null;
    }
  } catch (e) {
    // Pagination Check hasn't been executed yet, which is normal for the first run
    console.log('First run - Pagination Check node has not been executed yet');
  }
  
  console.log('=== EDIT FIELDS - PREPARING API REQUEST ===');
  
  let start, num, continuePagination, currentOwnerProgress;
  let ownerNames = batchData.ownerNames || [];
  const isSingleOwner = batchData.singleOwnerMode === true;
  const ownerId = batchData.ownerId || 'unknown';
  
  if (pageData && pageData.nextStart !== undefined) {
    // This is a pagination continuation
    start = pageData.nextStart;
    num = pageData.pageSize;
    continuePagination = true;
    currentOwnerProgress = pageData.currentOwnerProgress || {};
  } else {
    // This is the first API call or there was an error getting pagination data
    start = 0;
    // API limit is 30, stay safely within that limit
    num = 30;
    continuePagination = false;
    currentOwnerProgress = {};
  }
  
  // Initialize or update progress tracking for the owner in this parallel path
  ownerNames.forEach(owner => {
    if (!currentOwnerProgress[owner]) {
      currentOwnerProgress[owner] = {
        retrievedResults: 0,
        totalResults: 0,
        complete: false
      };
    }
  });
  
  // If no owners, throw error
  if (!ownerNames.length) {
    throw new Error('No owners provided for case retrieval');
  }
  
  // Single owner mode logging
  if (isSingleOwner) {
    const owner = ownerNames[0]; // In single owner mode, we only have one
    console.log(`PARALLEL PATH - Processing owner: ${owner} (ID: ${ownerId})`);
    console.log(`Current progress: ${JSON.stringify(currentOwnerProgress[owner])}`);
  } else {
    console.log(`Processing batch with ${ownerNames.length} owners`);
  }
  
  // Build payload
  // Handle different eurekaDateRange formats
  let startDate, endDate;
  
  if (batchData.eurekaDateRange) {
    // Check if eurekaDateRange is a string or an object
    if (typeof batchData.eurekaDateRange === 'string') {
      // If it's a string, try to extract date range from it (format like "2023-01-01T00:00:00Z TO 2023-01-31T23:59:59Z")
      const dateRangeParts = batchData.eurekaDateRange.split(' TO ');
      if (dateRangeParts.length === 2) {
        startDate = dateRangeParts[0].replace('T00:00:00Z', '');
        endDate = dateRangeParts[1].replace('T23:59:59Z', '');
        
        // For the example where user selected July 1 to July 31 but got June 30 to July 30
        // Fix potential off-by-one errors in date ranges
        if (batchData.dateRange && batchData.dateRange.startDate && batchData.dateRange.endDate) {
          const userStartDate = batchData.dateRange.startDate;
          const userEndDate = batchData.dateRange.endDate;
          
          console.log(`Comparing dates - From eurekaDateRange: ${startDate} to ${endDate}`);
          console.log(`From dateRange object: ${userStartDate} to ${userEndDate}`);
          
          // Prefer dateRange over eurekaDateRange if they're both present but different
          if (startDate !== userStartDate || endDate !== userEndDate) {
            console.log('Found different date formats between eurekaDateRange and dateRange - using dateRange');
            startDate = userStartDate;
            endDate = userEndDate;
          }
        }
      }
    } else if (batchData.eurekaDateRange.startDate && batchData.eurekaDateRange.endDate) {
      // If it's an object with startDate and endDate properties
      startDate = batchData.eurekaDateRange.startDate;
      endDate = batchData.eurekaDateRange.endDate;
    }
  }
  
  // If still no dates and we have a dateRange object, try using that
  if ((!startDate || !endDate) && batchData.dateRange) {
    if (batchData.dateRange.startDate && batchData.dateRange.endDate) {
      startDate = batchData.dateRange.startDate;
      endDate = batchData.dateRange.endDate;
    }
  }
  
  // Log the date information for debugging
  console.log(`Date information - startDate: ${startDate}, endDate: ${endDate}`);
  console.log(`Original eurekaDateRange: ${JSON.stringify(batchData.eurekaDateRange)}`);
  
  if (!startDate || !endDate) {
    throw new Error('Missing date range information');
  }
  
  // Log pagination info
  console.log(`API Request - start: ${start}, num: ${num}, continuePagination: ${continuePagination}`);
  
  // Return the API parameters properly formatted for Eureka API
  return {
    json: {
      action: "query",
      q: "*",
      source: "corp_cases_en",
      lang: "en-us",
      search_type: "text_text",
      filter: {
        owner_full_name: ownerNames,
        status: ["Resolved", "Cancelled"],
        closed_date: [`${startDate}T00:00:00Z TO ${endDate}T23:59:59Z`]
      },
      field: ["case_id", "priority", "products", "status", "closed_date", "created_date", "owner_full_name", "title", "content"],
      start: start,
      num: num,
      parameters: {
        querytext: ownerNames.length === 1 ? 
          `DPE:"${ownerNames[0]}" AND REPORTEDON>="${startDate}" AND REPORTEDON<="${endDate}"` :
          `DPE:(${ownerNames.map(name => `"${name}"`).join(' OR ')}) AND REPORTEDON>="${startDate}" AND REPORTEDON<="${endDate}"`,
        start: start,
        num: num,
      },
      pageData: {
        ownerNames: ownerNames,
        continuePagination: continuePagination,
        currentStart: start,
        pageSize: num,
        currentOwnerProgress: currentOwnerProgress,
        eurekaDateRange: batchData.eurekaDateRange,
        dateRange: batchData.dateRange,
        entityType: batchData.entityType,
        entityName: batchData.entityName,
        processingMode: batchData.processingMode || 'STANDARD',
        parallelEnabled: batchData.parallelEnabled || false,
        singleOwnerMode: isSingleOwner,
        ownerId: ownerId,
        batchId: batchData.batchId || `batch-${Date.now()}`
      }
    }
  };
} catch (error) {
  console.error('Error in Edit Fields node:', error.message);
  console.error('batchData:', JSON.stringify(batchData));
  
  // Provide a more specific error message for troubleshooting
  let errorMessage = error.message;
  if (errorMessage.includes("Pagination Check")) {
    errorMessage = "Initial workflow run - no pagination data available yet. This is normal for the first execution.";
  }
  
  // Default date range (last 7 days) for emergency fallback
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fallbackStartDate = sevenDaysAgo.toISOString().split('T')[0];
  const fallbackEndDate = now.toISOString().split('T')[0];
  
  // Get owner names from batch data if available
  const fallbackOwnerNames = batchData && batchData.ownerNames ? batchData.ownerNames : [];
  
  return { 
    json: { 
      error: errorMessage,
      parameters: {
        querytext: fallbackOwnerNames.length > 0 ? 
          `DPE:"${fallbackOwnerNames[0]}" AND REPORTEDON>="${fallbackStartDate}" AND REPORTEDON<="${fallbackEndDate}"` :
          `REPORTEDON>="${fallbackStartDate}" AND REPORTEDON<="${fallbackEndDate}"`,
        start: 0,
        num: 30
      },
      pageData: {
        ownerNames: fallbackOwnerNames,
        continuePagination: false,
        currentStart: 0,
        pageSize: 30,
        currentOwnerProgress: {},
        eurekaDateRange: `${fallbackStartDate}T00:00:00Z TO ${fallbackEndDate}T23:59:59Z`,
        dateRange: {
          startDate: fallbackStartDate,
          endDate: fallbackEndDate
        },
        parallelEnabled: true,
        singleOwnerMode: true,
        batchId: `fallback-batch-${Date.now()}`
      }
    } 
  };
}