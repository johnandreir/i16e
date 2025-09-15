import { useState, useEffect } from 'react';
import EntityService, { EntityData, EntityMappings, DashboardData } from '@/lib/entityService';

export const useEntityDatabase = () => {
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
        
        const data = await entityService.getEntityData();
        const mappings = await entityService.getEntityMappings();
        
        setEntityData(data);
        setEntityMappings(mappings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entity data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAndLoad();
  }, []);

  const loadEntityData = async () => {
    try {
      setError(null);
      const data = await entityService.getEntityData();
      const mappings = await entityService.getEntityMappings();
      setEntityData(data);
      setEntityMappings(mappings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reload entity data');
    }
  };

  const createTeam = async (name: string, description?: string) => {
    try {
      setError(null);
      await entityService.createTeam(name, description);
      await loadEntityData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
      return false;
    }
  };

  const updateTeam = async (id: number, name: string, description?: string) => {
    try {
      setError(null);
      await entityService.updateTeam(id, name, description);
      await loadEntityData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
      return false;
    }
  };

  const deleteTeam = async (id: number) => {
    try {
      setError(null);
      const success = await entityService.deleteTeam(id);
      if (success) {
        await loadEntityData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
      return false;
    }
  };

  const createSquad = async (name: string, teamName: string, description?: string) => {
    try {
      setError(null);
      await entityService.createSquad(name, teamName, description);
      await loadEntityData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create squad');
      return false;
    }
  };

  const updateSquad = async (id: number, name: string, teamName: string, description?: string) => {
    try {
      setError(null);
      await entityService.updateSquad(id, name, teamName, description);
      await loadEntityData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update squad');
      return false;
    }
  };

  const deleteSquad = async (id: number) => {
    try {
      setError(null);
      const success = await entityService.deleteSquad(id);
      if (success) {
        await loadEntityData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete squad');
      return false;
    }
  };

  const createDPE = async (name: string, squadName: string, email?: string) => {
    try {
      setError(null);
      await entityService.createDPE(name, squadName, email);
      await loadEntityData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create DPE');
      return false;
    }
  };

  const updateDPE = async (id: number, name: string, squadName: string, email?: string) => {
    try {
      setError(null);
      await entityService.updateDPE(id, name, squadName, email);
      await loadEntityData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update DPE');
      return false;
    }
  };

  const deleteDPE = async (id: number) => {
    try {
      setError(null);
      const success = await entityService.deleteDPE(id);
      if (success) {
        await loadEntityData();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete DPE');
      return false;
    }
  };

  const getDashboardData = async (entityType: string, entityValue: string, startDate?: string, endDate?: string): Promise<DashboardData | null> => {
    try {
      setError(null);
      return await entityService.getDashboardData(entityType, entityValue, startDate, endDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get dashboard data');
      return null;
    }
  };

  const addPerformanceMetrics = async (dpeName: string, sct: number, cases: number, satisfaction: number, startDate: string, endDate: string) => {
    try {
      setError(null);
      await entityService.addPerformanceMetrics(dpeName, sct, cases, satisfaction, startDate, endDate);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add performance metrics');
      return false;
    }
  };

  const getPerformanceHistory = async (dpeName: string, startDate?: string, endDate?: string) => {
    try {
      setError(null);
      return await entityService.getPerformanceHistory(dpeName, startDate, endDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get performance history');
      return [];
    }
  };

  const migrateLegacyData = async (entityData: EntityData, entityMappings: EntityMappings) => {
    try {
      setError(null);
      await entityService.migrateLegacyData(entityData, entityMappings);
      await loadEntityData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to migrate legacy data');
      return false;
    }
  };

  const regenerateSampleData = async () => {
    try {
      setError(null);
      await entityService.regenerateSampleData();
      await loadEntityData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate sample data');
      return false;
    }
  };

  return {
    // Data
    entityData,
    entityMappings,
    isLoading,
    error,
    
    // Operations
    refreshData: loadEntityData,
    
    // Team operations
    createTeam,
    updateTeam,
    deleteTeam,
    
    // Squad operations
    createSquad,
    updateSquad,
    deleteSquad,
    
    // DPE operations
    createDPE,
    updateDPE,
    deleteDPE,
    
    // Dashboard operations
    getDashboardData,
    
    // Performance operations
    addPerformanceMetrics,
    getPerformanceHistory,
    
    // Migration and sample data
    migrateLegacyData,
    regenerateSampleData,
    
    // Debug and utilities
    debugDatabaseContents: () => entityService.debugDatabaseContents(),
    
    // Get entities with database IDs for management
    getTeamsWithIds: () => entityService.getTeamsWithIds(),
    getSquadsWithIds: () => entityService.getSquadsWithIds(),
    getDPEsWithIds: () => entityService.getDPEsWithIds()
  };
};

export default useEntityDatabase;