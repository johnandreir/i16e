export interface CaseReportParams {
  entityType: 'dpe' | 'squad' | 'team';
  entityName: string;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export interface CaseData {
  case_id: string;
  priority: string;
  owner_full_name: string;
  title: string;
  products: string[];
  status: string;
  created_date: string;
  closed_date: string;
  case_age_days: number;
  structured_email_thread?: string;
}

export interface SCTReport {
  owner_full_name: string;
  sct: number;
  case_count: number;
}

export class N8nWorkflowService {
  private baseUrl: string;
  private workflowId: string;

  constructor() {
    // Update these with your actual n8n instance details
    this.baseUrl = import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678';
    this.workflowId = import.meta.env.VITE_N8N_WORKFLOW_ID || 'phJFt9t02Ssy2ADE';
  }

  /**
   * Convert entity selection to owner_full_name array based on entity mappings
   */
  private async getOwnerNames(entityType: string, entityName: string, entityMappings: any): Promise<string[]> {
    switch (entityType) {
      case 'dpe':
        // For DPE, return the DPE name directly
        return [entityName];

      case 'squad':
        // For Squad, get all DPEs mapped to this squad
        const dpeNames: string[] = [];
        if (entityMappings?.dpeToSquad) {
          Object.entries(entityMappings.dpeToSquad).forEach(([dpeName, squadName]) => {
            if (squadName === entityName) {
              dpeNames.push(dpeName);
            }
          });
        }
        return dpeNames;

      case 'team':
        // For Team, get all DPEs from all squads in this team
        const teamDpeNames: string[] = [];
        if (entityMappings?.squadToTeam && entityMappings?.dpeToSquad) {
          // First, find all squads in this team
          const squadsInTeam: string[] = [];
          Object.entries(entityMappings.squadToTeam).forEach(([squadName, teamName]) => {
            if (teamName === entityName) {
              squadsInTeam.push(squadName);
            }
          });

          // Then, find all DPEs in those squads
          Object.entries(entityMappings.dpeToSquad).forEach(([dpeName, squadName]) => {
            if (squadsInTeam.includes(squadName as string)) {
              teamDpeNames.push(dpeName);
            }
          });
        }
        return teamDpeNames;

      default:
        return [];
    }
  }

  /**
   * Format date range for n8n workflow query
   */
  private formatDateRange(from: Date, to: Date): string {
    const fromStr = from.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const toStr = to.toISOString().replace(/\.\d{3}Z$/, 'Z');
    return `${fromStr} TO ${toStr}`;
  }

  /**
   * Generate case report by triggering n8n workflow
   */
  async generateCaseReport(params: CaseReportParams, entityMappings: any): Promise<{
    cases: CaseData[];
    sctReport: SCTReport[];
  }> {
    try {
      // Get owner names based on entity selection
      const ownerNames = await this.getOwnerNames(params.entityType, params.entityName, entityMappings);

      if (ownerNames.length === 0) {
        throw new Error(`No DPEs found for ${params.entityType}: ${params.entityName}`);
      }

      // Format date range
      const dateRange = this.formatDateRange(params.dateRange.from, params.dateRange.to);

      // Prepare n8n workflow payload
      const workflowPayload = {
        workflowData: {
          owner_full_names: ownerNames,
          closed_date_range: dateRange,
          entity_type: params.entityType,
          entity_name: params.entityName
        }
      };

      console.log('Triggering n8n workflow with payload:', workflowPayload);

      // Trigger n8n workflow (manual trigger)
      const response = await fetch(`${this.baseUrl}/api/v1/workflows/${this.workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowPayload),
      });

      if (!response.ok) {
        throw new Error(`N8n workflow execution failed: ${response.statusText}`);
      }

      const result = await response.json();

      // For now, return mock data structure until n8n integration is fully configured
      return this.getMockCaseData(ownerNames, params.dateRange);

    } catch (error) {
      console.error('Error generating case report:', error);
      throw error;
    }
  }

  /**
   * Mock data for testing until n8n integration is complete
   */
  private getMockCaseData(ownerNames: string[], dateRange: { from: Date; to: Date }): {
    cases: CaseData[];
    sctReport: SCTReport[];
  } {
    const mockCases: CaseData[] = ownerNames.flatMap((owner, index) => [
      {
        case_id: `TM-${12345 + index}01`,
        priority: 'High',
        owner_full_name: owner,
        title: 'Sample Case 1 - Security Issue',
        products: ['Trend Micro Apex One'],
        status: 'Resolved',
        created_date: new Date(dateRange.from.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        closed_date: new Date(dateRange.from.getTime() + Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
        case_age_days: Math.floor(Math.random() * 10) + 1,
        structured_email_thread: 'Mock email thread data...'
      },
      {
        case_id: `TM-${12345 + index}02`,
        priority: 'Medium',
        owner_full_name: owner,
        title: 'Sample Case 2 - Configuration Help',
        products: ['Trend Micro Deep Security'],
        status: 'Resolved',
        created_date: new Date(dateRange.from.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        closed_date: new Date(dateRange.from.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString(),
        case_age_days: Math.floor(Math.random() * 15) + 1,
        structured_email_thread: 'Mock email thread data...'
      }
    ]);

    // Calculate SCT report
    const sctReport: SCTReport[] = ownerNames.map(owner => {
      const ownerCases = mockCases.filter(c => c.owner_full_name === owner);
      const avgSct = ownerCases.reduce((sum, c) => sum + c.case_age_days, 0) / ownerCases.length;
      
      return {
        owner_full_name: owner,
        sct: Math.round(avgSct * 100) / 100,
        case_count: ownerCases.length
      };
    });

    return { cases: mockCases, sctReport };
  }

  /**
   * Get workflow status by testing webhook availability
   */
  async getWorkflowStatus(): Promise<{ isActive: boolean; lastExecution?: string }> {
    try {
      // Test the actual webhook endpoint through proxy
      const webhookUrl = '/api/n8n/webhook-test/dpe-performance';
      
      const response = await fetch(webhookUrl, {
        method: 'GET', // Use GET to check availability
      });
      
      // If webhook responds (even with 404 for GET), it means workflow is active
      // N8n returns 404 for GET on POST-only webhooks, but that means it's active
      const isActive = response.status === 404 || (response.status >= 200 && response.status < 300);
      
      // Only log if there's an unexpected error (not 404)
      if (!isActive && response.status !== 404) {
        console.warn(`Unexpected webhook response status: ${response.status}`);
      }
      
      return {
        isActive,
        lastExecution: new Date().toISOString()
      };
    } catch (error) {
      // Only log network errors, not expected 404s
      console.warn('Network error checking workflow status:', error);
      return { isActive: false };
    }
  }
}

export const n8nWorkflowService = new N8nWorkflowService();