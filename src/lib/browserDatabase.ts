// Browser-compatible database using IndexedDB
import { generateAMEASMBSampleData, flattenSampleData, getCurrentPeriod } from './sampleDataGenerator';

export interface Team {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Squad {
  id: number;
  name: string;
  team_id: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DPE {
  id: number;
  name: string;
  squad_id: number;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetric {
  id: number;
  dpe_id: number;
  sct: number;
  cases: number;
  satisfaction: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

class BrowserEntityDatabase {
  private dbName = 'devops-insight-engine';
  private version = 2; // Increment version to ensure fresh database
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB connected successfully');
        this.seedDefaultData().then(() => {
          console.log('Database seeded and ready');
          resolve();
        }).catch(reject);
      };

      request.onupgradeneeded = (event) => {
        console.log('IndexedDB upgrade needed, creating stores...');
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // Teams store
    if (!db.objectStoreNames.contains('teams')) {
      const teamStore = db.createObjectStore('teams', { keyPath: 'id', autoIncrement: true });
      teamStore.createIndex('name', 'name', { unique: true });
    }

    // Squads store
    if (!db.objectStoreNames.contains('squads')) {
      const squadStore = db.createObjectStore('squads', { keyPath: 'id', autoIncrement: true });
      squadStore.createIndex('name', 'name', { unique: true });
      squadStore.createIndex('team_id', 'team_id');
    }

    // DPEs store
    if (!db.objectStoreNames.contains('dpes')) {
      const dpeStore = db.createObjectStore('dpes', { keyPath: 'id', autoIncrement: true });
      dpeStore.createIndex('name', 'name', { unique: true });
      dpeStore.createIndex('squad_id', 'squad_id');
    }

    // Performance metrics store
    if (!db.objectStoreNames.contains('performance_metrics')) {
      const metricsStore = db.createObjectStore('performance_metrics', { keyPath: 'id', autoIncrement: true });
      metricsStore.createIndex('dpe_id', 'dpe_id');
      metricsStore.createIndex('period', ['period_start', 'period_end']);
    }
  }

  private async seedDefaultData(): Promise<void> {
    const teams = await this.getTeams();
    console.log(`Found ${teams.length} existing teams in database`);
    if (teams.length > 0) return;

    console.log('Seeding AMEA SMB sample data...');
    const now = new Date().toISOString();

    // Generate AMEA SMB organizational structure
    const sampleTeams = generateAMEASMBSampleData();
    const flatData = flattenSampleData(sampleTeams);
    const currentPeriod = getCurrentPeriod();

    // Insert teams
    for (const team of flatData.teams) {
      await this.createTeam(team.name, team.description);
    }

    // Insert squads
    for (const squad of flatData.squads) {
      const teams = await this.getTeams();
      const team = teams.find(t => t.name === squad.teamName);
      if (team) {
        await this.createSquad(squad.name, team.id, squad.description);
      }
    }

    // Insert DPEs and their performance data
    for (const dpe of flatData.dpes) {
      const squads = await this.getSquads();
      const squad = squads.find(s => s.name === dpe.squadName);
      if (squad) {
        const createdDPE = await this.createDPE(dpe.name, squad.id, dpe.email);
        
        // Add performance data if available
        if (dpe.performance && createdDPE.id) {
          await this.createPerformanceMetric(
            createdDPE.id,
            dpe.performance.sct,
            dpe.performance.cases,
            dpe.performance.satisfaction,
            currentPeriod.start,
            currentPeriod.end
          );
        }
      }
    }

    console.log('AMEA SMB sample data seeding completed successfully');
  }

  // Debug function to check database contents
  async debugDatabaseContents(): Promise<void> {
    const teams = await this.getTeams();
    const squads = await this.getSquads();
    const dpes = await this.getDPEs();
    
    console.log('=== Database Contents ===');
    console.log(`Teams (${teams.length}):`, teams.map(t => t.name));
    console.log(`Squads (${squads.length}):`, squads.map(s => s.name));
    console.log(`DPEs (${dpes.length}):`, dpes.map(d => d.name));
    console.log('========================');
  }

  private async executeTransaction<T>(storeName: string, mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Team operations
  async getTeams(): Promise<Team[]> {
    return this.executeTransaction('teams', 'readonly', (store) => store.getAll());
  }

  async createTeam(name: string, description?: string): Promise<Team> {
    const now = new Date().toISOString();
    const team = { name, description, created_at: now, updated_at: now };
    
    const id = await this.executeTransaction('teams', 'readwrite', (store) => store.add(team));
    return { id: id as number, ...team };
  }

  async updateTeam(id: number, name: string, description?: string): Promise<Team> {
    const now = new Date().toISOString();
    const team = { id, name, description, updated_at: now, created_at: now };
    
    await this.executeTransaction('teams', 'readwrite', (store) => store.put(team));
    return team;
  }

  async deleteTeam(id: number): Promise<boolean> {
    try {
      await this.executeTransaction('teams', 'readwrite', (store) => store.delete(id));
      return true;
    } catch {
      return false;
    }
  }

  // Squad operations
  async getSquads(teamId?: number): Promise<Squad[]> {
    const allSquads = await this.executeTransaction('squads', 'readonly', (store) => store.getAll());
    return teamId ? allSquads.filter(s => s.team_id === teamId) : allSquads;
  }

  async createSquad(name: string, teamId: number, description?: string): Promise<Squad> {
    const now = new Date().toISOString();
    const squad = { name, team_id: teamId, description, created_at: now, updated_at: now };
    
    const id = await this.executeTransaction('squads', 'readwrite', (store) => store.add(squad));
    return { id: id as number, ...squad };
  }

  async updateSquad(id: number, name: string, teamId: number, description?: string): Promise<Squad> {
    const now = new Date().toISOString();
    const squad = { id, name, team_id: teamId, description, updated_at: now, created_at: now };
    
    await this.executeTransaction('squads', 'readwrite', (store) => store.put(squad));
    return squad;
  }

  async deleteSquad(id: number): Promise<boolean> {
    try {
      await this.executeTransaction('squads', 'readwrite', (store) => store.delete(id));
      return true;
    } catch {
      return false;
    }
  }

  // DPE operations
  async getDPEs(squadId?: number): Promise<DPE[]> {
    const allDPEs = await this.executeTransaction('dpes', 'readonly', (store) => store.getAll());
    return squadId ? allDPEs.filter(d => d.squad_id === squadId) : allDPEs;
  }

  async createDPE(name: string, squadId: number, email?: string): Promise<DPE> {
    const now = new Date().toISOString();
    const dpe = { name, squad_id: squadId, email, created_at: now, updated_at: now };
    
    const id = await this.executeTransaction('dpes', 'readwrite', (store) => store.add(dpe));
    return { id: id as number, ...dpe };
  }

  async updateDPE(id: number, name: string, squadId: number, email?: string): Promise<DPE> {
    const now = new Date().toISOString();
    const dpe = { id, name, squad_id: squadId, email, updated_at: now, created_at: now };
    
    await this.executeTransaction('dpes', 'readwrite', (store) => store.put(dpe));
    return dpe;
  }

  async deleteDPE(id: number): Promise<boolean> {
    try {
      await this.executeTransaction('dpes', 'readwrite', (store) => store.delete(id));
      return true;
    } catch {
      return false;
    }
  }

  // Performance metrics operations
  async getPerformanceMetrics(dpeId?: number, startDate?: string, endDate?: string): Promise<PerformanceMetric[]> {
    let metrics = await this.executeTransaction('performance_metrics', 'readonly', (store) => store.getAll());
    
    if (dpeId) {
      metrics = metrics.filter(m => m.dpe_id === dpeId);
    }
    
    if (startDate) {
      metrics = metrics.filter(m => m.period_start >= startDate);
    }
    
    if (endDate) {
      metrics = metrics.filter(m => m.period_end <= endDate);
    }
    
    return metrics.sort((a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime());
  }

  async createPerformanceMetric(dpeId: number, sct: number, cases: number, satisfaction: number, periodStart: string, periodEnd: string): Promise<PerformanceMetric> {
    const now = new Date().toISOString();
    const metric = { dpe_id: dpeId, sct, cases, satisfaction, period_start: periodStart, period_end: periodEnd, created_at: now };
    
    const id = await this.executeTransaction('performance_metrics', 'readwrite', (store) => store.add(metric));
    return { id: id as number, ...metric };
  }

  // Complex queries
  async getEntityHierarchy() {
    const [teams, squads, dpes] = await Promise.all([
      this.getTeams(),
      this.getSquads(),
      this.getDPEs()
    ]);

    const hierarchy: any[] = [];
    
    teams.forEach(team => {
      const teamSquads = squads.filter(s => s.team_id === team.id);
      
      teamSquads.forEach(squad => {
        const squadDPEs = dpes.filter(d => d.squad_id === squad.id);
        
        squadDPEs.forEach(dpe => {
          hierarchy.push({
            team_id: team.id,
            team_name: team.name,
            squad_id: squad.id,
            squad_name: squad.name,
            dpe_id: dpe.id,
            dpe_name: dpe.name,
            dpe_email: dpe.email
          });
        });

        // Add squad without DPEs
        if (squadDPEs.length === 0) {
          hierarchy.push({
            team_id: team.id,
            team_name: team.name,
            squad_id: squad.id,
            squad_name: squad.name,
            dpe_id: null,
            dpe_name: null,
            dpe_email: null
          });
        }
      });

      // Add team without squads
      if (teamSquads.length === 0) {
        hierarchy.push({
          team_id: team.id,
          team_name: team.name,
          squad_id: null,
          squad_name: null,
          dpe_id: null,
          dpe_name: null,
          dpe_email: null
        });
      }
    });

    return hierarchy;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export default BrowserEntityDatabase;
