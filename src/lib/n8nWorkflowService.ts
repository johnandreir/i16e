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
  private n8nDirectUrl: string;
  private workflowId: string;
  // High SCT Email Scrubber webhook path confirmed from n8n workflow
  private analyzeSctWebhookPath: string = '/webhook-test/analyze-sct';

  constructor() {
    // Use backend API proxy endpoints to avoid CORS issues
    this.baseUrl = 'http://localhost:3001/api/n8n';
    // Direct URL to n8n for direct webhook calls
    this.n8nDirectUrl = 'http://localhost:5678';
    this.workflowId = import.meta.env.VITE_N8N_WORKFLOW_ID || 'phJFt9t02Ssy2ADE';
  }

  /**
   * Initialize webhooks by making a lightweight test call
   * This helps "warm up" the n8n webhook system
   */
  async initializeWebhooks(): Promise<void> {
    console.log('🚀 Initializing n8n webhooks...');
    
    const testPayload = {
      entity_type: "initialization_test",
      entity_name: "Webhook Initialization",
      cases_data: []
    };

    try {
      // Test the Analyze SCT webhook
      const response = await fetch(`${this.n8nDirectUrl}${this.analyzeSctWebhookPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        console.log('✅ High SCT Email Scrubber webhook initialized successfully');
      } else {
        console.log('⚠️ High SCT Email Scrubber webhook returned status:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Failed to initialize High SCT Email Scrubber webhook:', error.message);
    }

    // Small delay to let n8n process
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Manually warm up webhooks - call this when your dashboard loads
   * to ensure webhooks are ready before user interactions
   */
  async warmUpWebhooks(): Promise<boolean> {
    try {
      console.log('🔥 Warming up n8n webhooks...');
      await this.initializeWebhooks();
      console.log('🔥 Webhook warm-up completed');
      return true;
    } catch (error) {
      console.error('🔥 Webhook warm-up failed:', error);
      return false;
    }
  }

  /**
   * Process the result from the webhook call and format it as expected by the UI
   * Only uses data directly from the workflow response without auto-generating content
   */
  private processResult(result: any, totalItems: number): any {
    console.log('🔍 processResult called with:', { result, totalItems });
    console.log('🔍 result type:', typeof result);
    console.log('🔍 result isArray:', Array.isArray(result));
    console.log('🔍 result structure:', JSON.stringify(result, null, 2));
    
    // Handle array output from High SCT Email Scrubber workflow
    if (Array.isArray(result)) {
      console.log('📋 ✅ DETECTED ARRAY - Processing High SCT Email Scrubber array output, length:', result.length);
      console.log('📋 Returning array directly to frontend');
      // Return the array directly for frontend to handle
      return result;
    }
    
    // Check if this is High SCT Email Scrubber output format
    console.log('🔍 Checking High SCT format properties:', {
      hasEmailAnalysis: !!(result.email_sentiment_analysis),
      hasDelayAnalysis: !!(result.case_handoffs_and_delays), 
      hasSummary: !!(result.summary)
    });
    
    if (result.email_sentiment_analysis || result.case_handoffs_and_delays || result.summary) {
      console.log('📧 ✅ DETECTED HIGH SCT FORMAT - Returning raw result');
      return result;
    }
    
    // Handle wrapped High SCT Email Scrubber format (in case it's wrapped in a data object)
    console.log('🔍 Checking wrapped High SCT format:', {
      hasData: !!(result.data),
      hasWrappedEmailAnalysis: !!(result.data?.email_sentiment_analysis),
      hasWrappedDelayAnalysis: !!(result.data?.case_handoffs_and_delays),
      hasWrappedSummary: !!(result.data?.summary)
    });
    
    if (result.data && (result.data.email_sentiment_analysis || result.data.case_handoffs_and_delays || result.data.summary)) {
      console.log('📧 ✅ DETECTED WRAPPED HIGH SCT FORMAT - Returning unwrapped data');
      return result.data;
    }
    
    // Handle standard object output format (fallback)
    console.log('⚠️ FALLING BACK TO STRUCTURED FORMAT - High SCT format not detected');
    console.log('🔄 This means your workflow result will be converted to old format');
    
    const workflowMetrics = result.data?.metrics || {};
    
    // Determine which insight formatter to use based on result content
    const insights = result.data?.survey_sentiment_analysis || result.data?.survey_data
      ? this.formatInsightsFromSurveyResults(result)
      : this.formatInsightsFromSCTResults(result);
    
    console.log('📊 Using structured format with insights:', insights);
    
    return {
      success: true,
      data: {
        insights: insights,
        metrics: {
          totalCases: workflowMetrics.totalCases || totalItems,
          averageSCT: workflowMetrics.averageSCT || result.data?.sct_metrics?.[0]?.sct || 0,
          trend: workflowMetrics.trend || '',
          insight: workflowMetrics.insight || result.data?.summary?.areas_for_improvement?.[0] || ''
        },
        cases: result.data?.cases_analyzed || []
      }
    };
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

      // Use backend proxy endpoint for N8N workflow execution
      const response = await fetch(`${this.baseUrl}/calculate-metrics`, {
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
      
      // Process and return the real data from n8n
      return {
        cases: result.data?.cases_analyzed || [],
        sctReport: result.data?.sct_metrics || []
      };

    } catch (error) {
      console.error('Error generating case report:', error);
      throw error;
    }
  }

  /**
   * This method used to contain mock data but has been removed as we're now using real data from n8n
   * If mock data is needed for testing, it should be implemented in a separate testing module
   */
  // Mock data implementation removed

  /**
   * Trigger the Analyze SCT workflow directly in n8n
   */
  async analyzeSCT(entityType: string, entityName: string, casesData: CaseData[], retryWithInitialization: boolean = true): Promise<any> {
    try {
      console.log('Triggering Analyze SCT workflow directly on n8n...');
      
      // Prepare payload for the Analyze SCT workflow
      const workflowPayload = {
        entity_type: entityType,
        entity_name: entityName,
        cases_data: casesData
      };

      // Try to call n8n webhook directly first
      try {
        console.log('🚀 Initiating High SCT Email Scrubber workflow...');
        console.log(`� Webhook URL: ${this.n8nDirectUrl}${this.analyzeSctWebhookPath}`);
        console.log(`📊 Sending ${casesData.length} cases for analysis`);
        console.log('⏳ Please wait while workflow processes the data...');
        
        const directResponse = await fetch(`${this.n8nDirectUrl}${this.analyzeSctWebhookPath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workflowPayload),
          // Set a timeout to fail fast if n8n is not responding
          signal: AbortSignal.timeout(30000) // 30 seconds for High SCT Email Scrubber processing
        });

        if (!directResponse.ok) {
          throw new Error(`Direct n8n webhook returned status: ${directResponse.status}`);
        }
        
        console.log('✅ High SCT Email Scrubber workflow completed successfully!');
        console.log('📥 Receiving workflow results...');
        const rawResult = await directResponse.json();
        console.log('🔍 Raw webhook response:', rawResult);
        console.log('🔍 Raw response type:', typeof rawResult);
        console.log('🔍 Raw response isArray:', Array.isArray(rawResult));
        const processedResult = this.processResult(rawResult, casesData.length);
        console.log('📊 Processed result:', processedResult);
        return processedResult;
      } catch (directError) {
        // If direct call fails and we haven't tried initialization yet, try initializing webhooks first
        if (retryWithInitialization && (directError.message.includes('404') || directError.message.includes('connection') || directError.message.includes('fetch'))) {
          console.warn(`Direct webhook failed: ${directError.message}`);
          console.log('🔄 Attempting to initialize webhooks and retry...');
          
          try {
            await this.initializeWebhooks();
            // Retry the call without initialization flag to prevent infinite recursion
            return await this.analyzeSCT(entityType, entityName, casesData, false);
          } catch (initError) {
            console.warn('Webhook initialization failed, falling back to API proxy');
          }
        }
        
        // If direct call fails, fall back to API proxy
        console.warn(`Direct n8n webhook call failed: ${directError.message}`);
        console.log('Falling back to API server proxy...');
        
        const response = await fetch(`${this.baseUrl}/analyze-sct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workflowPayload),
        });
        
        if (!response.ok) {
          throw new Error(`Analyze SCT workflow execution failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('🔍 API proxy raw result:', result);
        const processedResult = this.processResult(result, casesData.length);
        console.log('📊 API proxy processed result:', processedResult);
        return processedResult;
      }

      // This should never be reached now as both paths return directly
      throw new Error('No response from either direct webhook or API proxy');
    } catch (error) {
      console.error('Error triggering Analyze SCT workflow:', error);
      throw error;
    }
  }

  /**
   * Trigger the Analyze Survey workflow directly in n8n
   */
  async analyzeSurvey(entityType: string, entityName: string, surveyData: any[]): Promise<any> {
    try {
      console.log('Triggering Analyze Survey workflow directly on n8n...');

      // Prepare payload for the Analyze Survey workflow
      const workflowPayload = {
        entity_type: entityType,
        entity_name: entityName,
        survey_data: surveyData
      };

      // Try to call n8n webhook directly first
      try {
        console.log('Attempting direct connection to n8n webhook...');
        const directResponse = await fetch(`${this.n8nDirectUrl}/webhook-test/analyze-survey`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workflowPayload),
          // Set a timeout to fail fast if n8n is not responding
          signal: AbortSignal.timeout(3000)
        });

        if (!directResponse.ok) {
          throw new Error(`Direct n8n webhook returned status: ${directResponse.status}`);
        }
        
        console.log('Direct n8n webhook call successful!');
        return this.processResult(await directResponse.json(), surveyData.length);
      } catch (directError) {
        // If direct call fails, fall back to API proxy
        console.warn(`Direct n8n webhook call failed: ${directError.message}`);
        console.log('Falling back to API server proxy...');
        
        const response = await fetch(`${this.baseUrl}/webhook/analyze-survey`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workflowPayload),
        });
        
        if (!response.ok) {
          throw new Error(`Analyze Survey workflow execution failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        return this.processResult(result, surveyData.length);
      }
    } catch (error) {
      console.error('Error triggering Analyze Survey workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow status by testing webhook availability
   */
  /**
   * Format insights from SCT workflow results
   */
  private formatInsightsFromSCTResults(result: any): any[] {
    // Use only insights directly provided by the workflow
    // No auto-generated fallbacks or default insights
    
    // Check if result contains insights directly
    if (result.data?.insights && Array.isArray(result.data.insights)) {
      return result.data.insights;
    }
    
    const insights = [];
    
    // If workflow provided specific analysis sections, convert them to insights
    
    // Add email sentiment analysis insights if available
    if (result.data?.email_sentiment_analysis && result.data.email_sentiment_analysis.length > 0) {
      result.data.email_sentiment_analysis.forEach((item: any, index: number) => {
        insights.push({
          id: `email-${index + 1}`,
          title: `Email Communication Analysis: Case ${item.case_id}`,
          description: item.problem,
          impact: 'High',
          category: 'communication',
          type: 'warning',
          recommendation: item.recommendations?.join('\n') || ''
        });
      });
    }

    // Add case handoffs and delays insights if available
    if (result.data?.case_handoffs_and_delays && result.data.case_handoffs_and_delays.length > 0) {
      result.data.case_handoffs_and_delays.forEach((item: any, index: number) => {
        insights.push({
          id: `delay-${index + 1}`,
          title: `Case Delay Analysis: Case ${item.case_id}`,
          description: item.problem,
          impact: 'Medium',
          category: 'process',
          type: 'error',
          recommendation: item.recommendations?.join('\n') || ''
        });
      });
    }
    
    // Use workflow-provided summary if available, but don't create artificial one
    if (result.data?.summary && insights.length > 0) {
      insights.unshift({
        id: 'summary-1',
        title: 'SCT Analysis Summary',
        description: result.data.summary.overview || '',
        impact: 'High',
        category: 'process',
        type: 'info',
        recommendation: result.data.summary.areas_for_improvement?.join('\n') || ''
      });
    }

    return insights;
  }

  /**
   * Format insights from Survey workflow results
   */
  private formatInsightsFromSurveyResults(result: any): any[] {
    // Use only insights directly provided by the workflow
    // No auto-generated fallbacks or default insights
    
    // Check if result contains insights directly
    if (result.data?.insights && Array.isArray(result.data.insights)) {
      return result.data.insights;
    }
    
    const insights = [];
    
    // If workflow provided specific analysis sections, convert them to insights
    
    // Add survey sentiment analysis insights if available
    if (result.data?.survey_sentiment_analysis && result.data.survey_sentiment_analysis.length > 0) {
      result.data.survey_sentiment_analysis.forEach((item: any, index: number) => {
        insights.push({
          id: `survey-${index + 1}`,
          title: `Customer Feedback: ${item.survey_type} Survey, Case ${item.case_id}`,
          description: item.problem,
          impact: 'High',
          category: 'satisfaction',
          type: item.survey_type === 'DSAT' ? 'error' : 'warning',
          recommendation: item.recommendations?.join('\n') || ''
        });
      });
    }
    
    // Use workflow-provided summary if available, but don't create artificial one
    if (result.data?.summary && Object.keys(result.data.summary).length > 0) {
      insights.unshift({
        id: 'summary-1',
        title: 'Survey Analysis Summary',
        description: result.data.summary.overview || '',
        impact: 'Medium',
        category: 'satisfaction',
        type: 'info',
        recommendation: result.data.summary.areas_for_improvement?.join('\n') || ''
      });
    }

    return insights;
  }

  /**
   * Calculate average SCT from case data
   */
  private calculateAverageSCT(casesData: CaseData[]): number {
    if (!casesData || casesData.length === 0) return 0;
    
    const sctValues = casesData
      .map(c => c.case_age_days)
      .filter(sct => sct !== undefined && sct > 0);
    
    if (sctValues.length === 0) return 0;
    
    return Math.round((sctValues.reduce((a, b) => a + b, 0) / sctValues.length) * 10) / 10;
  }

  /**
   * Calculate average rating from survey data
   */
  private calculateAverageRating(surveyData: any[]): string {
    if (!surveyData || surveyData.length === 0) return 'N/A';
    
    const ratings = surveyData
      .map(s => s.overallSatisfaction)
      .filter(r => r !== undefined && r > 0);
    
    if (ratings.length === 0) return 'N/A';
    
    return ((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
  }

  /**
   * Calculate percentage of surveys in a specific category
   */
  private calculatePercentage(surveyData: any[], category: string): number {
    if (!surveyData || surveyData.length === 0) return 0;
    
    const count = surveyData.filter(s => s.category === category).length;
    return Math.round((count / surveyData.length) * 100);
  }

  async getWorkflowStatus(): Promise<{ isActive: boolean; lastExecution?: string }> {
    try {
      // Use backend health endpoint to check N8N status
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const healthData = await response.json();
        // Check if both N8N workflows are active and webhooks are listening
        const workflowActive = healthData.n8nHealth?.n8nWorkflowStatus?.reachable;
        const webhooksActive = healthData.n8nHealth?.n8nWebhookStatus?.getCases?.reachable && 
                             healthData.n8nHealth?.n8nWebhookStatus?.calculateMetrics?.reachable;
        const isActive = workflowActive && webhooksActive;
        
        return {
          isActive,
          lastExecution: new Date().toISOString()
        };
      } else {
        return {
          isActive: false,
          lastExecution: undefined
        };
      }
    } catch (error) {
      // Only log network errors, not expected 404s
      console.warn('Network error checking workflow status:', error);
      return { isActive: false };
    }
  }
}

export const n8nWorkflowService = new N8nWorkflowService();