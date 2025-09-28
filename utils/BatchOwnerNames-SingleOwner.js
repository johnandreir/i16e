// BatchOwnerNames Node - Complete Code
// Copy this entire file into the BatchOwnerNames node
// NOTE: Maximum number of API calls is limited to 30 per execution

// Create individual batches for true parallel processing - one per owner
try {
  // Get webhook data from ProcessWebhookData node
  const webhookData = $node['ProcessWebhookData'].json.webhookData;
  
  console.log('=== PARALLEL PROCESSING: CREATING INDIVIDUAL OWNER BATCHES ===');
  console.log('Original webhook data:', JSON.stringify(webhookData, null, 2));
  
  if (!webhookData || !webhookData.ownerNames || !Array.isArray(webhookData.ownerNames)) {
    throw new Error('No owner names found in webhook data');
  }
  
  const ownerNames = webhookData.ownerNames;
  console.log(`Total owners to process in parallel: ${ownerNames.length}`);
  
  // Every owner gets its own independent path through the workflow
  console.log('Creating individual owner batches for maximum parallel processing');
  
  // Map each individual owner to its own batch
  return ownerNames.map((ownerName, index) => {
    return {
      json: {
        batchIndex: index,
        totalBatches: ownerNames.length,
        ownerNames: [ownerName], // SINGLE owner per batch - key for parallelization
        eurekaDateRange: webhookData.eurekaDateRange,
        dateRange: webhookData.dateRange,
        entityType: webhookData.entityType,
        entityName: webhookData.entityName,
        processingMode: 'FAST',       // Always fast mode
        parallelEnabled: true,        // Always parallel
        singleOwnerMode: true,        // Flag for single owner processing
        ownerId: `owner-${index}`,    // Unique owner ID
        batchId: `batch-${Date.now()}-${index}`
      }
    };
  });
} catch (error) {
  console.error('Error in parallel batch creation:', error.message);
  return [{ json: { error: error.message } }];
}