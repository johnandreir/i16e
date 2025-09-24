# Performance Data Aggregation Architecture

## Overview

Updated the performance data workflows to use a centralized aggregation approach instead of direct MongoDB saves. This prevents data conflicts and enables proper merging of metrics and satisfaction data for the same entities.

## Architecture Changes

### 1. Calculate Metrics Workflow

**Previous**: `MongoDB Insert - Save Metrics` → Direct save to `performance_data`
**Updated**: `Send Metrics Data to Aggregation Workflow` → HTTP POST to aggregation webhook

**Changes Made**:

- Replaced MongoDB node with HTTP Request node
- Endpoint: `http://localhost:5678/webhook/aggregate-performance-data`
- Headers: `X-Source-Workflow: calculate-metrics`
- Body: Complete metrics data (SCT, closed cases, sample cases, metadata)

### 2. Process Survey Workflow

**Previous**: `Save Satisfaction to Performance DB` → Direct save to `performance_data`
**Updated**: `Send Satisfaction Data to Aggregation Workflow` → HTTP POST to aggregation webhook

**Changes Made**:

- Replaced MongoDB node with HTTP Request node
- Endpoint: `http://localhost:5678/webhook/aggregate-performance-data`
- Headers: `X-Source-Workflow: process-survey`
- Body: Complete satisfaction data (CSAT/Neutral/DSAT, survey details, percentages)

### 3. New Aggregate Performance Data Workflow

**Purpose**: Centralized data aggregation and MongoDB persistence
**Trigger**: Webhook receiving data from both workflows

**Flow**:

1. **Webhook - Receive Performance Data**: Receives HTTP POST from source workflows
2. **Identify Data Source**: Determines if data is from metrics or survey workflow
3. **Check Existing Records**: Prepares MongoDB lookup for existing entity records
4. **MongoDB - Lookup Existing Records**: Finds existing records for same entity/date
5. **Aggregate Data**: Intelligently merges new data with existing records
6. **MongoDB - Save Aggregated Data**: Upserts final aggregated records to `performance_data`

## Data Merging Logic

### For Existing Records (Same entity + date):

- **Metrics Data**: Updates SCT, cases count, sample cases, metadata
- **Satisfaction Data**: Updates satisfaction score, adds CSAT/Neutral/DSAT breakdown, survey details
- **Preservation**: Maintains all existing fields while adding/updating new data

### For New Records:

- **From Metrics**: Creates record with SCT, cases data, default satisfaction (85%)
- **From Satisfaction**: Creates record with satisfaction data, default SCT/cases (0)
- **Structure**: Complete performance_data schema with all required fields

## Benefits

1. **No Data Conflicts**: Single source of truth for MongoDB operations
2. **Intelligent Merging**: Combines metrics and satisfaction for same entities
3. **Data Integrity**: Prevents overwrites, preserves historical data
4. **Scalability**: Easy to add more data sources in the future
5. **Debugging**: Centralized logging and error handling

## Data Flow Example

```
Get Cases Webhook
    ↓
    ├─ Calculate Metrics → HTTP POST →
    ├─ Process Survey → HTTP POST →     } → Aggregate Performance Data → MongoDB

Final Record:
{
  "entity_name": "John Doe",
  "entity_type": "dpe",
  "date": "2025-09-25",
  "metrics": {
    "sct": 2.5,           // From Calculate Metrics
    "cases": 15,          // From Calculate Metrics
    "satisfaction": 87,   // From Process Survey
    "customerSatisfaction": {
      "csat": 13, "neutral": 2, "dsat": 0  // From Process Survey
    }
  },
  "sample_cases": [...],  // From Calculate Metrics
  "cases_count": 15,      // From Calculate Metrics
  "created_at": "2025-09-25T10:00:00Z",
  "updated_at": "2025-09-25T10:05:00Z"
}
```

## Migration Notes

- **Parallel Execution**: Both Calculate Metrics and Process Survey still run in parallel as before
- **Same Trigger**: Get Cases webhook still triggers both workflows simultaneously
- **Enhanced Data**: Final records now contain both metrics AND satisfaction data
- **Dashboard Compatible**: Customer Satisfaction Distribution will now get real aggregated data

## Monitoring

The Aggregate Performance Data workflow provides detailed logging:

- Source workflow identification
- Data type classification (metrics/satisfaction)
- Existing record detection
- Merge operation details
- Final record summaries

This architecture ensures reliable, conflict-free data aggregation while maintaining the existing parallel workflow execution model.
