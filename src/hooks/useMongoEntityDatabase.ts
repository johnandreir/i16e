import { useState, useEffect } from 'react';
import { mongoEntityService, EntityData, EntityMappings, DashboardData } from '@/lib/mongoEntityService';

export const useMongoEntityDatabase = () => {
  const [entityService] = useState(() => mongoEntityService);
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

        if (dataResponse.success && dataResponse.data) {
          setEntityData(dataResponse.data);
          console.log('✅ Successfully loaded entity data from MongoDB');
        } else {
          console.error('❌ Failed to load entity data:', dataResponse.error);
          setError(`Failed to load entity data: ${dataResponse.error}`);
          setEntityData({
            teams: [],
            squads: [],
            dpes: []
          });
        }

        if (mappingsResponse.success && mappingsResponse.data) {
          setEntityMappings(mappingsResponse.data);
        } else {
          console.error('❌ Failed to load entity mappings:', mappingsResponse.error);
          setError(`Failed to load entity mappings: ${mappingsResponse.error}`);
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

      if (dataResponse.success && dataResponse.data) {
        setEntityData(dataResponse.data);
      }

      if (mappingsResponse.success && mappingsResponse.data) {
        setEntityMappings(mappingsResponse.data);
      }

      if (!dataResponse.success || !mappingsResponse.success) {
        setError('Failed to refresh data');
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
      const response = await entityService.createTeam(name, description);
      
      if (response.success) {
        await loadData();
        return true;
      } else {
        setError(response.error || 'Failed to create team');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
      return false;
    }
  };

  const updateTeam = async (id: string, name: string, description?: string) => {
    try {
      setError(null);
      const response = await entityService.updateTeam(id, name, description);
      
      if (response.success) {
        await loadData();
        return true;
      } else {
        setError(response.error || 'Failed to update team');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
      return false;
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      setError(null);
      const response = await entityService.deleteTeam(id);
      
      if (response.success) {
        await loadData();
        return true;
      } else {
        setError(response.error || 'Failed to delete team');
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
      const response = await entityService.createSquad(name, teamId, description);
      
      if (response.success) {
        await loadData();
        return true;
      } else {
        setError(response.error || 'Failed to create squad');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create squad');
      return false;
    }
  };

  const updateSquad = async (id: string, name: string, teamId: string, description?: string) => {
    try {
      setError(null);
      const response = await entityService.updateSquad(id, name, teamId, description);
      
      if (response.success) {
        await loadData();
        return true;
      } else {
        setError(response.error || 'Failed to update squad');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update squad');
      return false;
    }
  };

  const deleteSquad = async (id: string) => {
    try {
      setError(null);
      const response = await entityService.deleteSquad(id);
      
      if (response.success) {
        await loadData();
        return true;
      } else {
        setError(response.error || 'Failed to delete squad');
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
      const response = await entityService.createDPE(name, squadId, email, role);
      
      if (response.success) {
        await loadData();
        return true;
      } else {
        setError(response.error || 'Failed to create DPE');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create DPE');
      return false;
    }
  };

  const updateDPE = async (id: string, name: string, squadId: string, email?: string, role?: string) => {
    try {
      setError(null);
      const response = await entityService.updateDPE(id, name, squadId, email, role);
      
      if (response.success) {
        await loadData();
        return true;
      } else {
        setError(response.error || 'Failed to update DPE');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update DPE');
      return false;
    }
  };

  const deleteDPE = async (id: string) => {
    try {
      setError(null);
      const response = await entityService.deleteDPE(id);
      
      if (response.success) {
        await loadData();
        return true;
      } else {
        setError(response.error || 'Failed to delete DPE');
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
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to get dashboard data');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get dashboard data');
      return null;
    }
  };

  const addPerformanceMetrics = async (entityId: string, entityType: 'team' | 'squad' | 'dpe', date: Date, metrics: { sct: number, cases: number, satisfaction: number }) => {
    try {
      setError(null);
      const response = await entityService.createPerformanceData(entityId, entityType, date, metrics);
      
      if (response.success) {
        return true;
      } else {
        setError(response.error || 'Failed to add performance metrics');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add performance metrics');
      return false;
    }
  };

  const getPerformanceHistory = async (entityType: string, entityId: string, startDate?: string, endDate?: string) => {
    try {
      setError(null);
      const response = await entityService.getPerformanceData(entityType, entityId, startDate, endDate);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to get performance history');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get performance history');
      return [];
    }
  };

  const validateEntityRelationships = async () => {
    try {
      setError(null);
      const response = await entityService.validateEntityRelationships();
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to validate relationships');
        return { valid: false, issues: ['Validation failed'] };
      }
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