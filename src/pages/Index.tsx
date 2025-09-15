import React, { useState, useEffect } from 'react';
import { Clock, Users, ThumbsUp, ThumbsDown, BarChart3, TrendingUp, Settings, PieChart } from 'lucide-react';
import FilterSection from '@/components/dashboard/FilterSection';
import KPICard from '@/components/dashboard/KPICard';
import TeamPerformanceChart from '@/components/dashboard/TeamPerformanceChart';
import SurveyAnalysisChart from '@/components/dashboard/SurveyAnalysisChart';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import DetailedStatsModal from '@/components/dashboard/DetailedStatsModal';
import EntityManagementDialog from '@/components/dashboard/EntityManagementDialog';
import QuickEntityAdd from '@/components/dashboard/QuickEntityAdd';
import ThemeToggle from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { useEntityDatabase } from '@/hooks/useEntityDatabase';
import i16eLogoLight from '@/assets/i16e-logo-light.jpeg';
import i16eLogoDark from '@/assets/i16e-logo-dark.jpeg';

interface TeamMember {
  name: string;
  sct: number;
  cases: number;
  satisfaction: number;
}

const Index = () => {
  const { toast } = useToast();
  
  // Database hook for persistent entity management
  const {
    entityData,
    entityMappings,
    isLoading: dbLoading,
    error: dbError,
    refreshData,
    getDashboardData,
    migrateLegacyData,
    createTeam,
    createSquad,
    createDPE,
    updateTeam,
    updateSquad,
    updateDPE,
    deleteTeam,
    deleteSquad,
    deleteDPE,
    debugDatabaseContents,
    getTeamsWithIds,
    getSquadsWithIds,
    getDPEsWithIds
  } = useEntityDatabase();

  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedEntityValue, setSelectedEntityValue] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(2024, 7, 1), // Aug 1, 2024
    to: new Date(2024, 7, 31),  // Aug 31, 2024
  });
  const [isLoading, setIsLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalType, setModalType] = useState<'team' | 'survey' | 'individual'>('team');
  const [modalTitle, setModalTitle] = useState('');
  const [sctAnalyzed, setSctAnalyzed] = useState(false);
  const [cxAnalyzed, setCxAnalyzed] = useState(false);
  const [entityChanged, setEntityChanged] = useState(false);
  const [entityRefreshKey, setEntityRefreshKey] = useState(Date.now());

  // Separate state for generated report data - only updates when Generate Report is clicked
  const [generatedEntity, setGeneratedEntity] = useState('');
  const [generatedEntityValue, setGeneratedEntityValue] = useState('');
  const [generatedTimeRange, setGeneratedTimeRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  // Enhanced sample data with more realistic metrics (no negative values)
  const sampleTeamData = [
    { name: 'Juan Dela Cruz', sct: 16, cases: 45, satisfaction: 87 },
    { name: 'Maria Santos', sct: 12, cases: 52, satisfaction: 92 },
    { name: 'Carlos Rodriguez', sct: 20, cases: 38, satisfaction: 78 },
    { name: 'Ana Garcia', sct: 14, cases: 48, satisfaction: 89 },
    { name: 'Miguel Torres', sct: 18, cases: 41, satisfaction: 85 },
    { name: 'Sofia Lopez', sct: 11, cases: 55, satisfaction: 94 },
    { name: 'Diego Martinez', sct: 22, cases: 35, satisfaction: 76 },
    { name: 'Isabella Chen', sct: 15, cases: 47, satisfaction: 88 },
  ];

  const sampleSurveyData = [
    { name: 'CSAT (4-5)', value: 312, percentage: 78, color: 'hsl(var(--kpi-success))' },
    { name: 'Neutral (3)', value: 64, percentage: 16, color: 'hsl(var(--kpi-warning))' },
    { name: 'DSAT (1-2)', value: 24, percentage: 6, color: 'hsl(var(--kpi-danger))' },
  ];

  // Additional sample data for different views
  const individualDPEData = {
    sct: 12,
    cases: 45,
    satisfaction: 87,
    neutral: 8,
    dissatisfied: 5,
    totalSurveys: 42
  };

  const teamAverages = {
    sct: 15.5,
    cases: 224,
    satisfaction: 86,
    totalMembers: 8
  };

  const sampleInsights = [
    {
      id: '1',
      type: 'improvement' as const,
      title: 'Carlos Rodriguez - High SCT Alert',
      description: 'Carlos has the highest Solution Cycle Time at 20 days, 25% above team average of 15.2 days.',
      recommendation: 'Review case complexity distribution and provide advanced troubleshooting training. Consider pairing with Maria Santos for knowledge transfer.',
      member: 'Carlos R.'
    },
    {
      id: '2',
      type: 'improvement' as const,
      title: 'Diego Martinez - Performance Concern',
      description: 'Diego shows 22-day SCT with lowest satisfaction rate (76%). Case handoffs detected in 40% of assignments.',
      recommendation: 'Implement dedicated case ownership protocol and provide customer communication training.',
      member: 'Diego M.'
    },
    {
      id: '3',
      type: 'success' as const,
      title: 'Sofia Lopez - Excellence Recognition',
      description: 'Sofia leads with 11-day SCT and 94% CSAT, handling the highest case volume (55 cases).',
      recommendation: 'Promote Sofia as team lead mentor and document her best practices for team adoption.',
      member: 'Sofia L.'
    },
    {
      id: '4',
      type: 'success' as const,
      title: 'Maria Santos - Consistent Top Performer',
      description: 'Maria maintains excellent metrics: 12-day SCT and 92% CSAT with strong technical resolution skills.',
      recommendation: 'Assign Maria to complex enterprise cases and have her lead knowledge sharing sessions.',
      member: 'Maria S.'
    },
    {
      id: '5',
      type: 'warning' as const,
      title: 'Case Handoff Pattern Detected',
      description: 'Analysis shows 18% of cases have multiple handoffs, increasing average SCT by 35%.',
      recommendation: 'Implement skill-based routing and establish clear escalation procedures to reduce handoffs.'
    },
    {
      id: '6',
      type: 'info' as const,
      title: 'Weekend Response Time Impact',
      description: 'Cases created on weekends show 28% longer resolution times due to reduced staffing.',
      recommendation: 'Consider weekend on-call rotation or implement automated triage for weekend cases.'
    },
    {
      id: '7',
      type: 'warning' as const,
      title: 'Survey Response Rate Declining',
      description: 'Customer survey response rate dropped to 65% this month from 78% last month.',
      recommendation: 'Implement follow-up survey reminders and consider incentivizing survey completion.'
    }
  ];

  const handleEntityChange = (entity: string) => {
    setSelectedEntity(entity);
    setSelectedEntityValue('');
    if (reportGenerated) {
      setEntityChanged(true);
    }
  };

  const handleEntityValueChange = (value: string) => {
    setSelectedEntityValue(value);
    if (reportGenerated) {
      setEntityChanged(true);
    }
  };

  const handleTimeRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setSelectedTimeRange(range);
    if (reportGenerated) {
      setEntityChanged(true);
    }
  };

  // Check if analysis buttons should be enabled
  const isAnalysisEnabled = selectedEntity && selectedEntityValue && !selectedEntityValue.includes('Add New') && reportGenerated;

  const handleGenerateReport = async () => {
    // Validate entity selection
    if (!selectedEntity || !selectedEntityValue || selectedEntityValue.includes('Add New')) {
      toast({
        title: "Invalid Selection",
        description: "Please select a valid entity before generating the report.",
        variant: "destructive"
      });
      return;
    }

    // Validate date range selection
    if (!selectedTimeRange.from || !selectedTimeRange.to) {
      toast({
        title: "Invalid Date Range",
        description: "Please select a valid date range before generating the report.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    console.log('handleGenerateReport: Setting generated values - entity:', selectedEntity, 'value:', selectedEntityValue);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setReportGenerated(true);
      setEntityChanged(false);
      
      // Store the generated report data when report is successfully created
      setGeneratedEntity(selectedEntity);
      setGeneratedEntityValue(selectedEntityValue);
      setGeneratedTimeRange({
        from: selectedTimeRange.from,
        to: selectedTimeRange.to
      });
      
      console.log('handleGenerateReport: Generated values set - entity:', selectedEntity, 'value:', selectedEntityValue);
      
      // Clear previous analysis when generating new report
      setSctAnalyzed(false);
      setCxAnalyzed(false);
      
      toast({
        title: "Report Generated Successfully",
        description: `KPI analysis for ${selectedEntityValue} from ${selectedTimeRange.from?.toLocaleDateString()} to ${selectedTimeRange.to?.toLocaleDateString()}`,
      });
    }, 2000);
  };

  const handleAnalyzeSCT = () => {
    setSctAnalyzed(true);
    toast({
      title: "SCT Analysis Complete",
      description: "Solution Cycle Time analysis has been completed with recommendations.",
    });
  };

  const handleCXInsight = () => {
    setCxAnalyzed(true);
    toast({
      title: "CX Insight Analysis Complete", 
      description: "Customer satisfaction insights have been generated.",
    });
  };

  const handleAnalyzeEmails = () => {
    toast({
      title: "Email Analysis Started",
      description: "Processing email threads for improvement suggestions...",
    });
  };

  const handleChartClick = (data: any, type: 'team' | 'survey', title: string) => {
    setModalData(data);
    setModalType(type);
    setModalTitle(title);
    setModalOpen(true);
  };

  const handleIndividualBarClick = (member: TeamMember, metric: 'sct' | 'cases' | 'satisfaction') => {
    // Generate sample detailed data for individual member metrics
    const generateDetailedData = () => {
      switch (metric) {
        case 'sct':
          return Array.from({ length: 15 }, (_, i) => ({
            caseId: `CASE-${2024}${String(i + 1).padStart(3, '0')}`,
            title: `${['Server', 'Database', 'Network', 'Application', 'Security'][i % 5]} Issue`,
            sct: Math.floor(Math.random() * 30) + 5,
            priority: ['P1', 'P2', 'P3', 'P4'][i % 4],
            status: 'Closed',
            createdDate: new Date(2024, 7, Math.floor(Math.random() * 30) + 1).toLocaleDateString(),
            closedDate: new Date(2024, 7, Math.floor(Math.random() * 30) + 1).toLocaleDateString()
          }));
        case 'cases':
          return Array.from({ length: member.cases }, (_, i) => ({
            caseId: `CASE-${2024}${String(i + 1).padStart(3, '0')}`,
            title: `Case ${i + 1}: ${['Configuration', 'Performance', 'Integration', 'Security', 'Deployment'][i % 5]} Request`,
            status: ['Closed', 'In Progress', 'Pending'][i % 3],
            priority: ['P1', 'P2', 'P3', 'P4'][i % 4],
            customerSat: Math.floor(Math.random() * 5) + 1,
            responseTime: `${Math.floor(Math.random() * 24) + 1}h`,
            createdDate: new Date(2024, 7, Math.floor(Math.random() * 30) + 1).toLocaleDateString()
          }));
        case 'satisfaction':
          return Array.from({ length: 20 }, (_, i) => ({
            surveyId: `SUR-${2024}${String(i + 1).padStart(3, '0')}`,
            caseId: `CASE-${2024}${String(i + 1).padStart(3, '0')}`,
            rating: Math.floor(Math.random() * 5) + 1,
            comment: [
              'Excellent support, very responsive',
              'Good technical knowledge',
              'Could be faster',
              'Very helpful and professional',
              'Resolved issue quickly'
            ][i % 5],
            category: ['Technical', 'Communication', 'Speed', 'Quality'][i % 4],
            submittedDate: new Date(2024, 7, Math.floor(Math.random() * 30) + 1).toLocaleDateString()
          }));
        default:
          return [];
      }
    };

    setModalData({
      member,
      metric,
      details: generateDetailedData()
    });
    setModalType('individual');
    setModalTitle(`${member.name} - ${metric.toUpperCase()} Details`);
    setModalOpen(true);
  };

  // Database handler functions for entity management
  const handleEntityDataChange = async (entityType: string, data: string[]) => {
    try {
      // Filter out the "Add New..." items to get actual entity names
      const actualEntities = data.filter(item => !item.includes('Add New'));
      
      console.log(`Entity ${entityType} data updated with:`, actualEntities);
      
      // Force a refresh of entity data from database to show latest changes
      await refreshData();
      
      // Update refresh key to force dialog re-initialization
      setEntityRefreshKey(Date.now());
      
    } catch (error) {
      console.error('Error updating entity data:', error);
      toast({
        title: "Error",
        description: "Failed to update entity data",
        variant: "destructive",
      });
    }
  };

  const handleMappingsChange = async (mappings: any) => {
    try {
      // The database operations handle mappings internally
      // This is called after entity operations complete
      console.log('Entity mappings updated:', mappings);
      
      // Force a refresh to ensure UI shows latest data
      await refreshData();
      
      // Update refresh key to force dialog re-initialization
      setEntityRefreshKey(Date.now());
    } catch (error) {
      console.error('Error updating entity mappings:', error);
      toast({
        title: "Error",
        description: "Failed to update entity mappings",
        variant: "destructive",
      });
    }
  };

  // Database initialization and data migration
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        // Check if we need to migrate existing data by checking if database is empty
        if (entityData.teams.length <= 1 && 
            entityData.squads.length <= 1 && 
            entityData.dpes.length <= 1) {
          // Migrate hardcoded data to database (only 'Add New...' items means empty)
          await migrateLegacyData(
            {
              teams: ['Platform Engineering', 'DevOps Infrastructure', 'Cloud Operations', 'Security Engineering', 'Site Reliability'],
              squads: ['Alpha Squad', 'Beta Squad', 'Gamma Squad', 'Delta Squad', 'Echo Squad'],
              dpes: ['Juan Dela Cruz', 'Maria Santos', 'Carlos Rodriguez', 'Ana Garcia', 'Miguel Torres', 'Sofia Lopez', 'Diego Martinez', 'Isabella Chen']
            },
            {
              dpeToSquad: {
                'Juan Dela Cruz': 'Alpha Squad',
                'Maria Santos': 'Alpha Squad',
                'Carlos Rodriguez': 'Beta Squad',
                'Ana Garcia': 'Beta Squad',
                'Miguel Torres': 'Gamma Squad',
                'Sofia Lopez': 'Gamma Squad',
                'Diego Martinez': 'Delta Squad',
                'Isabella Chen': 'Delta Squad'
              },
              squadToTeam: {
                'Alpha Squad': 'Platform Engineering',
                'Beta Squad': 'Platform Engineering',
                'Gamma Squad': 'DevOps Infrastructure',
                'Delta Squad': 'Cloud Operations',
                'Echo Squad': 'Security Engineering'
              }
            }
          );
          console.log('Legacy data migrated to database');
        }
        
        // Debug: Check database contents after initialization
        setTimeout(async () => {
          await debugDatabaseContents();
        }, 1000);
      } catch (error) {
        console.error('Database initialization error:', error);
      }
    };
    
    initializeDatabase();
  }, [entityData, migrateLegacyData]);

  // Format database data for legacy components
  const formatEntityDataForComponents = () => {
    if (!entityData) return { dpe: [], squad: [], team: [] };
    
    const formatted = {
      team: entityData.teams || ['Add New Team...'],
      squad: entityData.squads || ['Add New Squad...'],
      dpe: entityData.dpes || ['Add New DPE...']
    };
    return formatted;
  };

  // Format database data for QuickEntityAdd component
  const formatEntityDataForQuickAdd = () => {
    if (!entityData) return { teams: [], squads: [], dpes: [] };
    
    return {
      teams: entityData.teams || ['Add New Team...'],
      squads: entityData.squads || ['Add New Squad...'],
      dpes: entityData.dpes || ['Add New DPE...']
    };
  };

  const formatEntityMappingsForComponents = () => {
    if (!entityMappings) return { dpeToSquad: {}, squadToTeam: {} };
    return entityMappings;
  };

  // Dynamic data based on generated entity (not form selection)
  // (Duplicate removed, see below for the retained definition)

  // Helper function to calculate survey data from performance data (avoids circular dependency)
  const getSurveyDataFromPerformanceData = (performanceData: any[]) => {
    if (!performanceData || performanceData.length === 0) {
      return sampleSurveyData;
    }

    const totalSurveys = performanceData.reduce((sum, member) => sum + (member.cases || 0), 0);
    
    // Convert satisfaction scores (0-100) to CSAT percentage
    const avgSatisfaction = performanceData.reduce((sum, member) => sum + (member.satisfaction || 0), 0) / performanceData.length;

    // Calculate realistic distribution based on satisfaction score
    let csatPercentage, neutralPercentage, dsatPercentage;
    
    if (avgSatisfaction >= 90) {
      csatPercentage = 0.85; neutralPercentage = 0.12; dsatPercentage = 0.03;
    } else if (avgSatisfaction >= 80) {
      csatPercentage = 0.75; neutralPercentage = 0.18; dsatPercentage = 0.07;
    } else if (avgSatisfaction >= 70) {
      csatPercentage = 0.65; neutralPercentage = 0.25; dsatPercentage = 0.10;
    } else {
      csatPercentage = 0.50; neutralPercentage = 0.30; dsatPercentage = 0.20;
    }

    const csatCount = Math.round(totalSurveys * csatPercentage);
    const neutralCount = Math.round(totalSurveys * neutralPercentage);
    const dsatCount = totalSurveys - csatCount - neutralCount;

    return [
      { name: 'CSAT (4-5)', value: csatCount, percentage: Math.round((csatCount / totalSurveys) * 100), color: 'hsl(var(--kpi-success))' },
      { name: 'Neutral (3)', value: neutralCount, percentage: Math.round((neutralCount / totalSurveys) * 100), color: 'hsl(var(--kpi-warning))' },
      { name: 'DSAT (1-2)', value: dsatCount, percentage: Math.round((dsatCount / totalSurveys) * 100), color: 'hsl(var(--kpi-danger))' },
    ];
  };

  // Get performance breakdown data based on entity type
  const getPerformanceData = () => {
    if (!reportGenerated || !generatedEntityValue) {
      console.log('getPerformanceData: No report generated or entity value');
      return [];
    }

    console.log('getPerformanceData: Generated entity:', generatedEntity, 'Value:', generatedEntityValue);
    console.log('getPerformanceData: Entity mappings:', entityMappings);

    // Function to generate sample data for entities not in hardcoded data
    const generateSampleDataForEntity = (entityName: string) => {
      console.log('Generating sample data for entity:', entityName);
      
      if (!entityName || entityName.trim() === '') {
        console.log('Invalid entity name, using default values');
        return { name: 'Unknown', sct: 15, cases: 40, satisfaction: 80 };
      }
      
      // Generate consistent but random-looking data based on name hash
      const hash = entityName.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      // Ensure we get positive values by taking absolute value
      const absHash = Math.abs(hash);
      const sctBase = 12 + (absHash % 10); // SCT between 12-22
      const casesBase = 35 + (absHash % 25); // Cases between 35-60
      const satisfactionBase = 75 + (absHash % 20); // Satisfaction between 75-95
      
      const result = {
        name: entityName,
        sct: sctBase,
        cases: casesBase,
        satisfaction: satisfactionBase
      };
      
      console.log('Generated data for', entityName, ':', result);
      return result;
    };

    if (generatedEntity === 'dpe') {
      // Show only selected DPE data
      let dpeData = sampleTeamData.find(member => member.name === generatedEntityValue);
      
      // If DPE not found in sample data, generate sample data
      if (!dpeData) {
        console.log('DPE not found in sample data, generating new data for:', generatedEntityValue);
        dpeData = generateSampleDataForEntity(generatedEntityValue);
      } else {
        console.log('DPE found in sample data:', dpeData);
      }
      
      console.log('getPerformanceData: Returning DPE data:', [dpeData]);
      return [dpeData];
    } else if (generatedEntity === 'squad') {
      // Show squad members for selected squad
      const squadMembers = Object.entries(entityMappings.dpeToSquad)
        .filter(([_, squad]) => squad === generatedEntityValue)
        .map(([dpe, _]) => dpe);
      
      console.log('Squad members:', squadMembers);
      
      const squadData = squadMembers.map(memberName => {
        let memberData = sampleTeamData.find(member => member.name === memberName);
        
        // If member not found in sample data, generate sample data
        if (!memberData) {
          console.log('Squad member not found in sample data, generating:', memberName);
          memberData = generateSampleDataForEntity(memberName);
        }
        
        return memberData;
      });
      
      console.log('getPerformanceData: Returning squad data:', squadData);
      return squadData;
    } else if (generatedEntity === 'team') {
      // Show squads in selected team
      const teamSquads = Object.entries(entityMappings.squadToTeam)
        .filter(([_, team]) => team === generatedEntityValue)
        .map(([squad, _]) => squad);
      
      console.log('Team squads:', teamSquads);
      
      // Calculate squad averages
      const teamData = teamSquads.map(squad => {
        const squadMembers = Object.entries(entityMappings.dpeToSquad)
          .filter(([_, squadName]) => squadName === squad)
          .map(([dpe, _]) => dpe);
        
        // Get or generate data for each squad member
        const squadData = squadMembers.map(memberName => {
          let memberData = sampleTeamData.find(member => member.name === memberName);
          
          // If member not found in sample data, generate sample data
          if (!memberData) {
            console.log('Team squad member not found in sample data, generating:', memberName);
            memberData = generateSampleDataForEntity(memberName);
          }
          
          return memberData;
        });
        
        if (squadData.length === 0) return { name: squad, sct: 0, cases: 0, satisfaction: 0 };
        
        return {
          name: squad,
          sct: Math.round(squadData.reduce((sum, m) => sum + m.sct, 0) / squadData.length),
          cases: squadData.reduce((sum, m) => sum + m.cases, 0),
          satisfaction: Math.round(squadData.reduce((sum, m) => sum + m.satisfaction, 0) / squadData.length)
        };
      });
      
      console.log('getPerformanceData: Returning team data:', teamData);
      return teamData;
    }
    
    console.log('getPerformanceData: Returning default sample data');
    return sampleTeamData;
  };

  // Dynamic data based on generated entity (not form selection)

    console.log('getCurrentData called - reportGenerated:', reportGenerated, 'generatedEntityValue:', generatedEntityValue);
    
    if (!reportGenerated || !generatedEntityValue) {
      console.log('getCurrentData: Early return - no report or entity value');
      return null;
    }
    
    console.log('getCurrentData: generatedEntity:', generatedEntity);
    
    // Get performance data first
    const performanceData = getPerformanceData();
    console.log('getCurrentData: performanceData:', performanceData);
    
    // If no performance data, something is seriously wrong - provide fallback
    if (!performanceData || performanceData.length === 0) {
      console.log('getCurrentData: No performance data found, using fallback');
      return {
        sct: 15,
        cases: 40,
        satisfaction: 80,
        dissatisfaction: 10,
        totalSurveys: 32
      };
    }
    
    // Calculate dissatisfaction rate from survey data (avoid circular dependency)
    const surveyData = getSurveyDataFromPerformanceData(performanceData);
    console.log('getCurrentData: surveyData:', surveyData);
    const dsatData = surveyData.find(item => item.name === 'DSAT (1-2)');
    const dsatRate = dsatData ? dsatData.percentage : 0;
    console.log('getCurrentData: dsatRate:', dsatRate);
    
    if (generatedEntity === 'dpe') {
      const dpeData = performanceData[0]; // Should be only one DPE
      
      if (dpeData) {
        const result = {
          sct: dpeData.sct,
          cases: dpeData.cases,
          satisfaction: dpeData.satisfaction,
          dissatisfaction: dsatRate,
          totalSurveys: Math.round(dpeData.cases * 0.8) // Assume 80% of cases get surveys
        };
        console.log('getCurrentData: returning DPE data:', result);
        return result;
      } else {
        // Fallback to individualDPEData if no performance data found
        console.log('getCurrentData: No DPE data found, using fallback');
        const fallback = {
          sct: individualDPEData.sct,
          cases: individualDPEData.cases,
          satisfaction: individualDPEData.satisfaction,
          dissatisfaction: dsatRate,
          totalSurveys: individualDPEData.totalSurveys
        };
        console.log('getCurrentData: returning fallback DPE data:', fallback);
        return fallback;
      }
    } else {
      const teamResult = {
        sct: teamAverages.sct,
        cases: teamAverages.cases,
        satisfaction: teamAverages.satisfaction,
        dissatisfaction: dsatRate,
        totalSurveys: 400
      };
      console.log('getCurrentData: returning team data:', teamResult);
      return teamResult;
    }
  };

  // Get survey data based on generated entity type (not form selection)
  const getSurveyData = () => {
  // Database operations
  const { 
    createTeam,
    createSquad, 
    createDPE,
    updateTeam,
    updateSquad,
    updateDPE,
    getTeamsWithIds,
    getSquadsWithIds,
    getDPEsWithIds,
    entityData,
    entityMappings,
    refreshData
  } = useEntityDatabase();

  // State management
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [selectedEntityValue, setSelectedEntityValue] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('last30days');
  const [reportGenerated, setReportGenerated] = useState<boolean>(false);
  const [generatedEntity, setGeneratedEntity] = useState<string>('');
  const [generatedEntityValue, setGeneratedEntityValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [entityChanged, setEntityChanged] = useState<boolean>(false);
  const [entityRefreshKey, setEntityRefreshKey] = useState<number>(0);

  // Additional state for insights and modals
  const [sctAnalyzed, setSctAnalyzed] = useState<boolean>(false);
  const [cxAnalyzed, setCxAnalyzed] = useState<boolean>(false);
  const [isAnalysisEnabled, setIsAnalysisEnabled] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Handler functions
  const handleEntityChange = (entity: string, entityType: string) => {
    setSelectedEntity(entity);
    setSelectedEntityType(entityType);
    setEntityChanged(true);
    setReportGenerated(false);
  };

  const handleEntityValueChange = (value: string) => {
    setSelectedEntityValue(value);
  };

  const handleTimeRangeChange = (timeRange: string) => {
    setSelectedTimeRange(timeRange);
  };

  const handleGenerateReport = async () => {
    if (!selectedEntity || selectedEntity.includes('Add New')) {
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setReportGenerated(true);
      setGeneratedEntity(selectedEntityType);
      setGeneratedEntityValue(selectedEntity);
      setEntityChanged(false);
      setIsLoading(false);
    }, 1500);
  };

  const handleEntityDataChange = (entityType: string, data: string[]) => {
    setEntityRefreshKey(prev => prev + 1);
    refreshData();
  };

  const handleMappingsChange = (mappings: any) => {
    setEntityRefreshKey(prev => prev + 1);
    refreshData();
  };

  const handleChartClick = (data: any, chartType: string, title: string) => {
    console.log('Chart clicked:', { data, chartType, title });
  };

  const handleIndividualBarClick = (data: any) => {
    console.log('Bar clicked:', data);
  };

  const handleAnalyzeSCT = () => {
    setSctAnalyzed(true);
  };

  const handleCXInsight = () => {
    setCxAnalyzed(true);
  };

  // Utility functions
  const formatEntityDataForComponents = () => {
    return entityData;
  };

  const formatEntityMappingsForComponents = () => {
    return entityMappings;
  };

  const formatEntityDataForQuickAdd = () => {
    return entityData;
  };

  // Data generation functions
  const getSurveyDataFromPerformanceData = (performanceData: any) => {
    const totalResponses = Math.floor(Math.random() * 200) + 50;
    const avgRating = (Math.random() * 2 + 3).toFixed(1);
    
    return [
      { name: 'Very Satisfied', value: Math.floor(totalResponses * 0.4), fill: '#4ade80' },
      { name: 'Satisfied', value: Math.floor(totalResponses * 0.35), fill: '#22d3ee' },
      { name: 'Neutral', value: Math.floor(totalResponses * 0.15), fill: '#fbbf24' },
      { name: 'Dissatisfied', value: Math.floor(totalResponses * 0.07), fill: '#f87171' },
      { name: 'Very Dissatisfied', value: Math.floor(totalResponses * 0.03), fill: '#ef4444' }
    ];
  };

  const getPerformanceData = (entityName?: string, entityType?: string) => {
    if (!entityName || entityName.includes('Add New')) {
      return [];
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      deployments: Math.floor(Math.random() * 50) + 10,
      incidents: Math.floor(Math.random() * 5) + 1,
      mttr: Math.floor(Math.random() * 60) + 30,
      customerSat: Math.floor(Math.random() * 30) + 70
    }));
  };

  const getCurrentData = () => {
    console.log('DEBUG: getCurrentData called');
    console.log('DEBUG: selectedEntity =', selectedEntity);
    console.log('DEBUG: selectedEntityType =', selectedEntityType);
    
    if (!selectedEntity || selectedEntity.includes('Add New')) {
      console.log('DEBUG: No valid entity selected');
      return {
        reportGeneration: { generated: 0, total: 50 },
        dsatPercentage: 0,
        responseRate: 0,
        avgRating: 0,
        surveyData: [],
        teamData: [],
        sct: 0,
        cases: 0,
        satisfaction: 0,
        dissatisfaction: 0,
        totalSurveys: 0
      };
    }

    // Generate comprehensive data for selected entity
    const performanceData = getPerformanceData(selectedEntity, selectedEntityType);
    const totalSurveys = Math.floor(Math.random() * 200) + 100;
    const responseRate = Math.floor(Math.random() * 40) + 60;
    const avgRating = (Math.random() * 2 + 3).toFixed(1);
    
    return {
      reportGeneration: { generated: Math.floor(Math.random() * 45) + 5, total: 50 },
      dsatPercentage: Math.floor(Math.random() * 15) + 5,
      responseRate,
      avgRating: parseFloat(avgRating),
      surveyData: getSurveyDataFromPerformanceData(performanceData),
      teamData: performanceData,
      sct: Math.floor(Math.random() * 100) + 50,
      cases: Math.floor(Math.random() * 20) + 5,
      satisfaction: Math.floor(Math.random() * 30) + 70,
      dissatisfaction: Math.floor(Math.random() * 15) + 5,
      totalSurveys
    };
  };

  // Sample data and constants
  const sampleInsights = [
    {
      id: "1",
      title: "Team Performance",
      description: "DevOps practices have improved deployment frequency by 40%",
      impact: "High",
      category: "Performance",
      type: "metric" as const
    },
    {
      id: "2",
      title: "Customer Satisfaction", 
      description: "Recent infrastructure changes increased customer satisfaction by 15%",
      impact: "Medium",
      category: "Customer Experience",
      type: "feedback" as const
    }
  ];

  const [modalData, setModalData] = useState<any>(null);
  const [modalType, setModalType] = useState<'team' | 'survey' | 'individual'>('team');
  const [modalTitle, setModalTitle] = useState<string>('');

  // Component render logic starts here
  const currentData = getCurrentData();
  console.log('Component render - currentData:', currentData);

  const getEntityTitle = () => {
    switch (selectedEntity) {
      case 'dpe':
        return 'DPE Performance Breakdown';
      case 'squad':
        return 'Squad Performance Breakdown';
      case 'team':
        return 'Team Performance Breakdown';
      default:
        return 'Entity Performance Breakdown';
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-0 right-0 z-10 flex gap-2">
          <QuickEntityAdd

          />
          <EntityManagementDialog
            allEntityData={formatEntityDataForComponents()}
            entityMappings={formatEntityMappingsForComponents()}
            onEntityDataChange={handleEntityDataChange}
            onMappingsChange={handleMappingsChange}
            createTeam={createTeam}
            createSquad={createSquad}
            createDPE={createDPE}
            updateTeam={updateTeam}
            updateSquad={updateSquad}
            updateDPE={updateDPE}
            deleteTeam={deleteTeam}
            deleteSquad={deleteSquad}
            deleteDPE={deleteDPE}
            getTeamsWithIds={getTeamsWithIds}
            getSquadsWithIds={getSquadsWithIds}
            getDPEsWithIds={getDPEsWithIds}
            refreshKey={entityRefreshKey}
          />
          <ThemeToggle />
          {/* Debug button temporarily disabled */}
        </div>
        <div className="text-center space-y-4 mb-8">
          <div className="flex justify-center">
            <img 
              src={i16eLogoLight} 
              alt="i16E IntelliPerformance" 
              className="h-20 w-auto block dark:hidden"
            />
            <img 
              src={i16eLogoDark} 
              alt="i16E IntelliPerformance" 
              className="h-20 w-auto hidden dark:block"
            />
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <FilterSection
        selectedEntity={selectedEntity}
        selectedEntityValue={selectedEntityValue}
        selectedTimeRange={selectedTimeRange}
        onEntityChange={handleEntityChange}
        onEntityValueChange={handleEntityValueChange}
        onTimeRangeChange={handleTimeRangeChange}
        onGenerateReport={handleGenerateReport}
        entityData={formatEntityDataForComponents()}
        isLoading={isLoading}
        reportGenerated={reportGenerated}
        entityChanged={entityChanged}
      />

      {/* Debug Information */}
      {generatedEntity === 'dpe' && (
        <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">🔍 Debug Info (DPE Selected)</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>Report Generated:</strong> {reportGenerated ? 'Yes' : 'No'}</p>
            <p><strong>Generated Entity:</strong> {generatedEntity}</p>
            <p><strong>Generated Entity Value:</strong> {generatedEntityValue}</p>
            <p><strong>Current Data:</strong> {currentData ? JSON.stringify(currentData) : 'null'}</p>
            <p><strong>Performance Data Length:</strong> {(() => {
              try {
                return getPerformanceData().length;
              } catch (e) {
                return 'Error: ' + e.message;
              }
            })()}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportGenerated && generatedEntityValue && currentData ? (
          <>
            <KPICard
              title="Solution Cycle Time"
              value={currentData.sct}
              unit=" days"
              target={15}
              description="Average time to resolve cases"
              variant="success"
              icon={<Clock className="h-5 w-5" />}
            />
            <KPICard
              title="Cases Close"
              value={currentData.cases}
              description="Total cases this period"
              variant="default"
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <KPICard
              title="Customer Satisfaction"
              value={currentData.satisfaction}
              unit="%"
              target={85}
              description="CSAT rating"
              variant="success"
              icon={<ThumbsUp className="h-5 w-5" />}
            />
            <KPICard
              title="Dissatisfaction Rate"
              value={currentData.dissatisfaction}
              unit="%"
              target={5}
              description="DSAT rating"
              variant="warning"
              icon={<ThumbsDown className="h-5 w-5" />}
            />
          </>
        ) : (
          <>
            <KPICard
              title="Solution Cycle Time"
              value="N/A"
              unit=""
              target={15}
              description={reportGenerated ? "No data available for selected entity" : "Generate a report to view metrics"}
              variant="success"
              icon={<Clock className="h-5 w-5" />}
            />
            <KPICard
              title="Cases Close"
              value="N/A"
              unit=""
              description={reportGenerated ? "No data available for selected entity" : "Generate a report to view metrics"}
              variant="default"
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <KPICard
              title="Customer Satisfaction"
              value="N/A"
              unit=""
              target={85}
              description={reportGenerated ? "No data available for selected entity" : "Generate a report to view metrics"}
              variant="success"
              icon={<ThumbsUp className="h-5 w-5" />}
            />
            <KPICard
              title="Dissatisfaction Rate"
              value="N/A"
              unit=""
              target={5}
              description={reportGenerated ? "No data available for selected entity" : "Generate a report to view metrics"}
              variant="warning"
              icon={<ThumbsDown className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportGenerated && generatedEntityValue ? (
          <>
            {(() => {
              try {
                const performanceData = getPerformanceData();
                console.log('Rendering TeamPerformanceChart with data:', performanceData);
                return (
                  <TeamPerformanceChart
                    data={currentData.teamData.map((item: any, index: number) => ({
                      name: `Team Member ${index + 1}`,
                      sct: Math.floor(Math.random() * 100) + 50,
                      cases: Math.floor(Math.random() * 20) + 5,
                      satisfaction: Math.floor(Math.random() * 30) + 70
                    }))}
                    title={getEntityTitle()}
                    onBarClick={handleIndividualBarClick}
                  />
                );
              } catch (error) {
                console.error('Error rendering TeamPerformanceChart:', error);
                return (
                  <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-red-500">Performance Chart Error</h3>
                    <p className="text-sm text-red-400">Error: {error.message}</p>
                  </div>
                );
              }
            })()}
            {(() => {
              try {
                const surveyData = getSurveyData();
                console.log('Rendering SurveyAnalysisChart with data:', surveyData);
                return (
                  <SurveyAnalysisChart
                    data={currentData.surveyData}
                    title="Customer Satisfaction Distribution"
                    totalSurveys={currentData?.totalSurveys || 500}
                    onPieClick={(data) => handleChartClick(data, 'survey', 'Customer Satisfaction')}
                  />
                );
              } catch (error) {
                console.error('Error rendering SurveyAnalysisChart:', error);
                return (
                  <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-red-500">Survey Chart Error</h3>
                    <p className="text-sm text-red-400">Error: {error.message}</p>
                  </div>
                );
              }
            })()}
          </>
        ) : (
          <>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Breakdown</h3>
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {reportGenerated ? "No data available for selected entity" : "Generate a report to view charts"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Satisfaction Distribution</h3>
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {reportGenerated ? "No survey data available for selected entity" : "Generate a report to view satisfaction data"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Insights Panel */}
      {reportGenerated && (
        <InsightsPanel
          insights={sampleInsights}
          onAnalyzeSCT={handleAnalyzeSCT}
          onCXInsight={handleCXInsight}
          sctAnalyzed={sctAnalyzed}
          cxAnalyzed={cxAnalyzed}
          selectedEntity={selectedEntity}
          selectedEntityValue={selectedEntityValue}
          generatedEntity={generatedEntity}
          generatedEntityValue={generatedEntityValue}
          isLoading={isLoading}
          isAnalysisEnabled={isAnalysisEnabled}
        />
      )}

      {!reportGenerated && (
        <div className="text-center py-16">
          <BarChart3 className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-foreground mb-2">Ready to Analyze Performance</h3>
          <p className="text-muted-foreground">
            Select your filters and generate a comprehensive KPI report with AI-powered insights
          </p>
        </div>
      )}

      <DetailedStatsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        data={modalData}
        type={modalType}
        title={modalTitle}
      />
    </div>
  );
};

export default Index;