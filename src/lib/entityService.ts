import BrowserEntityDatabase, { Team, Squad, DPE, PerformanceMetric } from './browserDatabase';
import { generateAMEASMBSampleData, flattenSampleData, getCurrentPeriod } from './sampleDataGenerator';

// API response types
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

class EntityService {
  private db: BrowserEntityDatabase;
  private initPromise: Promise<void>;

  constructor() {
    this.db = new BrowserEntityDatabase();
    this.initPromise = this.db.init(); // Store the initialization promise
  }

  // Ensure database is initialized before any operation
  private async ensureInitialized(): Promise<void> {
    await this.initPromise;
  }

  // Get all entities formatted for the UI
  async getEntityData(): Promise<EntityData> {
    await this.ensureInitialized();
    
    const teams = await this.db.getTeams();
    const squads = await this.db.getSquads();
    const dpes = await this.db.getDPEs();

    return {
      teams: [...teams.map(t => t.name), 'Add New Team...'],
      squads: [...squads.map(s => s.name), 'Add New Squad...'],
      dpes: [...dpes.map(d => d.name), 'Add New DPE...']
    };
  }

  // Get entity mappings for the UI
  async getEntityMappings(): Promise<EntityMappings> {
    await this.ensureInitialized();
    
    const hierarchy = await this.db.getEntityHierarchy();
    
    const dpeToSquad: Record<string, string> = {};
    const squadToTeam: Record<string, string> = {};

    hierarchy.forEach((row: any) => {
      if (row.dpe_name && row.squad_name) {
        dpeToSquad[row.dpe_name] = row.squad_name;
      }
      if (row.squad_name && row.team_name) {
        squadToTeam[row.squad_name] = row.team_name;
      }
    });

    return { dpeToSquad, squadToTeam };
  }

  // Get raw entities with database IDs for management UI
  async getTeamsWithIds(): Promise<Team[]> {
    await this.ensureInitialized();
    return this.db.getTeams();
  }

  async getSquadsWithIds(): Promise<Squad[]> {
    await this.ensureInitialized();
    return this.db.getSquads();
  }

  async getDPEsWithIds(): Promise<DPE[]> {
    await this.ensureInitialized();
    return this.db.getDPEs();
  }

  // Get dashboard data for a specific entity
  async getDashboardData(entityType: string, entityValue: string, startDate?: string, endDate?: string): Promise<DashboardData> {
    await this.ensureInitialized();
    const entityData = await this.getEntityData();
    const entityMappings = await this.getEntityMappings();
    
    let performanceData: Array<{ name: string; sct: number; cases: number; satisfaction: number; }> = [];

    if (entityType === 'dpe') {
      const dpes = await this.db.getDPEs();
      const dpe = dpes.find(d => d.name === entityValue);
      if (dpe) {
        const metrics = await this.db.getPerformanceMetrics(dpe.id, startDate, endDate);
        if (metrics.length > 0) {
          const latest = metrics[0]; // Get latest metrics
          performanceData = [{
            name: dpe.name,
            sct: latest.sct,
            cases: latest.cases,
            satisfaction: latest.satisfaction
          }];
        }
      }
    } else if (entityType === 'squad') {
      const squads = await this.db.getSquads();
      const squad = squads.find(s => s.name === entityValue);
      if (squad) {
        const dpes = await this.db.getDPEs(squad.id);
        performanceData = await Promise.all(dpes.map(async dpe => {
          const metrics = await this.db.getPerformanceMetrics(dpe.id, startDate, endDate);
          const latest = metrics[0] || { sct: 0, cases: 0, satisfaction: 0 };
          return {
            name: dpe.name,
            sct: latest.sct,
            cases: latest.cases,
            satisfaction: latest.satisfaction
          };
        }));
      }
    } else if (entityType === 'team') {
      const teams = await this.db.getTeams();
      const team = teams.find(t => t.name === entityValue);
      if (team) {
        const squads = await this.db.getSquads(team.id);
        performanceData = await Promise.all(squads.map(async squad => {
          const dpes = await this.db.getDPEs(squad.id);
          const squadMetrics = await Promise.all(dpes.map(async dpe => {
            const metrics = await this.db.getPerformanceMetrics(dpe.id, startDate, endDate);
            return metrics[0] || { sct: 0, cases: 0, satisfaction: 0 };
          }));

          // Calculate squad averages
          const avgSct = squadMetrics.length > 0 
            ? squadMetrics.reduce((sum, m) => sum + m.sct, 0) / squadMetrics.length 
            : 0;
          const totalCases = squadMetrics.reduce((sum, m) => sum + m.cases, 0);
          const avgSatisfaction = squadMetrics.length > 0 
            ? squadMetrics.reduce((sum, m) => sum + m.satisfaction, 0) / squadMetrics.length 
            : 0;

          return {
            name: squad.name,
            sct: Math.round(avgSct),
            cases: totalCases,
            satisfaction: Math.round(avgSatisfaction)
          };
        }));
      }
    }

    return {
      entityData,
      entityMappings,
      performanceData
    };
  }

