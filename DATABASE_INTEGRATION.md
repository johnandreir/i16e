# Entity Database Integration Guide

## Overview
This database solution provides persistent storage for your entity management system with proper relationships between Teams, Squads, DPEs, and Performance Metrics.

## Database Structure

### Tables
1. **Teams** - Top-level organizational units
2. **Squads** - Groups within teams
3. **DPEs** - Individual team members within squads
4. **Performance Metrics** - Performance data for each DPE over time

### Relationships
- Teams → Squads (One-to-Many)
- Squads → DPEs (One-to-Many)
- DPEs → Performance Metrics (One-to-Many)

## Files Created

1. **`src/lib/browserDatabase.ts`** - IndexedDB implementation for browser storage
2. **`src/lib/entityService.ts`** - Service layer for entity operations
3. **`src/hooks/useEntityDatabase.ts`** - React hook for database operations

## Integration Steps

### Step 1: Update Your Index.tsx Component

Replace the existing state management with the database hook:

```tsx
// Add this import
import { useEntityDatabase } from '@/hooks/useEntityDatabase';

// Replace existing state with this hook
const {
  entityData,
  entityMappings,
  isLoading: dbLoading,
  error: dbError,
  getDashboardData,
  migrateLegacyData
} = useEntityDatabase();

// In useEffect, migrate existing data
useEffect(() => {
  const legacyEntityData = {
    dpe: ['Juan Dela Cruz', 'Maria Santos', /* ... existing data ... */],
    squad: ['Alpha Squad', 'Beta Squad', /* ... existing data ... */],
    team: ['Platform Engineering', 'DevOps Infrastructure', /* ... existing data ... */]
  };
  
  const legacyEntityMappings = {
    dpeToSquad: {
      'Juan Dela Cruz': 'Alpha Squad',
      // ... existing mappings ...
    },
    squadToTeam: {
      'Alpha Squad': 'Platform Engineering',
      // ... existing mappings ...
    }
  };
  
  migrateLegacyData(legacyEntityData, legacyEntityMappings);
}, []);
```

### Step 2: Update Data Loading

Replace the current data generation with database queries:

```tsx
// Replace getPerformanceData function
const getPerformanceData = async () => {
  if (!reportGenerated || !generatedEntityValue) {
    return [];
  }

  const dashboardData = await getDashboardData(
    generatedEntity,
    generatedEntityValue,
    generatedTimeRange.from?.toISOString().split('T')[0],
    generatedTimeRange.to?.toISOString().split('T')[0]
  );

  return dashboardData?.performanceData || [];
};
```

### Step 3: Update Entity Management

Replace the current entity handlers with database operations:

```tsx
const handleEntityDataChange = async (entityType: string, data: string[]) => {
  // Use the database hook operations instead of setState
  // Example for adding new entities:
  if (entityType === 'team' && data.includes('New Team Name')) {
    await createTeam('New Team Name');
  }
  // Similar for squads and DPEs
};
```

## Database Operations

### Basic CRUD Operations

```tsx
// Teams
await createTeam('New Team', 'Description');
await updateTeam(1, 'Updated Team', 'New Description');
await deleteTeam(1);

// Squads
await createSquad('New Squad', 'Team Name', 'Description');
await updateSquad(1, 'Updated Squad', 'Team Name', 'New Description');
await deleteSquad(1);

// DPEs
await createDPE('New DPE', 'Squad Name', 'email@example.com');
await updateDPE(1, 'Updated DPE', 'Squad Name', 'newemail@example.com');
await deleteDPE(1);

// Performance Metrics
await addPerformanceMetrics('DPE Name', 15, 40, 85, '2024-09-01', '2024-09-30');
const history = await getPerformanceHistory('DPE Name', '2024-08-01', '2024-09-30');
```

### Dashboard Data

```tsx
// Get dashboard data for any entity
const dashboardData = await getDashboardData('dpe', 'Juan Dela Cruz', '2024-08-01', '2024-08-31');
const dashboardData = await getDashboardData('squad', 'Alpha Squad', '2024-08-01', '2024-08-31');
const dashboardData = await getDashboardData('team', 'Platform Engineering', '2024-08-01', '2024-08-31');
```

## Benefits

1. **Persistent Storage** - Data survives browser refreshes and sessions
2. **Proper Relationships** - Enforced foreign key relationships
3. **Performance Tracking** - Historical performance data over time
4. **Scalable** - Can handle large amounts of data efficiently
5. **Browser Compatible** - Uses IndexedDB, works in all modern browsers
6. **Type Safe** - Full TypeScript support

## Error Handling

The hook provides error states:

```tsx
if (dbError) {
  toast({
    title: "Database Error",
    description: dbError,
    variant: "destructive"
  });
}
```

## Migration

The system includes a migration utility to convert your existing in-memory data to the database format. This runs automatically on first load.

## Future Enhancements

1. **Export/Import** - Add functionality to export data to JSON/CSV
2. **Backup/Restore** - Implement backup mechanisms
3. **Data Validation** - Add more robust validation rules
4. **Search/Filtering** - Add advanced search capabilities
5. **Audit Trail** - Track changes over time
6. **Real-time Sync** - Add real-time synchronization between tabs

## Usage Notes

- The database initializes automatically when the hook is first used
- All operations are asynchronous and return Promises
- The database uses IndexedDB which has good browser support
- Data is stored locally in the user's browser
- For production use, consider adding server-side synchronization
