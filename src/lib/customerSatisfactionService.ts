// Customer Satisfaction Service - fetches satisfaction data from MongoDB performance_data collection
// This service interfaces with the satisfaction data saved by the n8n Process Survey workflow

export interface SatisfactionData {
  csat: number;
  neutral: number;
  dsat: number;
  total: number;
  csatPercentage: number;
  neutralPercentage: number;
  dsatPercentage: number;
  lastUpdated: string;
  source: string;
}

export interface EntitySatisfactionData {
  entityName: string;
  entityType: string;
  entityId: string;
  owner_full_name: string;
  satisfactionData: SatisfactionData;
  surveyDetails: Array<{
    caseNumber: string;
    overallSatisfaction: number;
    category: string;
    feedback: string;
    surveyDate: string;
    customerName: string;
    productArea: string;
    ownerName: string;
  }>;
}

export interface ChartSurveyData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export default class CustomerSatisfactionService {
  private static readonly MONGODB_API_BASE_URL = 'http://localhost:3001/api';

  // Fetch satisfaction data for a specific entity from performance_data collection
  static async getEntitySatisfactionData(
    entityName: string, 
    entityType: string
  ): Promise<EntitySatisfactionData | null> {
    try {
      console.log(`Fetching satisfaction data for ${entityType}: ${entityName}`);
      
      // Query performance_data collection for this entity
      const response = await fetch(
        `${this.MONGODB_API_BASE_URL}/performance-data?entity_name=${encodeURIComponent(entityName)}`
      );
      
      if (!response.ok) {
        console.warn(`MongoDB API returned ${response.status} for satisfaction data`);
        return null;
      }
      
      const performanceRecords = await response.json();
      
      if (!performanceRecords || performanceRecords.length === 0) {
        console.log(`📭 No performance records found for ${entityType}: ${entityName}`);
        console.log('🔍 This might mean:');
        console.log('   - The aggregate workflow hasn\'t completed yet');
        console.log('   - The entity name doesn\'t match stored records');
        console.log('   - No satisfaction data was processed for this entity');
        return null;
      }
      
      console.log(`📊 Found ${performanceRecords.length} performance records for ${entityName}`);
      console.log('🔍 Records preview:', performanceRecords.map(r => ({
        entity_name: r.entity_name,
        date: r.date,
        hasMetrics: !!r.metrics,
        hasCustomerSatisfaction: !!r.metrics?.customerSatisfaction,
        metricsKeys: Object.keys(r.metrics || {})
      })));
      
      // Get the most recent record with satisfaction data
      const recentRecord = performanceRecords
        .filter((record: any) => record.metrics?.customerSatisfaction)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (!recentRecord) {
        console.log(`No satisfaction metrics found for ${entityType}: ${entityName}`);
        return null;
      }
      
      console.log(`✅ Found satisfaction data for ${entityName}:`, recentRecord.metrics.customerSatisfaction);
      console.log(`📊 Full performance record:`, {
        entity_name: recentRecord.entity_name,
        date: recentRecord.date,
        hasCustomerSatisfaction: !!recentRecord.metrics?.customerSatisfaction,
        hasSurveyDetails: !!recentRecord.surveyDetails,  // Check at root level now
        surveyDetailsLength: recentRecord.surveyDetails?.length || 0,  // Add length check
        sampleSurveyDetail: recentRecord.surveyDetails?.[0],  // Show first survey detail
        metricsKeys: Object.keys(recentRecord.metrics || {})
      });
      
      // Debug survey details extraction
      const extractedSurveyDetails = recentRecord.surveyDetails || [];
      console.log(`🔍 Extracting survey details: ${extractedSurveyDetails.length} items`);
      if (extractedSurveyDetails.length > 0) {
        console.log(`📝 First survey detail structure:`, extractedSurveyDetails[0]);
      }
      
      return {
        entityName,
        entityType,
        entityId: recentRecord.entity_id || recentRecord._id,
        owner_full_name: recentRecord.entity_name,
        satisfactionData: recentRecord.metrics.customerSatisfaction,
        surveyDetails: extractedSurveyDetails  // Use extracted variable for debugging
      };
      
    } catch (error) {
      console.error(`Error fetching satisfaction data for ${entityType}: ${entityName}`, error);
      return null;
    }
  }

