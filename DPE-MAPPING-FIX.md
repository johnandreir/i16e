From the bug analysis, the issue is:

1. When selecting a squad or team and generating a report, the code looks for squad/team names in performance data
2. But performance data only contains DPE names, not squad/team names
3. This causes all squads in a team to show the same aggregated metrics instead of their individual metrics

The fix requires 2 changes:

## ✅ Change 1: Fixed team data aggregation in the chart display

**File**: `src/pages/IndexNew.tsx`
**Location**: Around line 1774-1790 in the team data mapping section
**Status**: ✅ COMPLETED

The fix changes the team data aggregation to properly calculate squad metrics by:

1. Getting all DPEs for each squad
2. Finding performance data for each DPE
3. Aggregating the DPE metrics to calculate proper squad-level metrics
4. Showing unique, accurate data for each squad in the team

## ✅ Change 2: Fixed n8n "Prepare Entity Data" node to process all DPEs

**File**: `Get cases.json`
**Location**: "Prepare Entity Data" node (line ~360)
**Status**: ✅ COMPLETED

**Problem**: The n8n workflow was only processing the first DPE (`ownerNames[0]`) when a squad or team was selected, instead of processing all DPEs in the squad/team.

**Solution**: Modified the "Prepare Entity Data" node to:

### Before (Incorrect):

```javascript
// Only took the first DPE
entityValue = webhookData.ownerNames[0];

// Created single output
const executeData = { entityValue: entityValue, ... };
return [{ json: executeData }];
```

### After (Fixed):

```javascript
// Takes ALL DPEs
entityValues = webhookData.ownerNames; // Full array

// Creates multiple outputs, one for each DPE
const executeDataArray = entityValues.map((entityValue, index) => {
  return {
    entityValue: entityValue,
    owner_full_name: entityValue,
    entityIndex: index,
    totalEntities: entityValues.length,
    entityType: webhookData.entityType,
    entityName: webhookData.entityName,
    // ... other metadata
  };
});

// Returns multiple items for multiple workflow executions
return executeDataArray.map((data) => ({ json: data }));
```

### What This Accomplishes:

1. **Multiple Workflow Executions**: When a squad/team is selected, the "Calculate metrics" workflow will now execute once for **each DPE** in the squad/team, instead of just once for the first DPE.

2. **Complete Data Coverage**: All DPEs in a squad/team will have their metrics calculated and stored in the performance_data collection.

3. **Proper Aggregation**: The frontend can now aggregate the complete set of DPE metrics to show accurate squad/team performance.

### Expected Behavior:

- **Squad Selection**: If "Frontend Squad" has 3 DPEs (John, Jane, Bob), the workflow will execute 3 times, calculating metrics for all 3 DPEs.
- **Team Selection**: If "Development Team" has 2 squads with 5 total DPEs, the workflow will execute 5 times, calculating metrics for all 5 DPEs.
- **Individual DPE**: Still works as before - single execution for the selected DPE.

## 🎯 Combined Impact

With both fixes:

1. ✅ n8n properly processes all DPEs (not just the first one)
2. ✅ Frontend properly aggregates DPE data per squad
3. ✅ Each squad in a team shows its actual unique metrics
4. ✅ No more identical fallback data across squads

## 🧪 Testing

To test the fix:

1. Select a squad or team with multiple DPEs
2. Generate a report
3. Verify that n8n executes the "Calculate metrics" workflow multiple times (once per DPE)
4. Check that each squad shows different, accurate aggregated metrics in the dashboard
