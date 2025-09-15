// Sample data generator for AMEA SMB DevOps structure
export interface SampleTeam {
  name: string;
  description: string;
  squads: SampleSquad[];
}

export interface SampleSquad {
  name: string;
  description: string;
  dpes: SampleDPE[];
}

export interface SampleDPE {
  name: string;
  email: string;
  performanceData?: SamplePerformanceData;
}

export interface SamplePerformanceData {
  sct: number; // Service Completion Time
  cases: number; // Number of cases handled
  satisfaction: number; // Customer satisfaction score (1-100)
}

/**
 * Generates realistic AMEA SMB organizational structure with teams, squads, and DPEs
 */
export function generateAMEASMBSampleData(): SampleTeam[] {
  return [
    {
      name: 'AMEA Digital Transformation',
      description: 'Digital transformation and modernization initiatives across AMEA region',
      squads: [
        {
          name: 'Cloud Migration Squad',
          description: 'Leading cloud migration and hybrid infrastructure deployment',
          dpes: [
            { name: 'Raj Patel', email: 'raj.patel@company.com', performanceData: generateRandomPerformance() },
            { name: 'Priya Sharma', email: 'priya.sharma@company.com', performanceData: generateRandomPerformance() },
            { name: 'Ahmed Al-Rashid', email: 'ahmed.alrashid@company.com', performanceData: generateRandomPerformance() }
          ]
        },
        {
          name: 'Platform Engineering Squad',
          description: 'Core platform development and DevOps automation',
          dpes: [
            { name: 'Liam Chen', email: 'liam.chen@company.com', performanceData: generateRandomPerformance() },
            { name: 'Fatima Hassan', email: 'fatima.hassan@company.com', performanceData: generateRandomPerformance() }
          ]
        }
      ]
    },
    {
      name: 'AMEA SMB Solutions',
      description: 'Specialized solutions and support for Small-Medium Business customers',
      squads: [
        {
          name: 'SMB DevOps Squad',
          description: 'DevOps solutions tailored for SMB customers',
          dpes: [
            { name: 'Arjun Krishnan', email: 'arjun.krishnan@company.com', performanceData: generateRandomPerformance() },
            { name: 'Zara Okafor', email: 'zara.okafor@company.com', performanceData: generateRandomPerformance() },
            { name: 'Hiroshi Tanaka', email: 'hiroshi.tanaka@company.com', performanceData: generateRandomPerformance() }
          ]
        },
        {
          name: 'SMB Infrastructure Squad',
          description: 'Infrastructure support and automation for SMB segment',
          dpes: [
            { name: 'Kavya Reddy', email: 'kavya.reddy@company.com', performanceData: generateRandomPerformance() },
            { name: 'Omar Abdelaziz', email: 'omar.abdelaziz@company.com', performanceData: generateRandomPerformance() }
          ]
        }
      ]
    },
    {
      name: 'AMEA Operations Excellence',
      description: 'Operational excellence and site reliability for AMEA region',
      squads: [
        {
          name: 'SRE AMEA Squad',
          description: 'Site reliability engineering and monitoring for AMEA operations',
          dpes: [
            { name: 'Ravi Kumar', email: 'ravi.kumar@company.com', performanceData: generateRandomPerformance() },
            { name: 'Leila Najafi', email: 'leila.najafi@company.com', performanceData: generateRandomPerformance() },
            { name: 'Wei Lin', email: 'wei.lin@company.com', performanceData: generateRandomPerformance() }
          ]
        },
        {
          name: 'Security & Compliance Squad',
          description: 'Security implementation and compliance for AMEA regulatory requirements',
          dpes: [
            { name: 'Sarah Kim', email: 'sarah.kim@company.com', performanceData: generateRandomPerformance() },
            { name: 'Mohammad Farhan', email: 'mohammad.farhan@company.com', performanceData: generateRandomPerformance() }
          ]
        }
      ]
    },
    {
      name: 'AMEA Customer Engineering',
      description: 'Customer-facing engineering solutions and technical support',
      squads: [
        {
          name: 'Customer Solutions Squad',
          description: 'Custom engineering solutions for enterprise customers',
          dpes: [
            { name: 'Deepika Mehta', email: 'deepika.mehta@company.com', performanceData: generateRandomPerformance() },
            { name: 'Yuki Nakamura', email: 'yuki.nakamura@company.com', performanceData: generateRandomPerformance() }
          ]
        },
        {
          name: 'Technical Support Squad',
          description: 'Advanced technical support and escalation handling',
          dpes: [
            { name: 'Nadia Boussetta', email: 'nadia.boussetta@company.com', performanceData: generateRandomPerformance() },
            { name: 'David Park', email: 'david.park@company.com', performanceData: generateRandomPerformance() },
            { name: 'Aisha Ogundimu', email: 'aisha.ogundimu@company.com', performanceData: generateRandomPerformance() }
          ]
        }
      ]
    }
  ];
}

/**
 * Generates realistic performance data with some variation
 */
function generateRandomPerformance(): SamplePerformanceData {
  // Generate realistic but varied performance metrics
  const baseScT = 15; // Base service completion time in minutes
  const baseCases = 45; // Base number of cases per month
  const baseSatisfaction = 85; // Base satisfaction score

  return {
    sct: Math.round(baseScT + (Math.random() - 0.5) * 10), // ±5 minutes variation
    cases: Math.round(baseCases + (Math.random() - 0.5) * 20), // ±10 cases variation
    satisfaction: Math.round(baseSatisfaction + (Math.random() - 0.5) * 20) // ±10 points variation
  };
}

/**
 * Gets the current date in YYYY-MM-DD format for performance metrics
 */
export function getCurrentPeriod(): { start: string; end: string } {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    start: startOfMonth.toISOString().split('T')[0],
    end: endOfMonth.toISOString().split('T')[0]
  };
}

/**
 * Flattens the hierarchical sample data for easy database insertion
 */
export interface FlatSampleData {
  teams: Array<{ name: string; description: string }>;
  squads: Array<{ name: string; teamName: string; description: string }>;
  dpes: Array<{ name: string; squadName: string; email: string; performance?: SamplePerformanceData }>;
}

export function flattenSampleData(sampleTeams: SampleTeam[]): FlatSampleData {
  const teams: Array<{ name: string; description: string }> = [];
  const squads: Array<{ name: string; teamName: string; description: string }> = [];
  const dpes: Array<{ name: string; squadName: string; email: string; performance?: SamplePerformanceData }> = [];

  sampleTeams.forEach(team => {
    teams.push({
      name: team.name,
      description: team.description
    });

    team.squads.forEach(squad => {
      squads.push({
        name: squad.name,
        teamName: team.name,
        description: squad.description
      });

      squad.dpes.forEach(dpe => {
        dpes.push({
          name: dpe.name,
          squadName: squad.name,
          email: dpe.email,
          performance: dpe.performanceData
        });
      });
    });
  });

  return { teams, squads, dpes };
}