  // CRUD operations for Teams
  async createTeam(name: string, description?: string): Promise<Team> {
    await this.ensureInitialized();
    return this.db.createTeam(name, description);
  }

  async updateTeam(id: number, name: string, description?: string): Promise<Team> {
    await this.ensureInitialized();
    return this.db.updateTeam(id, name, description);
  }

  async deleteTeam(id: number): Promise<boolean> {
    await this.ensureInitialized();
    return this.db.deleteTeam(id);
  }

  // CRUD operations for Squads
  async createSquad(name: string, teamName: string, description?: string): Promise<Squad> {
    await this.ensureInitialized();
    const teams = await this.db.getTeams();
    const team = teams.find(t => t.name === teamName);
    if (!team) {
      throw new Error(`Team '${teamName}' not found`);
    }
    return this.db.createSquad(name, team.id, description);
  }

  async updateSquad(id: number, name: string, teamName: string, description?: string): Promise<Squad> {
    await this.ensureInitialized();
    const teams = await this.db.getTeams();
    const team = teams.find(t => t.name === teamName);
    if (!team) {
      throw new Error(`Team '${teamName}' not found`);
    }
    return this.db.updateSquad(id, name, team.id, description);
  }

  async deleteSquad(id: number): Promise<boolean> {
    await this.ensureInitialized();
    return this.db.deleteSquad(id);
  }

  // CRUD operations for DPEs
  async createDPE(name: string, squadName: string, email?: string): Promise<DPE> {
    await this.ensureInitialized();
    const squads = await this.db.getSquads();
    const squad = squads.find(s => s.name === squadName);
    if (!squad) {
      throw new Error(`Squad '${squadName}' not found`);
    }
    return this.db.createDPE(name, squad.id, email);
  }

  async updateDPE(id: number, name: string, squadName: string, email?: string): Promise<DPE> {
    await this.ensureInitialized();
    const squads = await this.db.getSquads();
    const squad = squads.find(s => s.name === squadName);
    if (!squad) {
      throw new Error(`Squad '${squadName}' not found`);
    }
    return this.db.updateDPE(id, name, squad.id, email);
  }

  async deleteDPE(id: number): Promise<boolean> {
    await this.ensureInitialized();
    return this.db.deleteDPE(id);
  }

  // Performance metrics operations
  async addPerformanceMetrics(dpeName: string, sct: number, cases: number, satisfaction: number, startDate: string, endDate: string): Promise<PerformanceMetric> {
    await this.ensureInitialized();
    const dpes = await this.db.getDPEs();
    const dpe = dpes.find(d => d.name === dpeName);
    if (!dpe) {
      throw new Error(`DPE '${dpeName}' not found`);
    }
    return this.db.createPerformanceMetric(dpe.id, sct, cases, satisfaction, startDate, endDate);
  }

