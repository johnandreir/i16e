// Test insight categorization logic
console.log('Testing InsightsPanel categorization logic...\n');

const testInsights = [
  {
    id: '1',
    title: 'CSAT Feedback Analysis',
    description: 'Customer satisfaction feedback analysis results',
    category: 'satisfaction',
    type: 'info'
  },
  {
    id: '2', 
    title: 'Customer Satisfaction Analysis',
    description: 'Overall customer satisfaction analysis',
    category: 'satisfaction',
    type: 'success'
  },
  {
    id: '3',
    title: 'SCT Analysis Complete',
    description: 'Solution Cycle Time analysis finished',
    category: 'performance',
    type: 'info'
  },
  {
    id: '4',
    title: 'Email Communication Analysis',
    description: 'Email communication patterns analyzed',
    category: 'communication', 
    type: 'warning'
  },
  {
    id: '5',
    title: 'Process Delay Analysis',
    description: 'Process delays identified',
    category: 'process',
    type: 'warning'
  }
];

console.log('Input insights:');
testInsights.forEach(insight => {
  console.log(`- ${insight.title} (category: ${insight.category})`);
});

// Simulate the filtering logic
const sctInsights = testInsights.filter(insight => {
  const isSctRelated = insight.category?.toLowerCase().includes('performance') || 
    insight.category?.toLowerCase().includes('process') ||
    insight.category?.toLowerCase().includes('communication') ||
    insight.category?.toLowerCase().includes('trending') ||
    insight.category?.toLowerCase().includes('resource') ||
    insight.title.toLowerCase().includes('sct') ||
    insight.title.toLowerCase().includes('cycle time') ||
    insight.title.toLowerCase().includes('development') ||
    insight.title.toLowerCase().includes('testing') ||
    insight.title.toLowerCase().includes('sct analysis') ||
    insight.title.toLowerCase().includes('email communication') ||
    insight.title.toLowerCase().includes('process delay') ||
    insight.title.toLowerCase().includes('email') ||
    insight.title.toLowerCase().includes('delay');
  
  // Exclude satisfaction-related insights that should go to CX section
  const isSatisfactionRelated = insight.category?.toLowerCase().includes('satisfaction') ||
    insight.title.toLowerCase().includes('satisfaction') ||
    insight.title.toLowerCase().includes('csat') ||
    insight.title.toLowerCase().includes('dsat');
  
  return isSctRelated && !isSatisfactionRelated;
});

const cxInsights = testInsights.filter(insight => 
  insight.category?.toLowerCase().includes('satisfaction') ||
  insight.category?.toLowerCase().includes('feedback') ||
  insight.category?.toLowerCase().includes('customer') ||
  insight.category?.toLowerCase().includes('channel') ||
  insight.category?.toLowerCase().includes('efficiency') ||
  insight.category?.toLowerCase().includes('loyalty') ||
  insight.title.toLowerCase().includes('customer') ||
  insight.title.toLowerCase().includes('satisfaction') ||
  insight.title.toLowerCase().includes('csat') ||
  insight.title.toLowerCase().includes('dsat') ||
  insight.title.toLowerCase().includes('cx') ||
  insight.title.toLowerCase().includes('feedback')
);

console.log('\n--- FILTERING RESULTS ---');
console.log('\nSCT Insights (Solution Cycle Time section):');
if (sctInsights.length === 0) {
  console.log('  (none)');
} else {
  sctInsights.forEach(insight => {
    console.log(`  ✓ ${insight.title} (category: ${insight.category})`);
  });
}

console.log('\nCX Insights (Customer Satisfaction section):');
if (cxInsights.length === 0) {
  console.log('  (none)');
} else {
  cxInsights.forEach(insight => {
    console.log(`  ✓ ${insight.title} (category: ${insight.category})`);
  });
}

console.log('\n--- VALIDATION ---');
const satisfactionInSct = sctInsights.filter(insight => 
  insight.title.toLowerCase().includes('satisfaction') ||
  insight.title.toLowerCase().includes('csat')
);

if (satisfactionInSct.length === 0) {
  console.log('✅ SUCCESS: No satisfaction insights in SCT section');
} else {
  console.log('❌ PROBLEM: Satisfaction insights still in SCT section:');
  satisfactionInSct.forEach(insight => {
    console.log(`   - ${insight.title}`);
  });
}

const satisfactionInCx = cxInsights.filter(insight => 
  insight.title.toLowerCase().includes('satisfaction') ||
  insight.title.toLowerCase().includes('csat')
);

if (satisfactionInCx.length > 0) {
  console.log('✅ SUCCESS: Satisfaction insights properly in CX section');
} else {
  console.log('❌ PROBLEM: No satisfaction insights found in CX section');
}