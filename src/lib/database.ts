import Database from 'better-sqlite3';
import path from 'path';
import { generateAMEASMBSampleData, flattenSampleData, getCurrentPeriod } from './sampleDataGenerator';

// Database types
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

class EntityDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const defaultPath = path.join(process.cwd(), 'data', 'entities.db');
    this.db = new Database(dbPath || defaultPath);
    this.init();
  }

  private init() {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Create tables
    this.createTables();
    this.seedDefaultData();
  }

  private createTables() {
    // Teams table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Squads table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS squads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        team_id INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
      )
    `);

    // DPEs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dpes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        squad_id INTEGER NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (squad_id) REFERENCES squads (id) ON DELETE CASCADE
      )
    `);

    // Performance metrics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dpe_id INTEGER NOT NULL,
        sct REAL NOT NULL,
        cases INTEGER NOT NULL,
        satisfaction REAL NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dpe_id) REFERENCES dpes (id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_squads_team_id ON squads (team_id);
      CREATE INDEX IF NOT EXISTS idx_dpes_squad_id ON dpes (squad_id);
      CREATE INDEX IF NOT EXISTS idx_performance_dpe_id ON performance_metrics (dpe_id);
      CREATE INDEX IF NOT EXISTS idx_performance_period ON performance_metrics (period_start, period_end);
    `);
  }

  private seedDefaultData() {
    // Check if data already exists
    const teamCount = this.db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number };
    if (teamCount.count > 0) return;

    console.log('Seeding AMEA SMB sample data...');

    // Generate AMEA SMB organizational structure
    const sampleTeams = generateAMEASMBSampleData();
    const flatData = flattenSampleData(sampleTeams);
    const currentPeriod = getCurrentPeriod();

    // Insert teams
    const insertTeam = this.db.prepare('INSERT INTO teams (name, description) VALUES (?, ?)');
    flatData.teams.forEach(team => {
      insertTeam.run(team.name, team.description);
    });

    // Insert squads
    const insertSquad = this.db.prepare('INSERT INTO squads (name, team_id, description) VALUES (?, ?, ?)');
    const teams = this.getTeams(); // Get teams with their IDs
    
    flatData.squads.forEach(squad => {
      const team = teams.find(t => t.name === squad.teamName);
      if (team) {
        insertSquad.run(squad.name, team.id, squad.description);
      }
    });

    // Insert DPEs
    const insertDPE = this.db.prepare('INSERT INTO dpes (name, squad_id, email) VALUES (?, ?, ?)');
    const squads = this.getSquads(); // Get squads with their IDs
    
    const dpeInsertions: Array<{ dpeId: number; performance: any }> = [];
    
    flatData.dpes.forEach(dpe => {
      const squad = squads.find(s => s.name === dpe.squadName);
      if (squad) {
        const result = this.db.prepare('INSERT INTO dpes (name, squad_id, email) VALUES (?, ?, ?) RETURNING id').get(dpe.name, squad.id, dpe.email) as { id: number };
        
        if (dpe.performance && result.id) {
          dpeInsertions.push({
            dpeId: result.id,
            performance: dpe.performance
          });
        }
      }
    });

    // Insert performance data
    const insertMetric = this.db.prepare(`
      INSERT INTO performance_metrics (dpe_id, sct, cases, satisfaction, period_start, period_end) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    dpeInsertions.forEach(({ dpeId, performance }) => {
      insertMetric.run(
        dpeId,
        performance.sct,
        performance.cases,
        performance.satisfaction,
        currentPeriod.start,
        currentPeriod.end
      );
    });

    console.log('AMEA SMB sample data seeding completed successfully');
  }

  // Team operations
  getTeams(): Team[] {
    return this.db.prepare('SELECT * FROM teams ORDER BY name').all() as Team[];
  }

  createTeam(name: string, description?: string): Team {
    const result = this.db.prepare('INSERT INTO teams (name, description) VALUES (?, ?) RETURNING *').get(name, description) as Team;
    return result;
  }

  updateTeam(id: number, name: string, description?: string): Team {
    const result = this.db.prepare('UPDATE teams SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *').get(name, description, id) as Team;
    return result;
  }

  deleteTeam(id: number): boolean {
    const result = this.db.prepare('DELETE FROM teams WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Squad operations
  getSquads(teamId?: number): Squad[] {
    if (teamId) {
      return this.db.prepare('SELECT * FROM squads WHERE team_id = ? ORDER BY name').all(teamId) as Squad[];
    }
    return this.db.prepare('SELECT * FROM squads ORDER BY name').all() as Squad[];
  }

  createSquad(name: string, teamId: number, description?: string): Squad {
    const result = this.db.prepare('INSERT INTO squads (name, team_id, description) VALUES (?, ?, ?) RETURNING *').get(name, teamId, description) as Squad;
    return result;
  }

  updateSquad(id: number, name: string, teamId: number, description?: string): Squad {
    const result = this.db.prepare('UPDATE squads SET name = ?, team_id = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *').get(name, teamId, description, id) as Squad;
    return result;
  }

  deleteSquad(id: number): boolean {
    const result = this.db.prepare('DELETE FROM squads WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // DPE operations
  getDPEs(squadId?: number): DPE[] {
    if (squadId) {
      return this.db.prepare('SELECT * FROM dpes WHERE squad_id = ? ORDER BY name').all(squadId) as DPE[];
    }
    return this.db.prepare('SELECT * FROM dpes ORDER BY name').all() as DPE[];
  }

  createDPE(name: string, squadId: number, email?: string): DPE {
    const result = this.db.prepare('INSERT INTO dpes (name, squad_id, email) VALUES (?, ?, ?) RETURNING *').get(name, squadId, email) as DPE;
    return result;
  }

  updateDPE(id: number, name: string, squadId: number, email?: string): DPE {
    const result = this.db.prepare('UPDATE dpes SET name = ?, squad_id = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *').get(name, squadId, email, id) as DPE;
    return result;
  }

  deleteDPE(id: number): boolean {
    const result = this.db.prepare('DELETE FROM dpes WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Performance metrics operations
  getPerformanceMetrics(dpeId?: number, startDate?: string, endDate?: string): PerformanceMetric[] {
    let query = 'SELECT * FROM performance_metrics';
    const params: any[] = [];
    const conditions: string[] = [];

    if (dpeId) {
      conditions.push('dpe_id = ?');
      params.push(dpeId);
    }

    if (startDate) {
      conditions.push('period_start >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('period_end <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY period_start DESC';

    return this.db.prepare(query).all(...params) as PerformanceMetric[];
  }

  createPerformanceMetric(dpeId: number, sct: number, cases: number, satisfaction: number, periodStart: string, periodEnd: string): PerformanceMetric {
    const result = this.db.prepare(`
      INSERT INTO performance_metrics (dpe_id, sct, cases, satisfaction, period_start, period_end) 
      VALUES (?, ?, ?, ?, ?, ?) RETURNING *
    `).get(dpeId, sct, cases, satisfaction, periodStart, periodEnd) as PerformanceMetric;
    return result;
  }

  // Complex queries for dashboard
  getEntityHierarchy() {
    return this.db.prepare(`
      SELECT 
        t.id as team_id, t.name as team_name,
        s.id as squad_id, s.name as squad_name,
        d.id as dpe_id, d.name as dpe_name, d.email as dpe_email
      FROM teams t
      LEFT JOIN squads s ON t.id = s.team_id
      LEFT JOIN dpes d ON s.id = d.squad_id
      ORDER BY t.name, s.name, d.name
    `).all();
  }

  getTeamPerformance(teamId: number, startDate?: string, endDate?: string) {
    let query = `
      SELECT 
        t.name as team_name,
        s.name as squad_name,
        d.name as dpe_name,
        AVG(pm.sct) as avg_sct,
        SUM(pm.cases) as total_cases,
        AVG(pm.satisfaction) as avg_satisfaction
      FROM teams t
      JOIN squads s ON t.id = s.team_id
      JOIN dpes d ON s.id = d.squad_id
      JOIN performance_metrics pm ON d.id = pm.dpe_id
      WHERE t.id = ?
    `;

    const params: any[] = [teamId];

    if (startDate) {
      query += ' AND pm.period_start >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND pm.period_end <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY t.id, s.id, d.id ORDER BY s.name, d.name';

    return this.db.prepare(query).all(...params);
  }

  close() {
    this.db.close();
  }
}

export default EntityDatabase;
