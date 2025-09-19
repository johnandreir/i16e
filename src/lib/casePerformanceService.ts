// Case performance service that connects to MongoDB via API server
// This fetches real case data from MongoDB instead of using mock data

export interface CaseData {
  case_id: string;
  priority: string;
  owner_full_name: string;
  title: string;
  products: string[];
  status: string;
  created_date: string;
  closed_date?: string;
  case_age_days: number;
  structured_email_thread?: string;
}

export interface PerformanceData {
  owner: string;
  sct: number;
  totalCases: number;
  closedCases: number;
  openCases: number;
  cases: CaseData[];
}

export interface CaseStatistics {
  totalCases: number;
  closedCases: number;
  averageSCT: number;
  satisfactionRate: number;
}

export default class CasePerformanceService {
  private static readonly MONGODB_API_BASE_URL = 'http://localhost:3001/api';
  
  // Fetch all cases from MongoDB
  private static async getAllCasesFromMongoDB(): Promise<CaseData[]> {
    try {
      console.log('Fetching cases from MongoDB...');
      
      const response = await fetch(`${this.MONGODB_API_BASE_URL}/cases`);
      if (!response.ok) {
        throw new Error(`MongoDB API server returned ${response.status}: ${response.statusText}. Please ensure MongoDB is running and accessible.`);
      }
      
      const cases = await response.json();
      
      if (!cases || cases.length === 0) {
        console.warn('No cases found in MongoDB database.');
        return []; // Return empty array instead of sample data
      }
      
      console.log(`Fetched ${cases.length} cases from MongoDB`);
      
      // Transform MongoDB date format to string format for compatibility
      return cases.map((caseItem: any) => ({
        case_id: caseItem.case_id,
        priority: caseItem.priority,
        owner_full_name: caseItem.owner_full_name,
        title: caseItem.title,
        products: caseItem.products || [],
        status: caseItem.status,
        created_date: caseItem.created_date.split('T')[0], // Convert to YYYY-MM-DD format
        closed_date: caseItem.closed_date ? caseItem.closed_date.split('T')[0] : undefined,
        case_age_days: caseItem.case_age_days,
        structured_email_thread: caseItem.structured_email_thread
      }));
      
    } catch (error) {
      console.error('Error fetching cases from MongoDB:', error);
      throw new Error(`Failed to connect to MongoDB API server: ${error.message}`);
    }
  }