  // Convert satisfaction data to chart format
  static formatSatisfactionDataForChart(satisfactionData: SatisfactionData): ChartSurveyData[] {
    const total = satisfactionData.total;
    
    if (total === 0) {
      return [];
    }
    
    return [
      {
        name: 'CSAT (4-5)',
        value: satisfactionData.csat,
        percentage: satisfactionData.csatPercentage,
        color: '#10b981' // green
      },
      {
        name: 'Neutral (3)',
        value: satisfactionData.neutral,
        percentage: satisfactionData.neutralPercentage,
        color: '#f59e0b' // amber
      },
      {
        name: 'DSAT (1-2)',
        value: satisfactionData.dsat,
        percentage: satisfactionData.dsatPercentage,
        color: '#ef4444' // red
      }
    ];
  }

  // Fetch satisfaction data for multiple entities (squad/team aggregation)
  static async getAggregatedSatisfactionData(
    entityNames: string[], 
    entityType: string
  ): Promise<SatisfactionData | null> {
    try {
      console.log(`🔄 Fetching aggregated satisfaction data for ${entityType} with ${entityNames.length} entities:`, entityNames);
      
      // If we don't have entity names, return null immediately
      if (entityNames.length === 0) {
        console.log(`❌ No entity names provided for ${entityType} aggregation`);
        return null;
      }
      
      const satisfactionPromises = entityNames.map(name => 
        this.getEntitySatisfactionData(name, 'dpe') // Individual DPEs
      );
      
      const results = await Promise.all(satisfactionPromises);
      console.log(`📊 Aggregation results: ${results.length} total, ${results.filter(r => r !== null).length} with data`);
      
      // Log which entities have data and which don't
      results.forEach((result, index) => {
        const entityName = entityNames[index];
        if (result) {
          console.log(`  ✅ ${entityName}: CSAT=${result.satisfactionData.csat}, Total=${result.satisfactionData.total}`);
        } else {
          console.log(`  ❌ ${entityName}: No satisfaction data found`);
        }
      });
      
      const validResults = results.filter(result => result !== null) as EntitySatisfactionData[];
      
      if (validResults.length === 0) {
        console.log(`❌ No satisfaction data found for any ${entityType} members`);
        
        console.log(`No satisfaction data found for ${entityType} - returning null`);
        return null;
        
        return null;
      }
      
      // Aggregate satisfaction metrics
      const totalCsat = validResults.reduce((sum, result) => sum + result.satisfactionData.csat, 0);
      const totalNeutral = validResults.reduce((sum, result) => sum + result.satisfactionData.neutral, 0);
      const totalDsat = validResults.reduce((sum, result) => sum + result.satisfactionData.dsat, 0);
      const total = totalCsat + totalNeutral + totalDsat;
      
      console.log(`📊 Aggregated totals: CSAT=${totalCsat}, Neutral=${totalNeutral}, DSAT=${totalDsat}, Total=${total}`);
      
      if (total === 0) {
        console.log(`❌ Aggregated total is 0, returning null`);
        return null;
      }
      
      const csatPercentage = Math.round((totalCsat / total) * 100);
      const neutralPercentage = Math.round((totalNeutral / total) * 100);
      const dsatPercentage = Math.round((totalDsat / total) * 100);
      
      console.log(`📊 Aggregated percentages: CSAT=${csatPercentage}%, Neutral=${neutralPercentage}%, DSAT=${dsatPercentage}%`);
      
      return {
        csat: totalCsat,
        neutral: totalNeutral,
        dsat: totalDsat,
        total,
        csatPercentage,
        neutralPercentage,
        dsatPercentage,
        lastUpdated: new Date().toISOString(),
        source: 'aggregated-satisfaction-data'
      };
      
    } catch (error) {
      console.error(`Error fetching aggregated satisfaction data for ${entityType}`, error);
      return null;
    }
  }

  // Health check for the satisfaction data endpoint
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.MONGODB_API_BASE_URL}/performance-data?limit=1`);
      return response.ok;
    } catch (error) {
      console.error('Satisfaction service health check failed:', error);
      return false;
    }
  }
}