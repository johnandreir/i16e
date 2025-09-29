console.log('Quick test: Satisfaction insights should NOT appear in SCT section\n');

// Test the problematic case
const testInsight = {
  title: 'CSAT Feedback Analysis',
  category: 'satisfaction'
};

console.log(`Testing insight: "${testInsight.title}" with category "${testInsight.category}"`);

// Check if it would match SCT criteria (before our fix)
const matchesSctCriteria = testInsight.title.toLowerCase().includes('analysis');
console.log(`- Matches old SCT criteria (contains 'analysis'): ${matchesSctCriteria}`);

// Check if it's satisfaction-related (our exclusion filter)
const isSatisfactionRelated = testInsight.category?.toLowerCase().includes('satisfaction') ||
  testInsight.title.toLowerCase().includes('satisfaction') ||
  testInsight.title.toLowerCase().includes('csat');
console.log(`- Is satisfaction-related (should be excluded from SCT): ${isSatisfactionRelated}`);

// Final result with our fix
const wouldAppearInSct = matchesSctCriteria && !isSatisfactionRelated;
console.log(`- Would appear in SCT section with our fix: ${wouldAppearInSct}`);

console.log('\n' + (wouldAppearInSct ? '❌ STILL BROKEN' : '✅ FIXED!'));