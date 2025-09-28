import { useState, useEffect } from 'react';
import EntityService, { EntityData, EntityMappings, DashboardData } from '@/lib/entityService';

export const useMongoEntityDatabase = () => {
  const [entityService] = useState(() => new EntityService());
  const [entityData, setEntityData] = useState<EntityData>({
    teams: ['Add New Team...'],
    squads: ['Add New Squad...'],
    dpes: ['Add New DPE...']
  });
  const [entityMappings, setEntityMappings] = useState<EntityMappings>({
    dpeToSquad: {},
    squadToTeam: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAndLoad = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load entity data and mappings
        const dataResponse = await entityService.getEntityData();
        const mappingsResponse = await entityService.getEntityMappings();

        if (dataResponse) {
          setEntityData(dataResponse);
        } else {
          setEntityData({
            teams: [],
            squads: [],
            dpes: []
          });
        }

        if (mappingsResponse) {
          setEntityMappings(mappingsResponse);
        } else {
          setEntityMappings({
            dpeToSquad: {},
            squadToTeam: {}
          });
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect to MongoDB';
        setError(`MongoDB Connection Error: ${errorMessage}`);
        console.error('❌ Failed to load entity data:', err);
        
        // Reset entity data to show no data available instead of fallback data
        setEntityData({
          teams: [],
          squads: [],
          dpes: []
        });
        setEntityMappings({
          dpeToSquad: {},
          squadToTeam: {}
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndLoad();
  }, [entityService]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dataResponse = await entityService.getEntityData();
      const mappingsResponse = await entityService.getEntityMappings();

      if (dataResponse) {
        setEntityData(dataResponse);
      }

      if (mappingsResponse) {
        setEntityMappings(mappingsResponse);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const addTeam = async (name: string, description?: string) => {
    try {
      setError(null);
      const response = await entityService.createTeam(name);
      
      await loadData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
      return false;
    }
  };

  const updateTeam = async (id: string, name: string, description?: string) => {
    try {
      setError(null);
      const numId = parseInt(id, 10);
      const response = await entityService.updateTeam(numId, name);
      
      await loadData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
      return false;
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      setError(null);
      const numId = parseInt(id, 10);
      const success = await entityService.deleteTeam(numId);
      
      if (success) {
        await loadData();
        return true;
      } else {
        setError('Failed to delete team');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
      return false;
    }
  };

  const addSquad = async (name: string, teamId: string, description?: string) => {
    try {
      setError(null);
      // For now, use teamId as teamName since EntityData only contains string arrays
      const response = await entityService.createSquad(name, teamId);
      
      await loadData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create squad');
      return false;
    }
  };

  const updateSquad = async (id: string, name: string, teamId: string, description?: string) => {
    try {
      setError(null);
      const numId = parseInt(id, 10);
      
      // Validate inputs
      if (!name || name.trim() === '') {
        setError('Squad name cannot be empty');
        return { success: false, error: 'Squad name cannot be empty' };
      }
      
      if (!teamId) {
        setError('Team selection is required');
        return { success: false, error: 'Team selection is required' };
      }
      
      // For now, use teamId as teamName since EntityData only contains string arrays
      const response = await entityService.updateSquad(numId, name, teamId);
      
      await loadData();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update squad';
      console.error('Squad update error:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteSquad = async (id: string) => {
    try {
      setError(null);
      const numId = parseInt(id, 10);
      const success = await entityService.deleteSquad(numId);
      
      if (success) {
        await loadData();
        return true;
      } else {
        setError('Failed to delete squad');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete squad');
      return false;
    }
  };

  const addDPE = async (name: string, squadId: string, email?: string, role?: string) => {
    try {
      setError(null);
      // For now, use squadId as squadName since EntityData only contains string arrays
      const response = await entityService.createDPE(name, squadId);
      
      await loadData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create DPE');
      return false;
    }
  };

  const updateDPE = async (id: string, name: string, squadId: string, email?: string, role?: string) => {
    try {
      setError(null);
      const numId = parseInt(id, 10);
      
      // Validate inputs
      if (!name || name.trim() === '') {
        setError('DPE name cannot be empty');
        return { success: false, error: 'DPE name cannot be empty' };
      }
      
      if (!squadId) {
        setError('Squad selection is required');
        return { success: false, error: 'Squad selection is required' };
      }
      
      // For now, use squadId as squadName since EntityData only contains string arrays
      const response = await entityService.updateDPE(numId, name, squadId);
      
      await loadData();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update DPE';
      console.error('DPE update error:', err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteDPE = async (id: string) => {
    try {
      setError(null);
      const numId = parseInt(id, 10);
      const success = await entityService.deleteDPE(numId);
      
      if (success) {
        await loadData();
        return true;
      } else {
        setError('Failed to delete DPE');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete DPE');
      return false;
    }
  };

  const getDashboardData = async (entityType: string, entityValue: string, startDate?: string, endDate?: string): Promise<DashboardData | null> => {
    try {
      setError(null);
      const response = await entityService.getDashboardData(entityType, entityValue, startDate, endDate);
      
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get dashboard data');
      return null;
    }
  };

  const addPerformanceMetrics = async (entityId: string, entityType: 'team' | 'squad' | 'dpe', date: Date, metrics: { sct: number, cases: number, satisfaction: number }) => {
    try {
      setError(null);
      setError('Performance metrics not implemented yet');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add performance metrics');
      return false;
    }
  };

  const getPerformanceHistory = async (entityType: string, entityId: string, startDate?: string, endDate?: string) => {
    try {
      setError(null);
      setError('Performance history not implemented yet');
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get performance history');
      return [];
    }
  };

  const validateEntityRelationships = async () => {
    try {
      setError(null);
      setError('Entity relationship validation not implemented yet');
      return { valid: false, issues: ['Validation not implemented'] };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate relationships');
      return { valid: false, issues: ['Validation failed'] };
    }
  };

  const validateDatabase = async () => {
    // Use the actual service validation method
    return await validateEntityRelationships();
  };

  const exportData = () => {
    return {
      entityData,
      entityMappings,
      exportedAt: new Date().toISOString()
    };
  };

  const importData = async (data: any) => {
    try {
      setError(null);
      if (data.entityData && data.entityMappings) {
        setEntityData(data.entityData);
        setEntityMappings(data.entityMappings);
        return true;
      }
      throw new Error('Invalid data format');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data');
      return false;
    }
  };

  // Debug utilities
  const debug = {
    entityData,
    entityMappings,
    loadData,
    exportData,
    importData
  };

  return {
    // Data
    entityData,
    entityMappings,
    isLoading,
    error,
    
    // Core operations
    loadData,
    addTeam,
    updateTeam,
    deleteTeam,
    addSquad,
    updateSquad,
    deleteSquad,
    addDPE,
    updateDPE,
    deleteDPE,
    
    // Dashboard
    getDashboardData,
    addPerformanceMetrics,
    getPerformanceHistory,
    
    // Utilities
    validateDatabase,
    validateEntityRelationships,
    exportData,
    importData,
    debug
  };
};