const fs = require('fs');

console.log('🔍 Debugging Workflow Configuration...\n');

try {
  // Read and parse both workflow files
  const getCasesWorkflow = JSON.parse(fs.readFileSync('Get cases.json', 'utf8'));
  const calculateMetricsWorkflow = JSON.parse(fs.readFileSync('Calculate metrics.json', 'utf8'));
  
  console.log('📄 Get Cases Workflow Analysis:');
  console.log('- Name:', getCasesWorkflow.name);
  console.log('- ID:', getCasesWorkflow.id);
  console.log('- Active:', getCasesWorkflow.active);
  console.log('- Total Nodes:', getCasesWorkflow.nodes.length);
  
  // Find the Execute Workflow node
  const executeNode = getCasesWorkflow.nodes.find(node => node.type === 'n8n-nodes-base.executeWorkflow');
  if (executeNode) {
    console.log('✅ Found Execute Workflow node:');
    console.log('  - Name:', executeNode.name);
    console.log('  - Target Workflow ID:', executeNode.parameters.workflowId);
    console.log('  - Wait for sub-workflow:', executeNode.parameters.waitForSubWorkflow);
    console.log('  - Source:', executeNode.parameters.source);
    if (executeNode.parameters.fields) {
      console.log('  - Fields to pass:', executeNode.parameters.fields.values?.length || 0);
    }
  } else {
    console.log('❌ No Execute Workflow node found in Get cases workflow');
  }
  
  console.log('\n📄 Calculate Metrics Workflow Analysis:');
  console.log('- Name:', calculateMetricsWorkflow.name);
  console.log('- ID:', calculateMetricsWorkflow.id);
  console.log('- Active:', calculateMetricsWorkflow.active);
  console.log('- Total Nodes:', calculateMetricsWorkflow.nodes.length);
  
  // Find the Execute Workflow Trigger node
  const triggerNode = calculateMetricsWorkflow.nodes.find(node => node.type === 'n8n-nodes-base.executeWorkflowTrigger');
  if (triggerNode) {
    console.log('✅ Found Execute Workflow Trigger node:');
    console.log('  - Name:', triggerNode.name);
    console.log('  - Type:', triggerNode.type);
    console.log('  - TypeVersion:', triggerNode.typeVersion);
  } else {
    console.log('❌ No Execute Workflow Trigger node found in Calculate metrics workflow');
  }
  
  // Verify workflow ID matching
  const targetWorkflowId = executeNode?.parameters?.workflowId;
  const actualWorkflowId = calculateMetricsWorkflow.id;
  
  console.log('\n🔗 Workflow ID Verification:');
  console.log('- Execute node targets:', targetWorkflowId);
  console.log('- Calculate metrics ID:', actualWorkflowId);
  console.log('- IDs match:', targetWorkflowId === actualWorkflowId ? '✅' : '❌');
  
  if (targetWorkflowId !== actualWorkflowId) {
    console.log('\n⚠️ WARNING: Workflow IDs do not match!');
    console.log('   This could cause the "Unexpected end of JSON input" error.');
    console.log('   The Execute Workflow node is trying to call a workflow that doesn\'t exist.');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Import both workflow files into N8N');
  console.log('2. Ensure both workflows are activated');
  console.log('3. If IDs don\'t match, update the Execute Workflow node with the correct ID');
  console.log('4. Test the get-cases endpoint to verify sequential execution');
  
} catch (error) {
  console.error('❌ Error analyzing workflows:', error.message);
}