// MongoDB integration disabled due to missing mongoose dependency
// This is a stub file to prevent import errors

// Type definitions that match the existing interface structure
export interface TeamData {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SquadData {
  id: string;
  name: string;
  team_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DPEData {
  id: string;
  name: string;
  squad_id: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetricData {
  id: string;
  dpe_id: string;
  sct: number;
  cases: number;
  satisfaction: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface EntityHierarchy {
  team_id: string | null;
  team_name: string | null;
  squad_id: string | null;
  squad_name: string | null;
  dpe_id: string | null;
  dpe_name: string | null;
  dpe_email: string | null;
}

// Stub class - MongoDB integration disabled
class MongoEntityDatabase {
  private isInitialized = false;

  async init(): Promise<void> {
    this.isInitialized = true;
    console.log('MongoDB Entity Database (stub) initialized');
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  // Stub methods that return empty arrays/default values
  async getTeams(): Promise<TeamData[]> {
    await this.ensureInitialized();
    return [];
  }

  async createTeam(name: string, description?: string): Promise<TeamData> {
    await this.ensureInitialized();
    return {
      id: Date.now().toString(),
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async updateTeam(id: string, name: string, description?: string): Promise<TeamData> {
    await this.ensureInitialized();
    return {
      id,
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async deleteTeam(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return true;
  }

  async getSquads(): Promise<SquadData[]> {
    await this.ensureInitialized();
    return [];
  }

  async createSquad(name: string, teamId: string, description?: string): Promise<SquadData> {
    await this.ensureInitialized();
    return {
      id: Date.now().toString(),
      name,
      team_id: teamId,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async updateSquad(id: string, name: string, teamId: string, description?: string): Promise<SquadData> {
    await this.ensureInitialized();
    return {
      id,
      name,
      team_id: teamId,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async deleteSquad(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return true;
  }

  async getDPEs(): Promise<DPEData[]> {
    await this.ensureInitialized();
    return [];
  }

  async createDPE(name: string, squadId: string, email?: string): Promise<DPEData> {
    await this.ensureInitialized();
    return {
      id: Date.now().toString(),
      name,
      squad_id: squadId,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async updateDPE(id: string, name: string, squadId: string, email?: string): Promise<DPEData> {
    await this.ensureInitialized();
    return {
      id,
      name,
      squad_id: squadId,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async deleteDPE(id: string): Promise<boolean> {
    await this.ensureInitialized();
    return true;
  }

  async getPerformanceMetrics(dpeId?: string, startDate?: string, endDate?: string): Promise<PerformanceMetricData[]> {
    await this.ensureInitialized();
    return [];
  }

  async addPerformanceMetric(
    dpeId: string,
    sct: number,
    cases: number,
    satisfaction: number,
    periodStart: string,
    periodEnd: string
  ): Promise<PerformanceMetricData> {
    await this.ensureInitialized();
    return {
      id: Date.now().toString(),
      dpe_id: dpeId,
      sct,
      cases,
      satisfaction,
      period_start: periodStart,
      period_end: periodEnd,
      created_at: new Date().toISOString()
    };
  }

  async debugDatabaseContents(): Promise<void> {
    await this.ensureInitialized();
    console.log('=== MongoDB Database Contents (Stub) ===');
    console.log('No data - MongoDB integration disabled');
    console.log('=======================================');
  }

  async getEntityHierarchy(): Promise<EntityHierarchy[]> {
    await this.ensureInitialized();
    return [];
  }

  async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    console.log('MongoDB database (stub) cleared');
  }

  close(): void {
    console.log('MongoDB connection (stub) closed');
  }
}

// Export default instance
export default new MongoEntityDatabase();