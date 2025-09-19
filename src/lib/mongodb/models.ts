// MongoDB models disabled due to missing mongoose dependency
// This is a stub file to prevent import errors

// Stub interface definitions (types only)
export interface ITeam {
  _id?: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ISquad {
  _id?: string;
  name: string;
  team_id: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IDPE {
  _id?: string;
  name: string;
  squad_id: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IPerformanceMetric {
  _id?: string;
  dpe_id: string;
  sct: number;
  cases: number;
  satisfaction: number;
  period_start: Date;
  period_end: Date;
  created_at: Date;
}

export interface ICase {
  _id?: string;
  case_id: string;
  title: string;
  status: string;
  priority: string;
  dpe_id: string;
  created_at: Date;
  updated_at: Date;
}

// Stub models (no actual mongoose functionality)
export const Team = {};
export const Squad = {};
export const DPE = {};
export const PerformanceMetric = {};
export const Case = {};