  async getPerformanceHistory(dpeName: string, startDate?: string, endDate?: string): Promise<PerformanceMetric[]> {
    const dpes = await this.db.getDPEs();
    const dpe = dpes.find(d => d.name === dpeName);
    if (!dpe) {
      throw new Error(`DPE '${dpeName}' not found`);
    }
    return this.db.getPerformanceMetrics(dpe.id, startDate, endDate);
  }

  // Utility methods
  async migrateLegacyData(entityData: EntityData, entityMappings: EntityMappings): Promise<void> {
    await this.ensureInitialized();
    // This method can be used to migrate existing in-memory data to the database
    console.log('Migrating legacy data to database...');
    
    // Create teams that don't exist
    for (const teamName of entityData.teams) {
      if (teamName !== 'Add New Team...') {
        const teams = await this.db.getTeams();
        const existingTeam = teams.find(t => t.name === teamName);
        if (!existingTeam) {
          await this.createTeam(teamName);
        }
      }
    }

    // Create squads and map them to teams
    for (const squadName of entityData.squads) {
      if (squadName !== 'Add New Squad...') {
        const squads = await this.db.getSquads();
        const existingSquad = squads.find(s => s.name === squadName);
        if (!existingSquad) {
          const teamName = entityMappings.squadToTeam[squadName];
          if (teamName) {
            await this.createSquad(squadName, teamName);
          }
        }
      }
    }

    // Create DPEs and map them to squads
    for (const dpeName of entityData.dpes) {
      if (dpeName !== 'Add New DPE...') {
        const dpes = await this.db.getDPEs();
        const existingDPE = dpes.find(d => d.name === dpeName);
        if (!existingDPE) {
          const squadName = entityMappings.dpeToSquad[dpeName];
          if (squadName) {
            await this.createDPE(dpeName, squadName);
          }
        }
      }
    }

    console.log('Legacy data migration completed successfully');
  }

  // Debug function to check database contents
  async debugDatabaseContents(): Promise<void> {
    await this.ensureInitialized();
    return this.db.debugDatabaseContents();
  }

  // Function to regenerate sample data (useful for testing or resetting)
  async regenerateSampleData(): Promise<void> {
    await this.ensureInitialized();
    
    console.log('Regenerating AMEA SMB sample data...');
    
    // Clear existing data
    const teams = await this.db.getTeams();
    const squads = await this.db.getSquads();
    const dpes = await this.db.getDPEs();
    
    // Delete in reverse order due to foreign key constraints
    for (const dpe of dpes) {
      await this.db.deleteDPE(dpe.id);
    }
    for (const squad of squads) {
      await this.db.deleteSquad(squad.id);
    }
    for (const team of teams) {
      await this.db.deleteTeam(team.id);
    }
    
    // Generate new sample data
    const sampleTeams = generateAMEASMBSampleData();
    const flatData = flattenSampleData(sampleTeams);
    const currentPeriod = getCurrentPeriod();

    // Insert teams
    for (const team of flatData.teams) {
      await this.createTeam(team.name, team.description);
    }

    // Insert squads
    for (const squad of flatData.squads) {
      await this.createSquad(squad.name, squad.teamName, squad.description);
    }

    // Insert DPEs and their performance data
    for (const dpe of flatData.dpes) {
      const createdDPE = await this.createDPE(dpe.name, dpe.squadName, dpe.email);
      
      // Add performance data if available
      if (dpe.performance && createdDPE.id) {
        await this.addPerformanceMetrics(
          dpe.name,
          dpe.performance.sct,
          dpe.performance.cases,
          dpe.performance.satisfaction,
          currentPeriod.start,
          currentPeriod.end
        );
      }
    }

    console.log('AMEA SMB sample data regeneration completed successfully');
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

export default EntityService;