  static async getPerformanceOverview(): Promise<PerformanceData[]> {
    try {
      console.log('Fetching performance overview data from MongoDB...');
      
      const allCases = await this.getAllCasesFromMongoDB();
      
      // Use last 30 days as default time range
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Filter cases by time range - considering both created_date and closed_date for the range
      const filteredCases = allCases.filter(caseItem => {
        const createdDate = new Date(caseItem.created_date);
        const closedDate = caseItem.closed_date ? new Date(caseItem.closed_date) : null;
        
        // Include cases that were created in range OR closed in range
        const createdInRange = createdDate >= thirtyDaysAgo && createdDate <= now;
        const closedInRange = closedDate && closedDate >= thirtyDaysAgo && closedDate <= now;
        
        return createdInRange || closedInRange;
      });

      // Group cases by owner
      const groupedCases = new Map<string, CaseData[]>();
      
      filteredCases.forEach(caseItem => {
        const owner = caseItem.owner_full_name;
        if (!groupedCases.has(owner)) {
          groupedCases.set(owner, []);
        }
        groupedCases.get(owner)!.push(caseItem);
      });

      // Calculate performance metrics for each owner
      const performanceData: PerformanceData[] = [];
      
      groupedCases.forEach((cases, owner) => {
        // Filter for closed cases within the time range
        const closedCasesInRange = cases.filter(c => {
          if (c.status.toLowerCase() !== 'closed' && c.status.toLowerCase() !== 'resolved' || !c.closed_date) return false;
          
          const closedDate = new Date(c.closed_date);
          return closedDate >= thirtyDaysAgo && closedDate <= now;
        });
        
        // Calculate SCT as average days of closed cases in the selected time range
        const sct = closedCasesInRange.length > 0 
          ? Math.round(closedCasesInRange.reduce((sum, c) => {
              // Calculate days between created and closed date
              const createdDate = new Date(c.created_date);
              const closedDate = new Date(c.closed_date!);
              const daysDiff = Math.ceil((closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
              return sum + daysDiff;
            }, 0) / closedCasesInRange.length)
          : 0;

        const totalCases = cases.length;
        const closedCases = closedCasesInRange.length; // Only closed cases in time range
        const openCases = cases.filter(c => c.status.toLowerCase() !== 'closed' && c.status.toLowerCase() !== 'resolved').length;

        // Only include owners that have closed cases in the time range
        if (closedCases > 0) {
          performanceData.push({
            owner,
            sct,
            totalCases,
            closedCases,
            openCases,
            cases: closedCasesInRange // Only show closed cases for drill-down
          });
        }
      });

      // Sort by SCT (ascending - better performance first)
      const sortedData = performanceData.sort((a, b) => a.sct - b.sct);
      
      console.log(`Generated performance overview for ${sortedData.length} owners with closed cases in last 30 days from MongoDB`);
      return sortedData;
      
    } catch (error) {
      console.error('Error getting performance overview from MongoDB:', error);
      throw new Error('Failed to get performance overview from MongoDB');
    }
  }
  
  static async getPerformanceOverviewByDateRange(startDate: Date, endDate: Date): Promise<PerformanceData[]> {
    try {
      console.log('Fetching performance overview data for date range from MongoDB:', { startDate, endDate });
      
      const allCases = await this.getAllCasesFromMongoDB();
      
      // Filter cases by time range - considering both created_date and closed_date for the range
      const filteredCases = allCases.filter(caseItem => {
        const createdDate = new Date(caseItem.created_date);
        const closedDate = caseItem.closed_date ? new Date(caseItem.closed_date) : null;
        
        // Include cases that were created in range OR closed in range
        const createdInRange = createdDate >= startDate && createdDate <= endDate;
        const closedInRange = closedDate && closedDate >= startDate && closedDate <= endDate;
        
        return createdInRange || closedInRange;
      });

      // Group cases by owner
      const groupedCases = new Map<string, CaseData[]>();
      
      filteredCases.forEach(caseItem => {
        const owner = caseItem.owner_full_name;
        if (!groupedCases.has(owner)) {
          groupedCases.set(owner, []);
        }
        groupedCases.get(owner)!.push(caseItem);
      });

      // Calculate performance metrics for each owner
      const performanceData: PerformanceData[] = [];
      
      groupedCases.forEach((cases, owner) => {
        // Filter for closed cases within the time range
        const closedCasesInRange = cases.filter(c => {
          if (c.status.toLowerCase() !== 'closed' && c.status.toLowerCase() !== 'resolved' || !c.closed_date) return false;
          
          const closedDate = new Date(c.closed_date);
          return closedDate >= startDate && closedDate <= endDate;
        });
        
        // Calculate SCT as average days of closed cases in the selected time range
        const sct = closedCasesInRange.length > 0 
          ? Math.round(closedCasesInRange.reduce((sum, c) => {
              // Calculate days between created and closed date
              const createdDate = new Date(c.created_date);
              const closedDate = new Date(c.closed_date!);
              const daysDiff = Math.ceil((closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
              return sum + daysDiff;
            }, 0) / closedCasesInRange.length)
          : 0;

        const totalCases = cases.length;
        const closedCases = closedCasesInRange.length; // Only closed cases in time range
        const openCases = cases.filter(c => c.status.toLowerCase() !== 'closed' && c.status.toLowerCase() !== 'resolved').length;

        // Only include owners that have closed cases in the time range
        if (closedCases > 0) {
          performanceData.push({
            owner,
            sct,
            totalCases,
            closedCases,
            openCases,
            cases: closedCasesInRange // Only show closed cases for drill-down
          });
        }
      });

      // Sort by SCT (ascending - better performance first)
      const sortedData = performanceData.sort((a, b) => a.sct - b.sct);
      
      console.log(`Generated performance overview for ${sortedData.length} owners with closed cases in date range from MongoDB`);
      return sortedData;
      
    } catch (error) {
      console.error('Error getting performance overview by date range from MongoDB:', error);
      throw new Error('Failed to get performance overview by date range from MongoDB');
    }
  }

  static async getCaseStatistics(): Promise<CaseStatistics> {
    try {
      console.log('Fetching case statistics from MongoDB...');
      
      const allCases = await this.getAllCasesFromMongoDB();
      const totalCases = allCases.length;
      const closedCases = allCases.filter(c => c.status.toLowerCase() === 'closed' || c.status.toLowerCase() === 'resolved').length;
      
      // Calculate average SCT from all closed cases
      const closedCasesList = allCases.filter(c => (c.status.toLowerCase() === 'closed' || c.status.toLowerCase() === 'resolved') && c.closed_date);
      const averageSCT = closedCasesList.length > 0 
        ? Math.round(closedCasesList.reduce((sum, c) => {
            const createdDate = new Date(c.created_date);
            const closedDate = new Date(c.closed_date!);
            const daysDiff = Math.ceil((closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0) / closedCasesList.length * 10) / 10 // Round to 1 decimal
        : 0;
      
      const stats: CaseStatistics = {
        totalCases,
        closedCases,
        averageSCT,
        satisfactionRate: 87 // This could be calculated from actual data if available
      };
      
      console.log('Case statistics from MongoDB:', stats);
      return stats;
      
    } catch (error) {
      console.error('Error getting case statistics from MongoDB:', error);
      throw new Error('Failed to get case statistics from MongoDB');
    }
  }

  static async getCasesByOwners(ownerNames: string[]): Promise<CaseData[]> {
    try {
      if (!ownerNames || ownerNames.length === 0) {
        console.log('No owner names provided, returning empty array');
        return [];
      }
      
      console.log('Fetching cases for owners from MongoDB:', ownerNames);
      
      const allCases = await this.getAllCasesFromMongoDB();
      const filteredCases = allCases.filter(c => ownerNames.includes(c.owner_full_name));
      
      console.log(`Found ${filteredCases.length} cases for specified owners from MongoDB`);
      return filteredCases;
      
    } catch (error) {
      console.error('Error getting cases by owners from MongoDB:', error);
      throw new Error('Failed to get cases by owners from MongoDB');
    }
  }
}
