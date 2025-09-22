// MongoDB-backed Entity Service
// This service provides CRUD operations for entities using the MongoDB API

export interface Team {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Squad {
  id: number;
  name: string;
  teamID: number;
  created_at: string;
  updated_at: string;
}

export interface DPE {
  id: number;
  name: string;
  squadID: number;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetric {
  id: number;
  dpeId: number;
  sct: number;
  cases: number;
  satisfaction: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface EntityData {
  teams: string[];
  squads: string[];
  dpes: string[];
}

export interface EntityMappings {
  dpeToSquad: Record<string, string>;
  squadToTeam: Record<string, string>;
}

export interface DashboardData {
  entityData: EntityData;
  entityMappings: EntityMappings;
  performanceData: Array<{
    name: string;
    sct: number;
    cases: number;
    satisfaction: number;
  }>;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MongoTeam {
  _id?: string;
  id?: string; // API returns id instead of _id
  name: string;
  created_at?: Date | string; // API returns dates as strings
  updated_at?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface MongoSquad {
  _id?: string;
  id?: string; // API returns id instead of _id
  name: string;
  teamID?: string;
  teamId?: string;
  team_id?: string;
  created_at?: Date | string; // API returns dates as strings
  updated_at?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface MongoDPE {
  _id?: string;
  id?: string; // API returns id instead of _id
  name: string;
  squadID?: string;
  squadId?: string;
  squad_id?: string;
  created_at?: Date | string; // API returns dates as strings
  updated_at?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

class EntityService {
  private baseUrl = 'http://localhost:3001/api';

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ServiceResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // CRUD operations for Teams
  async createTeam(name: string): Promise<Team> {
    const result = await this.request<MongoTeam>('/team', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() })
    });
    
    if (!result.success) {
      // Handle duplicate team error specifically
      if (result.error?.includes('already exists') || result.error?.includes('duplicate') || result.error?.includes('Team name already exists')) {
        throw new Error(`Team "${name.trim()}" already exists. Please choose a different name.`);
      }
      throw new Error(result.error || 'Failed to create team');
    }
    
    if (!result.data) {
      throw new Error('Failed to create team - no data returned');
    }
    
    return {
      id: this.mongoIdToNumber(result.data.id || result.data._id!),
      name: result.data.name,
      created_at: this.toISOStringSafe(result.data.created_at || result.data.createdAt),
      updated_at: this.toISOStringSafe(result.data.updated_at || result.data.updatedAt)
    };
  }

  async getTeamsWithIds(): Promise<Team[]> {
    const result = await this.request<MongoTeam[]>('/team');
    if (!result.success || !result.data) {
      return [];
    }
    
    return result.data.map(team => ({
      id: this.mongoIdToNumber(team.id || team._id!),
      name: team.name,
      created_at: this.toISOStringSafe(team.created_at || team.createdAt),
      updated_at: this.toISOStringSafe(team.updated_at || team.updatedAt)
    }));
  }

  async updateTeam(id: number, name: string): Promise<Team> {
    // Since we can't convert back from number to MongoDB ID easily,
    // we'll need to get all teams and find the matching one
    const teams = await this.request<MongoTeam[]>('/team');
    if (!teams.success || !teams.data) {
      throw new Error('Failed to get teams for update');
    }
    
    const team = teams.data.find(t => this.mongoIdToNumber(t.id || t._id!) === id);
    if (!team) {
      throw new Error('Team not found');
    }
    
    const teamId = team.id || team._id;
    if (!teamId) {
      throw new Error('Team ID not available');
    }
    
    const result = await this.request<MongoTeam>(`/team/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: name.trim() })
    });
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update team');
    }
    
    return {
      id: this.mongoIdToNumber(result.data.id || result.data._id!),
      name: result.data.name,
      created_at: this.toISOStringSafe(result.data.created_at),
      updated_at: this.toISOStringSafe(result.data.updated_at)
    };
  }

  async deleteTeam(id: number): Promise<boolean> {
    try {
      const teams = await this.request<MongoTeam[]>('/team');
      if (!teams.success || !teams.data) {
        throw new Error('Failed to get teams for deletion');
      }
      
      const team = teams.data.find(t => this.mongoIdToNumber(t.id || t._id!) === id);
      if (!team) {
        throw new Error('Team not found');
      }
      
      const teamId = team.id || team._id;
      if (!teamId) {
        throw new Error('Team ID not available');
      }
      
      const result = await this.request<void>(`/team/${teamId}`, { method: 'DELETE' });
      return result.success;
    } catch (error) {
      console.error('Error deleting team:', error);
      return false;
    }
  }

  // CRUD operations for Squads
  async createSquad(name: string, teamName: string): Promise<Squad> {
    // First find the team by name to get its ID
    const teams = await this.request<MongoTeam[]>('/team');
    if (!teams.success || !teams.data) {
      throw new Error('Failed to get teams');
    }
    
    const team = teams.data.find(t => t.name === teamName);
    if (!team) {
      throw new Error(`Team '${teamName}' not found`);
    }

    const teamId = team.id || team._id;
    if (!teamId) {
      throw new Error('Team ID not available');
    }

    const result = await this.request<MongoSquad>('/squad', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), teamID: teamId })
    });
    
    if (!result.success) {
      // Handle duplicate squad error specifically
      if (result.error?.includes('already exists') || result.error?.includes('duplicate') || result.error?.includes('Squad name already exists')) {
        throw new Error(`Squad "${name.trim()}" already exists. Please choose a different name.`);
      }
      throw new Error(result.error || 'Failed to create squad');
    }
    
    if (!result.data) {
      throw new Error('Failed to create squad - no data returned');
    }
    
    return {
      id: this.mongoIdToNumber(result.data.id || result.data._id!),
      name: result.data.name,
      teamID: this.mongoIdToNumber(result.data.teamID || result.data.teamId || result.data.team_id!),
      created_at: this.toISOStringSafe(result.data.created_at || result.data.createdAt),
      updated_at: this.toISOStringSafe(result.data.updated_at || result.data.updatedAt)
    };
  }

  async getSquadsWithIds(): Promise<Squad[]> {
    const result = await this.request<MongoSquad[]>('/squad');
    if (!result.success || !result.data) {
      return [];
    }
    
    return result.data.map(squad => ({
      id: this.mongoIdToNumber(squad.id || squad._id!),
      name: squad.name,
      teamID: this.mongoIdToNumber(squad.teamID || squad.teamId || squad.team_id!),
      created_at: this.toISOStringSafe(squad.created_at || squad.createdAt),
      updated_at: this.toISOStringSafe(squad.updated_at || squad.updatedAt)
    }));
  }

  async updateSquad(id: number, name: string, teamName: string): Promise<Squad> {
    // Find the team first
    const teams = await this.request<MongoTeam[]>('/team');
    if (!teams.success || !teams.data) {
      throw new Error('Failed to get teams');
    }
    
    const team = teams.data.find(t => t.name === teamName);
    if (!team) {
      throw new Error(`Team '${teamName}' not found`);
    }

    const teamId = team.id || team._id;
    if (!teamId) {
      throw new Error('Team ID not available');
    }

    // Find the squad to update
    const squads = await this.request<MongoSquad[]>('/squad');
    if (!squads.success || !squads.data) {
      throw new Error('Failed to get squads for update');
    }
    
    const squad = squads.data.find(s => this.mongoIdToNumber(s.id || s._id!) === id);
    if (!squad) {
      throw new Error('Squad not found');
    }
    
    const squadId = squad.id || squad._id;
    if (!squadId) {
      throw new Error('Squad ID not available');
    }
    
    const result = await this.request<MongoSquad>(`/squad/${squadId}`, {
      method: 'PUT',
      body: JSON.stringify({ 
        name: name.trim(), 
        teamID: teamId,
        updated_at: new Date()
      })
    });
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update squad');
    }
    
    return {
      id: this.mongoIdToNumber(result.data.id || result.data._id!),
      name: result.data.name,
      teamID: this.mongoIdToNumber(result.data.teamID || result.data.teamId || result.data.team_id!),
      created_at: this.toISOStringSafe(result.data.created_at || result.data.createdAt),
      updated_at: this.toISOStringSafe(result.data.updated_at || result.data.updatedAt)
    };
  }

  async deleteSquad(id: number): Promise<boolean> {
    try {
      const squads = await this.request<MongoSquad[]>('/squad');
      if (!squads.success || !squads.data) {
        throw new Error('Failed to get squads for deletion');
      }
      
      const squad = squads.data.find(s => this.mongoIdToNumber(s.id || s._id!) === id);
      if (!squad) {
        throw new Error('Squad not found');
      }
      
      const squadId = squad.id || squad._id;
      if (!squadId) {
        throw new Error('Squad ID not available');
      }
      
      const result = await this.request<void>(`/squad/${squadId}`, { method: 'DELETE' });
      return result.success;
    } catch (error) {
      console.error('Error deleting squad:', error);
      return false;
    }
  }

  // CRUD operations for DPEs
  async createDPE(name: string, squadName: string): Promise<DPE> {
    // First find the squad by name to get its ID
    const squads = await this.request<MongoSquad[]>('/squad');
    if (!squads.success || !squads.data) {
      throw new Error('Failed to get squads');
    }
    
    const squad = squads.data.find(s => s.name === squadName);
    if (!squad) {
      throw new Error(`Squad '${squadName}' not found`);
    }

    const squadId = squad.id || squad._id;
    if (!squadId) {
      throw new Error('Squad ID not available');
    }

    const result = await this.request<MongoDPE>('/dpe', {
      method: 'POST',
      body: JSON.stringify({ 
        name: name.trim(), 
        squadID: squadId,
        created_at: new Date(),
        updated_at: new Date()
      })
    });
    
    if (!result.success) {
      // Handle duplicate DPE error specifically
      if (result.error?.includes('already exists') || result.error?.includes('duplicate') || result.error?.includes('DPE name already exists')) {
        throw new Error(`DPE "${name.trim()}" already exists. Please choose a different name.`);
      }
      throw new Error(result.error || 'Failed to create DPE');
    }
    
    if (!result.data) {
      throw new Error('Failed to create DPE - no data returned');
    }
    
    return {
      id: this.mongoIdToNumber(result.data.id || result.data._id!),
      name: result.data.name,
      squadID: this.mongoIdToNumber(result.data.squadID || result.data.squadId || result.data.squad_id!),
      created_at: this.toISOStringSafe(result.data.created_at || result.data.createdAt),
      updated_at: this.toISOStringSafe(result.data.updated_at || result.data.updatedAt)
    };
  }

  async getDPEsWithIds(): Promise<DPE[]> {
    const result = await this.request<MongoDPE[]>('/dpe');
    if (!result.success || !result.data) {
      return [];
    }
    
    return result.data.map(dpe => ({
      id: this.mongoIdToNumber(dpe.id || dpe._id!),
      name: dpe.name,
      squadID: this.mongoIdToNumber(dpe.squadID || dpe.squadId || dpe.squad_id!),
      created_at: this.toISOStringSafe(dpe.created_at || dpe.createdAt),
      updated_at: this.toISOStringSafe(dpe.updated_at || dpe.updatedAt)
    }));
  }

  async updateDPE(id: number, name: string, squadName: string): Promise<DPE> {
    // Find the squad first
    const squads = await this.request<MongoSquad[]>('/squad');
    if (!squads.success || !squads.data) {
      throw new Error('Failed to get squads');
    }
    
    const squad = squads.data.find(s => s.name === squadName);
    if (!squad) {
      throw new Error(`Squad '${squadName}' not found`);
    }

    const squadId = squad.id || squad._id;
    if (!squadId) {
      throw new Error('Squad ID not available');
    }

    // Find the DPE to update
    const dpes = await this.request<MongoDPE[]>('/dpe');
    if (!dpes.success || !dpes.data) {
      throw new Error('Failed to get DPEs for update');
    }
    
    const dpe = dpes.data.find(d => this.mongoIdToNumber(d.id || d._id!) === id);
    if (!dpe) {
      throw new Error('DPE not found');
    }
    
    const dpeId = dpe.id || dpe._id;
    if (!dpeId) {
      throw new Error('DPE ID not available');
    }
    
    const result = await this.request<MongoDPE>(`/dpe/${dpeId}`, {
      method: 'PUT',
      body: JSON.stringify({ 
        name: name.trim(), 
        squadID: squadId,
        updated_at: new Date()
      })
    });
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update DPE');
    }
    
    return {
      id: this.mongoIdToNumber(result.data.id || result.data._id!),
      name: result.data.name,
      squadID: this.mongoIdToNumber(result.data.squadID || result.data.squadId || result.data.squad_id!),
      created_at: this.toISOStringSafe(result.data.created_at || result.data.createdAt),
      updated_at: this.toISOStringSafe(result.data.updated_at || result.data.updatedAt)
    };
  }

  async deleteDPE(id: number): Promise<boolean> {
    try {
      const dpes = await this.request<MongoDPE[]>('/dpe');
      if (!dpes.success || !dpes.data) {
        throw new Error('Failed to get DPEs for deletion');
      }
      
      const dpe = dpes.data.find(d => this.mongoIdToNumber(d.id || d._id!) === id);
      if (!dpe) {
        throw new Error('DPE not found');
      }
      
      const dpeId = dpe.id || dpe._id;
      if (!dpeId) {
        throw new Error('DPE ID not available');
      }
      
      const result = await this.request<void>(`/dpe/${dpeId}`, { method: 'DELETE' });
      return result.success;
    } catch (error) {
      console.error('Error deleting DPE:', error);
      return false;
    }
  }

  // Data retrieval methods for UI
  async getEntityData(): Promise<EntityData> {
    const [teams, squads, dpes] = await Promise.all([
      this.getTeamsWithIds(),
      this.getSquadsWithIds(),
      this.getDPEsWithIds()
    ]);
    
    return {
      teams: teams.map(t => t.name),
      squads: squads.map(s => s.name),
      dpes: dpes.map(d => d.name)
    };
  }

  async getEntityMappings(): Promise<EntityMappings> {
    const [teams, squads, dpes] = await Promise.all([
      this.getTeamsWithIds(),
      this.getSquadsWithIds(),
      this.getDPEsWithIds()
    ]);
    
    const squadToTeam: Record<string, string> = {};
    const dpeToSquad: Record<string, string> = {};
    
    // Create mappings
    squads.forEach(squad => {
      const team = teams.find(t => t.id === squad.teamID);
      if (team) {
        squadToTeam[squad.name] = team.name;
      }
    });
    
    dpes.forEach(dpe => {
      const squad = squads.find(s => s.id === dpe.squadID);
      if (squad) {
        dpeToSquad[dpe.name] = squad.name;
      }
    });
    
    return { dpeToSquad, squadToTeam };
  }

  async getDashboardData(entityType: string, entityValue: string, startDate?: string, endDate?: string): Promise<DashboardData> {
    const entityData = await this.getEntityData();
    const entityMappings = await this.getEntityMappings();
    
    // For now, return empty performance data
    // This would need to be implemented with actual performance metrics
    const performanceData: Array<{
      name: string;
      sct: number;
      cases: number;
      satisfaction: number;
    }> = [];
    
    return {
      entityData,
      entityMappings,
      performanceData
    };
  }

  // Placeholder for performance metrics (not implemented in MongoDB API yet)
  async addPerformanceMetrics(dpeName: string, sct: number, cases: number, satisfaction: number, startDate: string, endDate: string): Promise<PerformanceMetric> {
    throw new Error('Performance metrics not implemented yet');
  }

  async getPerformanceHistory(dpeName: string, startDate?: string, endDate?: string): Promise<PerformanceMetric[]> {
    return []; // Not implemented yet
  }

  // Clear all data functionality
  async clearAllData(): Promise<void> {
    try {
      // Delete all DPEs first (due to foreign key constraints)
      const dpesResult = await this.request<MongoDPE[]>('/dpe');
      if (dpesResult.success && dpesResult.data) {
        for (const dpe of dpesResult.data) {
          if (dpe._id) {
            await this.request<void>(`/dpe/${dpe._id}`, { method: 'DELETE' });
          }
        }
      }

      // Delete all squads
      const squadsResult = await this.request<MongoSquad[]>('/squad');
      if (squadsResult.success && squadsResult.data) {
        for (const squad of squadsResult.data) {
          if (squad._id) {
            await this.request<void>(`/squad/${squad._id}`, { method: 'DELETE' });
          }
        }
      }

      // Delete all teams
      const teamsResult = await this.request<MongoTeam[]>('/team');
      if (teamsResult.success && teamsResult.data) {
        for (const team of teamsResult.data) {
          if (team._id) {
            await this.request<void>(`/team/${team._id}`, { method: 'DELETE' });
          }
        }
      }

      console.log('All entity data cleared from MongoDB');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to clear data');
    }
  }

  // Utility methods
  async migrateLegacyData(entityData: EntityData, entityMappings: EntityMappings): Promise<void> {
    // Migration logic would go here
    console.log('Legacy data migration not implemented yet');
  }

  async debugDatabaseContents(): Promise<void> {
    try {
      const [teams, squads, dpes] = await Promise.all([
        this.getTeamsWithIds(),
        this.getSquadsWithIds(),
        this.getDPEsWithIds()
      ]);
      
      console.log('=== MongoDB Database Contents ===');
      console.log('Teams:', teams);
      console.log('Squads:', squads);
      console.log('DPEs:', dpes);
    } catch (error) {
      console.error('Failed to debug database contents:', error);
    }
  }

  // Helper method for date conversion
  private toISOStringSafe(date: Date | string | undefined): string {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    return date.toISOString();
  }

  // Helper method for ID conversion
  private mongoIdToNumber(mongoId: string): number {
    // Handle undefined or null mongoId
    if (!mongoId) {
      return Math.floor(Math.random() * 1000000); // Fallback random number
    }
    
    // Create a simple hash of the MongoDB ObjectId for compatibility
    let hash = 0;
    for (let i = 0; i < mongoId.length; i++) {
      const char = mongoId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Clear collections endpoint
  async clearCollections(collections: string[]): Promise<{ success: boolean; totalDeleted?: number; error?: string }> {
    const result = await this.request<{
      success: boolean;
      totalDeleted: number;
      collections: Record<string, { success: boolean; deletedCount?: number; error?: string }>;
    }>('/collections/clear', {
      method: 'DELETE',
      body: JSON.stringify({ collections })
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to clear collections'
      };
    }

    return {
      success: result.data!.success,
      totalDeleted: result.data!.totalDeleted,
      error: result.data!.success ? undefined : 'Some collections failed to clear'
    };
  }

  close(): void {
    // No persistent connection to close in this implementation
  }
}

export default EntityService;
