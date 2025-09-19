// MongoDB API Database interfaces and client
// This module provides TypeScript interfaces and a client for interacting with the MongoDB API

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
  description?: string;
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

export interface MongoAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class MongoAPIDatabase {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:3001', timeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<MongoAPIResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error(`MongoDB API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Team operations
  async getTeams(): Promise<TeamData[]> {
    const response = await this.request<TeamData[]>('/api/teams');
    return response.data || [];
  }

  async createTeam(name: string, description?: string): Promise<TeamData | null> {
    const response = await this.request<TeamData>('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    });
    return response.data || null;
  }

  async updateTeam(id: string, updates: Partial<TeamData>): Promise<TeamData | null> {
    const response = await this.request<TeamData>(`/api/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return response.data || null;
  }

  async deleteTeam(id: string): Promise<boolean> {
    const response = await this.request(`/api/teams/${id}`, {
      method: 'DELETE'
    });
    return response.success;
  }

  // Squad operations
  async getSquads(): Promise<SquadData[]> {
    const response = await this.request<SquadData[]>('/api/squads');
    return response.data || [];
  }

  async createSquad(name: string, teamId: string, description?: string): Promise<SquadData | null> {
    const response = await this.request<SquadData>('/api/squads', {
      method: 'POST',
      body: JSON.stringify({ name, team_id: teamId, description })
    });
    return response.data || null;
  }

  async updateSquad(id: string, updates: Partial<SquadData>): Promise<SquadData | null> {
    const response = await this.request<SquadData>(`/api/squads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return response.data || null;
  }

  async deleteSquad(id: string): Promise<boolean> {
    const response = await this.request(`/api/squads/${id}`, {
      method: 'DELETE'
    });
    return response.success;
  }

  // DPE operations
  async getDPEs(): Promise<DPEData[]> {
    const response = await this.request<DPEData[]>('/api/dpes');
    return response.data || [];
  }

  async createDPE(name: string, squadId: string, description?: string): Promise<DPEData | null> {
    const response = await this.request<DPEData>('/api/dpes', {
      method: 'POST',
      body: JSON.stringify({ name, squad_id: squadId, description })
    });
    return response.data || null;
  }

  async updateDPE(id: string, updates: Partial<DPEData>): Promise<DPEData | null> {
    const response = await this.request<DPEData>(`/api/dpes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return response.data || null;
  }

  async deleteDPE(id: string): Promise<boolean> {
    const response = await this.request(`/api/dpes/${id}`, {
      method: 'DELETE'
    });
    return response.success;
  }

  // Performance metrics operations
  async getPerformanceMetrics(): Promise<PerformanceMetricData[]> {
    const response = await this.request<PerformanceMetricData[]>('/api/metrics');
    return response.data || [];
  }

  async addPerformanceMetric(dpeId: string, sct: number, cases: number, satisfaction: number, periodStart: string, periodEnd: string): Promise<PerformanceMetricData | null> {
    const response = await this.request<PerformanceMetricData>('/api/metrics', {
      method: 'POST',
      body: JSON.stringify({
        dpe_id: dpeId,
        sct,
        cases,
        satisfaction,
        period_start: periodStart,
        period_end: periodEnd
      })
    });
    return response.data || null;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    const response = await this.request('/health');
    return response.success;
  }
}

export default MongoAPIDatabase;
