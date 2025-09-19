import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, FileText, Users, TrendingUp, AlertCircle, CheckCircle2, Clock, Target, BarChart3, PieChart, Activity, ThumbsUp, ThumbsDown, CheckCircle, Lightbulb, Database } from 'lucide-react';
import ThemeToggle from '@/components/ui/theme-toggle';
import KPICard from '@/components/dashboard/KPICard';
import FilterSection from '@/components/dashboard/FilterSection';
import TeamPerformanceChart from '@/components/dashboard/TeamPerformanceChart';
import SurveyAnalysisChart from '@/components/dashboard/SurveyAnalysisChart';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import DetailedStatsModal from '@/components/dashboard/DetailedStatsModal';
import QuickEntityAdd from '@/components/dashboard/QuickEntityAdd';
import EntityManagementDialog from '@/components/dashboard/EntityManagementDialog';
import BackendStatus from '@/components/dashboard/BackendStatus';
import { useEntityDatabase } from '@/hooks/useEntityDatabase';
import { DashboardData } from '@/lib/entityService';

const Index = () => {
  console.log('Index component rendering...');
  
  // Database operations
  const { 
    createTeam,
    createSquad, 
    createDPE,
    updateTeam,
    updateSquad,
    updateDPE,
    deleteTeam,
    deleteSquad,
    deleteDPE,
    getTeamsWithIds,
    getSquadsWithIds,
    getDPEsWithIds,
    entityData,
    entityMappings,
    refreshData,
    getDashboardData
  } = useEntityDatabase();

  // State management
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [selectedEntityValue, setSelectedEntityValue] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ from: Date | undefined; to: Date | undefined }>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    return { from, to };
  });
  const [reportGenerated, setReportGenerated] = useState<boolean>(false);
  const [generatedEntity, setGeneratedEntity] = useState<string>('');
  const [generatedEntityValue, setGeneratedEntityValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [entityChanged, setEntityChanged] = useState<boolean>(false);
  const [entityRefreshKey, setEntityRefreshKey] = useState<number>(0);

  // Additional state for insights and modals
  const [sctAnalyzed, setSctAnalyzed] = useState<boolean>(false);
  const [cxAnalyzed, setCxAnalyzed] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<{member: any, metric: string} | null>(null);
  const [isAnalysisEnabled, setIsAnalysisEnabled] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [cachedDashboardData, setCachedDashboardData] = useState<DashboardData | null>(null);
  const [reportDashboardData, setReportDashboardData] = useState<DashboardData | null>(null);
  const [reportCurrentData, setReportCurrentData] = useState<any>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalType, setModalType] = useState<'team' | 'survey' | 'individual'>('individual');
  const [modalTitle, setModalTitle] = useState<string>('');
  const [sctAnalysisResults, setSctAnalysisResults] = useState<any>(null);
  const [cxInsightResults, setCxInsightResults] = useState<any>(null);
  const [dummyDataActive, setDummyDataActive] = useState<boolean>(false);

  // Dummy data generation function
  const generateDummyData = () => {
    const dummyData = {
      entityData: {
        dpes: ['john.smith', 'jane.doe', 'mike.wilson', 'sarah.connor'],
        squads: ['Alpha Squad', 'Beta Squad', 'Gamma Squad', 'Delta Squad'],
        teams: ['Europe Enterprise']
      },
      performanceData: [
        { name: 'Alpha Squad', sct: 12, cases: 45, satisfaction: 92 },
        { name: 'Beta Squad', sct: 8, cases: 67, satisfaction: 88 },
        { name: 'Gamma Squad', sct: 15, cases: 34, satisfaction: 85 },
        { name: 'Delta Squad', sct: 10, cases: 52, satisfaction: 90 }
      ],
      entityMappings: {
        squadToTeam: {
          'Alpha Squad': 'Europe Enterprise',
          'Beta Squad': 'Europe Enterprise',
          'Gamma Squad': 'Europe Enterprise',
          'Delta Squad': 'Europe Enterprise'
        },
        dpeToSquad: {
          'john.smith': 'Alpha Squad',
          'jane.doe': 'Alpha Squad',
          'mike.wilson': 'Beta Squad',
          'sarah.connor': 'Beta Squad',
          'alex.turner': 'Gamma Squad',
          'emma.watson': 'Gamma Squad',
          'david.brown': 'Delta Squad',
          'lisa.garcia': 'Delta Squad'
        }
      }
    };

    // Set dummy data as report data
    setReportDashboardData(dummyData);
    
    // Create static snapshot for report data (to prevent reactive updates)
    const reportData = {
      sct: 11.25,
      cases: 198,
      satisfaction: 89,
      dsatPercentage: 8,
      responseRate: 75,
      surveyData: [
        { name: 'CSAT (4-5)', percentage: 80, count: 320, value: 320, color: '#22c55e' },
        { name: 'Neutral (3)', percentage: 12, count: 48, value: 48, color: '#f59e0b' },
        { name: 'DSAT (1-2)', percentage: 8, count: 32, value: 32, color: '#ef4444' }
      ],
      totalSurveys: 400,
      reportGeneration: new Date().toISOString()
    };
    
    setReportCurrentData(reportData);
    setReportGenerated(true);
    setGeneratedEntity('team');
    setGeneratedEntityValue('Europe Enterprise');
    setDummyDataActive(true);
    setIsAnalysisEnabled(true);
    
    // Generate dummy insights for both SCT and CX analysis
    setSctAnalyzed(true);
    setCxAnalyzed(true);
    
    // Generate dummy SCT insights
    const dummySctInsights = {
      insights: [
        {
          id: 'sct-1',
          type: 'improvement',
          category: 'Solution Cycle Time',
          title: 'Beta Squad Optimization Opportunity',
          description: 'Beta Squad shows exceptional SCT performance at 8 days, significantly below team average of 11.25 days.',
          recommendation: 'Analyze Beta Squad\'s workflow practices and implement their efficient processes across other squads to reduce overall cycle time.',
          member: 'Beta Squad'
        },
        {
          id: 'sct-2',
          type: 'warning',
          category: 'Solution Cycle Time',
          title: 'Gamma Squad Performance Gap',
          description: 'Gamma Squad has the highest SCT at 15 days, 33% above team average, indicating potential bottlenecks.',
          recommendation: 'Conduct detailed workflow analysis for Gamma Squad, identify blockers, and provide additional support or training.',
          member: 'Gamma Squad'
        },
        {
          id: 'sct-3',
          type: 'success',
          category: 'Solution Cycle Time',
          title: 'Overall Team Performance',
          description: 'Europe Enterprise maintains competitive SCT average of 11.25 days with strong case volume of 198 completed cases.',
          recommendation: 'Continue monitoring performance trends and share best practices from high-performing squads.',
          member: 'Europe Enterprise'
        }
      ]
    };
    
    // Generate dummy CX insights
    const dummyCxInsights = {
      insights: [
        {
          id: 'cx-1',
          type: 'success',
          category: 'Customer Satisfaction',
          title: 'Excellent Customer Satisfaction',
          description: 'Europe Enterprise achieves 89% overall satisfaction with 80% of customers rating as satisfied or very satisfied.',
          recommendation: 'Maintain current service standards and leverage satisfied customer feedback to enhance service delivery.',
          member: 'Europe Enterprise'
        },
        {
          id: 'cx-2',
          type: 'improvement',
          category: 'Customer Satisfaction',
          title: 'Delta Squad Excellence',
          description: 'Delta Squad leads with 90% satisfaction rate, demonstrating superior customer interaction quality.',
          recommendation: 'Document and share Delta Squad\'s customer engagement practices with other squads to elevate overall satisfaction.',
          member: 'Delta Squad'
        },
        {
          id: 'cx-3',
          type: 'info',
          category: 'Customer Satisfaction',
          title: 'Survey Volume Analysis',
          description: 'Strong survey participation with 400 responses provides reliable satisfaction metrics across all service areas.',
          recommendation: 'Continue current survey methodology and consider implementing real-time feedback collection for faster issue resolution.',
          member: 'Europe Enterprise'
        },
        {
          id: 'cx-4',
          type: 'improvement',
          category: 'Customer Satisfaction',
          title: 'Dissatisfaction Mitigation',
          description: 'Only 8% dissatisfaction rate (dissatisfied + very dissatisfied) indicates effective service recovery processes.',
          recommendation: 'Analyze dissatisfied customer cases to identify common issues and implement proactive prevention measures.',
          member: 'Europe Enterprise'
        }
      ]
    };
    
    setSctAnalysisResults(dummySctInsights);
    setCxInsightResults(dummyCxInsights);
    
    // Also update cached data for consistency
    setCachedDashboardData(dummyData);
    
    console.log('Dummy data generated for Europe Enterprise team with insights');
  };

  // Clear dummy data when generating real report or refreshing
  const clearDummyData = () => {
    if (dummyDataActive) {
      setDummyDataActive(false);
      setReportDashboardData(null);
      setReportCurrentData(null);
      setReportGenerated(false);
      setGeneratedEntity('');
      setGeneratedEntityValue('');
      setCachedDashboardData(null);
      setIsAnalysisEnabled(false);
      
      // Clear analysis states and insights
      setSctAnalyzed(false);
      setCxAnalyzed(false);
      setSctAnalysisResults(null);
      setCxInsightResults(null);
      
      console.log('Dummy data and insights cleared');
    }
  };

  // Handler functions
  const handleEntityChange = (entity: string) => {
    // Validate entity type
    if (!entity || !['dpe', 'squad', 'team'].includes(entity)) {
      console.warn('Invalid entity type selected:', entity);
      return;
    }
    
    setSelectedEntity(entity);
    setSelectedEntityValue(''); // Reset entity value when type changes
    setEntityChanged(true);
    setReportGenerated(false);
    setGeneratedEntity(''); // Clear generated entity
    setGeneratedEntityValue(''); // Clear generated entity value
    setReportDashboardData(null); // Clear report data
    setReportCurrentData(null); // Clear report current data
    setIsAnalysisEnabled(false); // Disable analysis when entity changes
  };

  const handleEntityValueChange = (value: string) => {
    // Validate entity value
    if (!value || value.includes('Add New')) {
      console.warn('Invalid entity value selected:', value);
      setSelectedEntityValue('');
      return;
    }
    
    // Validate that the entity value exists in the current entity data
    const formattedData = formatEntityDataForComponents();
    const entityOptions = formattedData[selectedEntity as 'team' | 'squad' | 'dpe'] || [];
    if (!entityOptions.includes(value)) {
      console.warn('Selected entity value not found in available options:', value);
      return;
    }
    
    setSelectedEntityValue(value);
    setEntityChanged(true);
    setReportGenerated(false);
    setGeneratedEntity(''); // Clear generated entity
    setGeneratedEntityValue(''); // Clear generated entity value
    setReportDashboardData(null); // Clear report data
    setReportCurrentData(null); // Clear report current data
    setIsAnalysisEnabled(false); // Disable analysis when entity value changes
  };

  const handleTimeRangeChange = (range: { from: Date; to: Date }) => {
    // Validate date range
    if (!range.from || !range.to) {
      console.warn('Invalid date range provided');
      return;
    }
    
    if (range.from > range.to) {
      console.warn('Start date cannot be after end date');
      return;
    }
    
    // Validate that date range is not too far in the future
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
    if (range.to > maxFutureDate) {
      console.warn('End date cannot be more than 1 year in the future');
      return;
    }
    
    setSelectedTimeRange(range);
  };

  const handleGenerateReport = async () => {
    // Clear dummy data when generating real report
    clearDummyData();
    
    // Comprehensive validation before generating report
    if (!selectedEntity) {
      console.error('No entity type selected');
      return;
    }
    
    if (!selectedEntityValue || selectedEntityValue.includes('Add New')) {
      console.error('No valid entity selected');
      return;
    }
    
    // Validate entity type
    if (!['dpe', 'squad', 'team'].includes(selectedEntity)) {
      console.error('Invalid entity type:', selectedEntity);
      return;
    }
    
    // Validate that selected entity value exists in current data
    const formattedData = formatEntityDataForComponents();
    const entityOptions = formattedData[selectedEntity as 'team' | 'squad' | 'dpe'] || [];
    const validOptions = entityOptions.filter(e => !e.includes('Add New'));
    if (!validOptions.includes(selectedEntityValue)) {
      console.error('Selected entity not found in current data:', selectedEntityValue);
      return;
    }
    
    // Validate mappings for squad and dpe
    if (selectedEntity === 'dpe') {
      const mappedSquad = entityMappings.dpeToSquad[selectedEntityValue];
      if (!mappedSquad) {
        console.warn('DPE is not mapped to any squad:', selectedEntityValue);
      }
    }
    
    if (selectedEntity === 'squad') {
      const mappedTeam = entityMappings.squadToTeam[selectedEntityValue];
      if (!mappedTeam) {
        console.warn('Squad is not mapped to any team:', selectedEntityValue);
      }
    }
    
    setIsLoading(true);
    
    // Add diagnostic logging
    diagnoseEntityData(selectedEntity, selectedEntityValue);
    
    try {
      // Fetch real dashboard data based on entity selection and time range
      const startDate = selectedTimeRange.from?.toISOString().split('T')[0];
      const endDate = selectedTimeRange.to?.toISOString().split('T')[0];
      
      const dashboardData = await getDashboardData(selectedEntity, selectedEntityValue, startDate, endDate);
      
      console.log(`Dashboard data fetch for ${selectedEntity} "${selectedEntityValue}":`, {
        dashboardData,
        performanceDataCount: dashboardData?.performanceData?.length || 0,
        entityMappings: entityMappings
      });
      
      if (dashboardData) {
        setCachedDashboardData(dashboardData);
        setReportDashboardData(dashboardData);
        
        // Create static snapshot data from calculated current data (no reactive dependencies)
        const currentDataSnapshot = getCurrentData();
        const reportData = {
          sct: currentDataSnapshot?.sct || null,
          cases: currentDataSnapshot?.cases || null,
          satisfaction: currentDataSnapshot?.satisfaction || null,
          dsatPercentage: currentDataSnapshot?.dsatPercentage || null,
          responseRate: currentDataSnapshot?.responseRate || null,
          surveyData: currentDataSnapshot?.surveyData || [],
          totalSurveys: currentDataSnapshot?.totalSurveys || null,
          reportGeneration: new Date().toISOString()
        };
        console.log('SNAPSHOT: Setting reportCurrentData during report generation:', reportData);
        setReportCurrentData(reportData);
        
        console.log('Dashboard data loaded:', dashboardData);
        console.log('Report current data captured:', reportData);
        
        // Always generate report - let dashboard components handle "No data available" display
        setReportGenerated(true);
        setGeneratedEntity(selectedEntity);
        setGeneratedEntityValue(selectedEntityValue);
        setEntityChanged(false);
        setIsAnalysisEnabled(true);
      } else {
        console.warn('No dashboard data found for:', { selectedEntity, selectedEntityValue });
        // Set empty data structure as fallback
        setCachedDashboardData({
          entityData: null,
          entityMappings: null,
          performanceData: []
        });
        setReportDashboardData({
          entityData: null,
          entityMappings: null,
          performanceData: []
        });
        
        // Create static snapshot data for "no data" case
        const reportData = {
          sct: null,
          cases: null,
          satisfaction: null,
          dsatPercentage: null,
          responseRate: null,
          surveyData: [],
          totalSurveys: null,
          reportGeneration: null,
          hasData: false
        };
        setReportCurrentData(reportData);
        
        // Still generate report to show "No data available" state
        setReportGenerated(true);
        setGeneratedEntity(selectedEntity);
        setGeneratedEntityValue(selectedEntityValue);
        setEntityChanged(false);
        setIsAnalysisEnabled(true);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      // Set fallback data on error
      setCachedDashboardData({
        entityData: null,
        entityMappings: null,
        performanceData: []
      });
    } finally {
      setIsLoading(false);
    }
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

  const handleSurveySegmentClick = (data: any, segment: string) => {
    console.log('Survey segment clicked:', data, segment);
    
    // Generate survey analysis data for the modal
    const surveyAnalysisData = [
      {
        name: 'Satisfied (4-5 Stars)',
        value: Math.round(data.value * 0.78), // 78% of the clicked segment
        percentage: 78
      },
      {
        name: 'Neutral (3 Stars)', 
        value: Math.round(data.value * 0.16), // 16% of the clicked segment
        percentage: 16
      },
      {
        name: 'Dissatisfied (1-2 Stars)',
        value: Math.round(data.value * 0.06), // 6% of the clicked segment  
        percentage: 6
      }
    ];

    // Open the detailed modal with survey data
    setModalData(surveyAnalysisData);
    setModalType('survey');
    setModalTitle(`${segment.toUpperCase()} Feedback - Customer Satisfaction Analysis`);
    setModalOpen(true);
    
    // Also add the insight to CX results if they exist
    const segmentInsight = {
      id: `survey-${segment}-${Date.now()}`,
      title: `${segment.toUpperCase()} Feedback Analysis`,
      description: `${data.value} customers (${data.percentage}%) provided ${segment} feedback. ${
        segment === 'csat' ? 'High satisfaction indicates strong service quality.' :
        segment === 'neutral' ? 'Neutral feedback suggests room for improvement in service delivery.' :
        'Dissatisfaction requires immediate attention to address service gaps.'
      }`,
      impact: segment === 'csat' ? 'High' : segment === 'neutral' ? 'Medium' : 'Critical',
      category: 'Customer Experience',
      type: segment === 'csat' ? 'success' : segment === 'neutral' ? 'warning' : 'warning'
    };
    
    // Add the insight to CX results if they exist, otherwise create new ones
    if (cxInsightResults) {
      setCxInsightResults(prev => ({
        ...prev,
        insights: [...prev.insights, segmentInsight]
      }));
    } else {
      setCxInsightResults({
        insights: [segmentInsight],
        metrics: {
          csat: reportCurrentData?.satisfaction || 0,
          dsat: reportCurrentData?.surveyData?.find(d => d.name.includes('DSAT'))?.percentage || 0,
          totalSurveys: reportCurrentData?.totalSurveys || 0,
          trend: 'New Analysis'
        }
      });
    }
    
    // Auto-enable CX analyzed state
    setCxAnalyzed(true);
  };

  const handleIndividualBarClick = (data: any, metric: 'sct' | 'cases') => {
    console.log('Bar clicked:', data, metric);
    
    // Generate detailed breakdown data for the modal
    const detailsData = generateDetailedData(data, metric);
    
    setModalData({
      member: data,
      metric: metric,
      details: detailsData
    });
    setModalType('individual');
    setModalTitle(`${data.name} - ${metric === 'sct' ? 'SCT Analysis' : 'Cases Analysis'}`);
    setModalOpen(true);
  };

  // Helper function to generate detailed breakdown data
  const generateDetailedData = (member: any, metric: 'sct' | 'cases') => {
    if (metric === 'sct') {
      // Generate sample SCT case details
      return Array.from({ length: 8 }, (_, index) => ({
        caseId: `TM-${String(2024001 + index).padStart(7, '0')}`,
        title: [
          'Login Authentication Issue',
          'Database Performance Optimization', 
          'UI Component Bug Fix',
          'API Rate Limiting Implementation',
          'Memory Leak Investigation',
          'Security Vulnerability Patch',
          'Feature Enhancement Request',
          'Data Migration Script'
        ][index],
        sct: 15, // Use fixed value instead of random
        priority: 'P2', // Use fixed value instead of random
        createdDate: new Date().toLocaleDateString(),
        closedDate: new Date().toLocaleDateString()
      }));
    } else {
      // Generate sample cases data
      return Array.from({ length: member.cases || 10 }, (_, index) => ({
        caseId: `TM-${String(2024100 + index).padStart(7, '0')}`,
        title: [
          'User Account Setup',
          'Payment Processing Issue',
          'Report Generation Bug',
          'Mobile App Crash',
          'Integration Configuration',
          'Data Export Request',
          'Permission Management',
          'Backup Recovery',
          'Performance Tuning',
          'Documentation Update'
        ][index % 10],
        status: 'Closed', // Use fixed value instead of random
        type: 'Support', // Use fixed value instead of random
        priority: 'P2', // Use fixed value instead of random
        createdDate: new Date().toLocaleDateString(),
        resolvedDate: new Date().toLocaleDateString()
      }));
    }
  };

  const handleAnalyzeSCT = () => {
    setSctAnalyzed(true);
    
    // Get entity-specific terminology
    const entityType = generatedEntity || selectedEntity;
    const entityName = generatedEntityValue || selectedEntityValue;
    const entityLabel = entityType === 'dpe' ? 'DPE' : entityType === 'squad' ? 'Squad' : 'Team';
    const entityContext = entityType === 'dpe' ? 'individual developer' : entityType === 'squad' ? 'squad-level' : 'team-level';
    const peerGroup = entityType === 'dpe' ? 'other DPEs' : entityType === 'squad' ? 'other squads' : 'other teams';
    
    // Generate comprehensive SCT analysis results with entity-specific insights and recommendations
    const sctAnalysis = {
      insights: [
        {
          id: '1',
          title: `${entityLabel} Development Phase Efficiency Above Target`,
          description: `${entityName} shows excellent performance in development phase with 60% faster completion than industry average. Development phase accounts for only 45% of total SCT vs. 65% industry standard for ${entityContext} performance.`,
          impact: 'High',
          category: 'performance',
          type: 'success',
          recommendation: entityType === 'dpe' 
            ? `Continue current development practices. Consider mentoring junior DPEs and sharing your efficient coding techniques with the squad.`
            : `Continue current development practices. Document and share best practices with ${peerGroup} to replicate this success across the organization.`
        },
        {
          id: '2', 
          title: `${entityLabel} Testing Phase Bottleneck Identified`,
          description: `Testing phase accounts for 35% of total SCT, significantly above the 20% target. This represents the primary bottleneck in ${entityName}'s solution delivery pipeline.`,
          impact: 'Medium',
          category: 'process',
          type: 'warning',
          recommendation: entityType === 'dpe'
            ? `Focus on test-driven development and increase unit test coverage. Consider pairing with QA engineers to improve testing efficiency. Target: Reduce testing dependency to 25% of total SCT.`
            : `Implement automated testing frameworks at ${entityContext} level, increase test coverage to 85%, and establish parallel testing processes. Target: Reduce testing phase to 25% of total SCT within 2 sprints.`
        },
        {
          id: '3',
          title: `${entityLabel} Consistent Quarter-over-Quarter Improvement`,
          description: `Average SCT for ${entityName} has improved by 15% over the last quarter, consistently trending towards the ≤15 days target. Current trajectory suggests target achievement within next quarter.`,
          impact: 'High',
          category: 'trending',
          type: 'improvement',
          recommendation: entityType === 'dpe'
            ? `Maintain current improvement velocity. Continue learning and applying new development techniques. Consider contributing to knowledge sharing sessions.`
            : `Maintain current improvement velocity. Focus on process standardization across ${entityType} members and continue knowledge sharing to sustain improvements.`
        },
        {
          id: '4',
          title: `${entityLabel} Analysis Phase Optimization Opportunity`,
          description: `Analysis phase averages 4.2 days (28% of SCT) for ${entityName}, with high variance between simple and complex cases. Opportunity for 1-2 day reduction through better requirement gathering.`,
          impact: 'Medium',
          category: 'process',
          type: 'info',
          recommendation: entityType === 'dpe'
            ? `Improve requirement analysis skills through training. Use structured analysis templates and establish regular check-ins with stakeholders to clarify requirements early.`
            : `Implement structured requirement templates for ${entityType} use, establish analysis phase checkpoints, and create complexity-based analysis workflows.`
        },
        {
          id: '5',
          title: `${entityLabel} Resource Allocation Effectiveness`,
          description: `Peak productivity observed during mid-sprint periods for ${entityName}. 23% faster resolution when proper resource allocation is maintained.`,
          impact: 'Medium',
          category: 'resource',
          type: 'info',
          recommendation: entityType === 'dpe'
            ? `Optimize personal task management and communicate workload effectively during sprint planning. Avoid taking on too many complex tasks simultaneously.`
            : `Optimize sprint planning at ${entityContext} level to maintain consistent resource allocation. Avoid task overloading during sprint start/end periods.`
        }
      ],
      metrics: {
        averageSCT: reportCurrentData?.sct || 15,
        targetSCT: 15,
        improvement: '+15%',
        bottleneck: 'Testing Phase',
        efficiency: '78%',
        trend: 'Improving'
      }
    };
    
    setSctAnalysisResults(sctAnalysis);
  };

  const handleCXInsight = () => {
    setCxAnalyzed(true);
    
    // Get entity-specific terminology
    const entityType = generatedEntity || selectedEntity;
    const entityName = generatedEntityValue || selectedEntityValue;
    const entityLabel = entityType === 'dpe' ? 'DPE' : entityType === 'squad' ? 'Squad' : 'Team';
    const entityContext = entityType === 'dpe' ? 'individual' : entityType === 'squad' ? 'squad' : 'team';
    const peerGroup = entityType === 'dpe' ? 'other DPEs' : entityType === 'squad' ? 'other squads' : 'other teams';
    const performanceLevel = entityType === 'dpe' ? 'all DPEs' : entityType === 'squad' ? 'all squads' : 'all teams';
    
    // Generate comprehensive CX insight results with entity-specific detailed recommendations
    const cxInsights = {
      insights: [
        {
          id: '4',
          title: `${entityLabel} Exceptional Customer Satisfaction Performance`,
          description: `${entityName} maintains ${reportCurrentData?.satisfaction || 85}% CSAT, exceeding the 85% target by significant margin. Top 15% performer across ${performanceLevel}.`,
          impact: 'High',
          category: 'satisfaction',
          type: 'success',
          recommendation: entityType === 'dpe'
            ? `Document your customer interaction best practices and consider mentoring junior DPEs. Your communication skills could be valuable for squad-wide training.`
            : `Document and share best practices with underperforming ${peerGroup}. Consider this ${entityType} as a mentoring resource for customer interaction excellence.`
        },
        {
          id: '5',
          title: `${entityLabel} DSAT Root Cause Analysis - Action Required`,
          description: `Primary dissatisfaction drivers for ${entityName}: Response time delays (45%), Communication clarity issues (30%), and Solution completeness (25%). DSAT trending at 6%, above 5% target.`,
          impact: 'High',
          category: 'feedback',
          type: 'warning',
          recommendation: entityType === 'dpe'
            ? `Immediate personal actions: 1) Set response time targets and track them, 2) Attend communication skills training, 3) Use solution checklists before case closure. Consider pairing with high-CSAT DPEs.`
            : `Immediate ${entityContext}-level actions: 1) Implement response time SLA tracking, 2) Provide communication training for ${entityType} members, 3) Establish solution validation checkpoints before closure.`
        },
        {
          id: '6',
          title: `${entityLabel} Positive Customer Feedback Momentum`,
          description: `Positive feedback for ${entityName} increased by 12% this quarter, with specific praise for solution quality (78%), technical expertise (71%), and proactive communication (65%).`,
          impact: 'High',
          category: 'trending',
          type: 'success',
          recommendation: entityType === 'dpe'
            ? `Leverage this momentum by documenting successful case resolutions and sharing techniques with your squad. Consider becoming a customer interaction champion.`
            : `Leverage this momentum by capturing customer success stories from ${entityType} cases, creating case studies, and using positive feedback for ${entityType} member motivation and recognition.`
        },
        {
          id: '7',
          title: `${entityLabel} Customer Interaction Channel Optimization`,
          description: `Phone interactions for ${entityName} show 23% higher satisfaction vs. email/chat. Complex issues resolved 40% faster via direct communication channels.`,
          impact: 'Medium',
          category: 'channel',
          type: 'info',
          recommendation: entityType === 'dpe'
            ? `Prioritize phone calls for your complex cases (P1/P2). Develop phone communication skills and use calls to build stronger customer relationships.`
            : `Implement ${entityContext}-level triage system to route high-impact cases to direct communication channels. Train ${entityType} members on effective phone communication techniques.`
        },
        {
          id: '8',
          title: `${entityLabel} First Contact Resolution Opportunity`,
          description: `First contact resolution rate for ${entityName} at 73%, with potential to reach 85% target. Multi-contact cases show 2.3x longer resolution time and 15% lower satisfaction.`,
          impact: 'Medium',
          category: 'efficiency',
          type: 'improvement',
          recommendation: entityType === 'dpe'
            ? `Enhance your diagnostic skills and knowledge base usage. Practice comprehensive case analysis during first contact to reduce follow-ups.`
            : `Enhance knowledge base accessibility for ${entityType}, implement comprehensive case diagnosis tools, and provide advanced troubleshooting training to improve FCR rate.`
        },
        {
          id: '9',
          title: `${entityLabel} Customer Loyalty and Retention Indicators`,
          description: `Customer retention rate for ${entityName} at 94% with high NPS scores (8.2/10). Customers specifically value technical expertise and solution durability.`,
          impact: 'High',
          category: 'loyalty',
          type: 'success',
          recommendation: entityType === 'dpe'
            ? `Maintain current service quality standards. Continue building technical expertise and consider proactive follow-ups with customers to ensure solution effectiveness.`
            : `Maintain current service quality standards across ${entityType}. Consider implementing customer success check-ins and proactive solution optimization reviews.`
        }
      ],
      metrics: {
        csat: reportCurrentData?.satisfaction || 0,
        dsat: reportCurrentData?.surveyData?.find(d => d.name.includes('DSAT'))?.percentage || 0,
        totalSurveys: reportCurrentData?.totalSurveys || 0,
        trend: '+12%',
        nps: 8.2,
        fcr: '73%',
        retention: '94%'
      }
    };
    
    setCxInsightResults(cxInsights);
  };

  // Utility functions
  const formatEntityDataForComponents = () => {
    return {
      team: entityData.teams || [],
      squad: entityData.squads || [],
      dpe: entityData.dpes || []
    };
  };

  const formatEntityMappingsForComponents = () => {
    return entityMappings;
  };

  const formatEntityDataForQuickAdd = () => {
    return entityData;
  };

  // Get DPEs that belong to the selected squad with validation
  const getSquadMembers = () => {
    if (!generatedEntityValue || generatedEntity !== 'squad') {
      return [];
    }
    
    // Validate entity mappings exist
    if (!entityMappings || !entityMappings.dpeToSquad) {
      console.warn('Entity mappings not available');
      return [];
    }
    
    // Validate entity data exists  
    if (!entityData || !entityData.dpes) {
      console.warn('Entity data not available');
      return [];
    }
    
    const dpeNames = entityData.dpes.filter(dpe => 
      !dpe.includes('Add New') && 
      entityMappings.dpeToSquad[dpe] === generatedEntityValue
    );
    
    // Validate that squad has members
    if (dpeNames.length === 0) {
      console.warn(`No DPEs found for squad: ${selectedEntityValue}`);
    }
    
    return dpeNames;
  };

  const getTeamMembers = () => {
    if (!generatedEntityValue || generatedEntity !== 'team') {
      return [];
    }
    
    // Validate entity mappings exist
    if (!entityMappings || !entityMappings.squadToTeam) {
      console.warn('Entity mappings not available');
      return [];
    }
    
    // Validate entity data exists
    if (!entityData || !entityData.squads) {
      console.warn('Entity data not available');
      return [];
    }
    
    const squadNames = entityData.squads.filter(squad => 
      !squad.includes('Add New') && 
      entityMappings.squadToTeam[squad] === generatedEntityValue
    );
    
    // Validate that team has members
    if (squadNames.length === 0) {
      console.warn(`No Squads found for team: ${selectedEntityValue}`);
    }
    
    return squadNames;
  };

  // Validation helper functions
  const validateEntitySelection = () => {
    if (!selectedEntity) return 'No entity type selected';
    if (!selectedEntityValue) return 'No entity value selected';
    if (selectedEntity.includes('Add New') || selectedEntityValue.includes('Add New')) {
      return 'Invalid entity selection';
    }
    return null;
  };

  const validateEntityHierarchy = () => {
    if (selectedEntity === 'dpe' && selectedEntityValue) {
      const mappedSquad = entityMappings.dpeToSquad?.[selectedEntityValue];
      if (!mappedSquad) {
        return `DPE "${selectedEntityValue}" is not mapped to any squad`;
      }
      
      const mappedTeam = entityMappings.squadToTeam?.[mappedSquad];
      if (!mappedTeam) {
        return `Squad "${mappedSquad}" is not mapped to any team`;
      }
    }
    
    if (selectedEntity === 'squad' && selectedEntityValue) {
      const mappedTeam = entityMappings.squadToTeam?.[selectedEntityValue];
      if (!mappedTeam) {
        return `Squad "${selectedEntityValue}" is not mapped to any team`;
      }
    }
    
    return null;
  };

  // Check if entity has proper child mappings for analysis
  // Diagnostic function to help debug entity data issues
  const diagnoseEntityData = (entityType: string, entityValue: string) => {
    console.log(`=== DIAGNOSING: ${entityType} "${entityValue}" ===`);
    
    if (entityType === 'team') {
      // Check if team exists in entity data
      const teamExists = entityData.teams?.includes(entityValue);
      console.log('Team exists in entityData:', teamExists);
      
      // Check squads mapped to this team
      const mappedSquads = Object.entries(entityMappings.squadToTeam || {})
        .filter(([squad, team]) => team === entityValue);
      console.log('Squads mapped to team:', mappedSquads);
      
      // Check DPEs in those squads
      mappedSquads.forEach(([squadName]) => {
        const dpes = Object.entries(entityMappings.dpeToSquad || {})
          .filter(([dpe, squad]) => squad === squadName);
        console.log(`DPEs in squad "${squadName}":`, dpes);
      });
      
      // Check if squads exist in entityData
      mappedSquads.forEach(([squadName]) => {
        const squadExists = entityData.squads?.includes(squadName);
        console.log(`Squad "${squadName}" exists in entityData:`, squadExists);
      });
    }
    
    console.log('Current entityMappings:', entityMappings);
    console.log('Current entityData:', entityData);
    console.log('========================');
  };

  const validateDataConsistency = () => {
    // Check if entity data is loaded
    if (!entityData || Object.keys(entityData).length === 0) {
      return 'Entity data not loaded';
    }
    
    // Check if mappings are loaded
    if (!entityMappings || Object.keys(entityMappings).length === 0) {
      return 'Entity mappings not loaded';
    }
    
    return null;
  };

  // Data generation functions with validation
  const getSurveyDataFromPerformanceData = (performanceData: any, hasValidData: boolean = true) => {
    // Don't generate survey data if there's no valid performance data
    if (!hasValidData || !performanceData || performanceData.length === 0) {
      return [];
    }
    
    // Check if performance data contains meaningful values
    const hasRealData = performanceData.some((data: any) => 
      data && (data.sct > 0 || data.cases > 0 || data.satisfaction > 0)
    );
    
    if (!hasRealData) {
      return [];
    }
    
    // Calculate survey responses based on performance data
    const totalCases = performanceData.reduce((sum: number, data: any) => sum + (data?.cases || 0), 0);
    const totalResponses = Math.max(50, totalCases * 8); // Approximate 8 surveys per case
    
    // Validate total responses
    if (totalResponses < 10) {
      console.warn('Insufficient survey responses for meaningful analysis');
      return [];
    }
    
    const csatValue = Math.floor(totalResponses * 0.80);
    const neutralValue = Math.floor(totalResponses * 0.15);
    const dsatValue = Math.floor(totalResponses * 0.05); // Reduced to align with 5% target
    
    // Ensure percentages add up correctly
    const calculatedTotal = csatValue + neutralValue + dsatValue;
    const adjustedDsat = dsatValue + (totalResponses - calculatedTotal);
    
    return [
      { 
        name: 'CSAT', 
        value: csatValue, 
        percentage: Math.round((csatValue / totalResponses) * 100),
        color: '#4ade80' 
      },
      { 
        name: 'Neutral', 
        value: neutralValue, 
        percentage: Math.round((neutralValue / totalResponses) * 100),
        color: '#fbbf24' 
      },
      { 
        name: 'DSAT', 
        value: adjustedDsat, 
        percentage: Math.round((adjustedDsat / totalResponses) * 100),
        color: '#ef4444' 
      }
    ];
  };

  const getCurrentData = () => {
    // Return cached data if available and entity selection is valid
    if (cachedDashboardData && 
        selectedEntity && !selectedEntity.includes('Add New') &&
        selectedEntityValue && !selectedEntityValue.includes('Add New')) {
      
      // Extract aggregated metrics from performance data
      const rawPerformanceData = cachedDashboardData.performanceData || [];
      
      // Filter performance data based on entity type and mappings
      let performanceData = rawPerformanceData;
      
      if (selectedEntity === 'dpe') {
        // For DPE, only include data for this specific DPE
        performanceData = rawPerformanceData.filter(p => p.name === selectedEntityValue);
      } else if (selectedEntity === 'squad') {
        // For squad, only include data for DPEs mapped to this squad
        const mappedDPEs = Object.entries(entityMappings.dpeToSquad || {})
          .filter(([dpe, squad]) => squad === selectedEntityValue)
          .map(([dpe]) => dpe);
        console.log(`getCurrentData() - Squad "${selectedEntityValue}" mapped DPEs:`, mappedDPEs);
        performanceData = rawPerformanceData.filter(p => mappedDPEs.includes(p.name));
        console.log(`getCurrentData() - Squad "${selectedEntityValue}" performance data:`, performanceData);
        
        // Check if we have any meaningful performance data
        if (performanceData && performanceData.length > 0) {
          console.log(`getCurrentData() - Squad "${selectedEntityValue}" has ${performanceData.length} performance records`);
        } else {
          console.log(`getCurrentData() - Squad "${selectedEntityValue}" has no performance data`);
          // Early return for squads with no performance data
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
            totalSurveys: 0,
            hasData: false
          };
        }
      } else if (selectedEntity === 'team') {
        // For team, include data for all DPEs in squads mapped to this team
        const mappedSquads = Object.entries(entityMappings.squadToTeam || {})
          .filter(([squad, team]) => team === selectedEntityValue)
          .map(([squad]) => squad);
        
        const teamDPEs = mappedSquads.flatMap(squadName => 
          Object.entries(entityMappings.dpeToSquad || {})
            .filter(([dpe, squad]) => squad === squadName)
            .map(([dpe]) => dpe)
        );
        
        performanceData = rawPerformanceData.filter(p => teamDPEs.includes(p.name));
      }
      
      // Check if we have meaningful performance data and aggregated metrics
      if (performanceData.length === 0) {
        // Return zero/null values when no data
        console.log(`No data for ${selectedEntity} "${selectedEntityValue}": performanceData.length=${performanceData.length}`);
        
        return {
          reportGeneration: null,
          dsatPercentage: null,
          responseRate: null,
          avgRating: null,
          surveyData: [], // No survey data when performance data is not available
          teamData: [],
          sct: null,
          cases: null,
          satisfaction: null,
          dissatisfaction: null,
          totalSurveys: null,
          hasData: false // Flag to indicate no data available
        };
      }

      // Calculate aggregated metrics based on selected entity type
      let aggregatedMetrics;
      
      if (selectedEntity === 'dpe') {
        // For DPE, use the specific DPE's data only
        const dpeData = performanceData.find(p => p.name === selectedEntityValue);
        aggregatedMetrics = dpeData;
        
        // If no data for this specific DPE, it should have been caught above
        if (!aggregatedMetrics) {
          console.warn(`No data found for DPE "${selectedEntityValue}"`);
          aggregatedMetrics = { sct: null, cases: null, satisfaction: null };
        }
      } else if (selectedEntity === 'squad') {
        // For Squad, aggregate all DPEs in the squad
        if (performanceData.length === 0) {
          // No performance data available for this squad
          return {
            reportGeneration: null,
            dsatPercentage: null,
            responseRate: null,
            avgRating: null,
            surveyData: [],
            teamData: [],
            sct: null,
            cases: null,
            satisfaction: null,
            dissatisfaction: null,
            totalSurveys: null,
            hasData: false
          };
        }
        
        const totalCases = performanceData.reduce((sum, p) => sum + p.cases, 0);
        const avgSCT = Math.round(performanceData.reduce((sum, p) => sum + p.sct, 0) / performanceData.length);
        
        // Debug satisfaction values for each DPE
        console.log(`Squad "${selectedEntityValue}" individual satisfaction values:`, 
          performanceData.map(p => ({ name: p.name, satisfaction: p.satisfaction })));
        
        // Only include DPEs with valid satisfaction data (> 0) for satisfaction average
        const validSatisfactionData = performanceData.filter(p => p.satisfaction > 0);
        const avgSatisfaction = validSatisfactionData.length > 0 
          ? Math.round(validSatisfactionData.reduce((sum, p) => sum + p.satisfaction, 0) / validSatisfactionData.length)
          : 0;
          
        console.log(`Squad "${selectedEntityValue}" satisfaction calculation: valid entries=${validSatisfactionData.length}, avgSatisfaction=${avgSatisfaction}`);
        
        aggregatedMetrics = {
          sct: avgSCT,
          cases: totalCases,
          satisfaction: avgSatisfaction
        };
      } else if (selectedEntity === 'team') {
        // For Team, aggregate all squads in the team
        if (performanceData.length === 0) {
          // No performance data available for this team
          return {
            reportGeneration: null,
            dsatPercentage: null,
            responseRate: null,
            avgRating: null,
            surveyData: [],
            teamData: [],
            sct: null,
            cases: null,
            satisfaction: null,
            dissatisfaction: null,
            totalSurveys: null,
            hasData: false
          };
        }
        
        const totalCases = performanceData.reduce((sum, p) => sum + p.cases, 0);
        const avgSCT = Math.round(performanceData.reduce((sum, p) => sum + p.sct, 0) / performanceData.length);
        const avgSatisfaction = Math.round(performanceData.reduce((sum, p) => sum + p.satisfaction, 0) / performanceData.length);
        
        aggregatedMetrics = {
          sct: avgSCT,
          cases: totalCases,
          satisfaction: avgSatisfaction
        };
      } else {
        // Fallback
        aggregatedMetrics = { sct: 15, cases: 10, satisfaction: 85 };
      }

      // Calculate derived metrics only if we have real performance data
      const hasRealPerformanceData = performanceData && performanceData.length > 0;
      console.log(`getCurrentData() - hasRealPerformanceData: ${hasRealPerformanceData}, performanceData.length: ${performanceData?.length}, selectedEntity: ${selectedEntity}, selectedEntityValue: ${selectedEntityValue}`);
      
      // Also check if the entity has proper mappings AND valid satisfaction data
      let hasValidMappings = false;
      let hasValidSatisfactionData = false;
      
      if (selectedEntity === 'squad') {
        const mappedDPEs = Object.entries(entityMappings.dpeToSquad || {})
          .filter(([dpe, squad]) => squad === selectedEntityValue);
        hasValidMappings = mappedDPEs.length > 0;
        // Check if any DPE has valid satisfaction data (> 0)
        hasValidSatisfactionData = performanceData.some(p => p.satisfaction > 0);
        console.log(`getCurrentData() - Squad "${selectedEntityValue}" has ${mappedDPEs.length} mapped DPEs`);
      } else if (selectedEntity === 'dpe') {
        hasValidMappings = Object.keys(entityMappings.dpeToSquad || {}).includes(selectedEntityValue);
        hasValidSatisfactionData = performanceData.some(p => p.satisfaction > 0);
      } else if (selectedEntity === 'team') {
        const mappedSquads = Object.entries(entityMappings.squadToTeam || {})
          .filter(([squad, team]) => team === selectedEntityValue);
        hasValidMappings = mappedSquads.length > 0;
        hasValidSatisfactionData = performanceData.some(p => p.satisfaction > 0);
      }
      
      // Only consider data valid if we have performance data, mappings, AND valid satisfaction data
      const hasValidData = hasRealPerformanceData && hasValidMappings && hasValidSatisfactionData;
      console.log(`getCurrentData() - hasValidMappings: ${hasValidMappings}, hasValidSatisfactionData: ${hasValidSatisfactionData}, hasValidData: ${hasValidData}`);
      
      const dissatisfaction = hasValidData ? 
        Math.max(2, Math.min(12, 100 - aggregatedMetrics.satisfaction - 10)) : 0;
      
      console.log(`getCurrentData() - dissatisfaction: ${dissatisfaction}, aggregatedMetrics.satisfaction: ${aggregatedMetrics.satisfaction}`);
      
      const totalSurveys = hasValidData ? 
        Math.max(50, aggregatedMetrics.cases * 8) : 0; // Approximate 8 surveys per case
      const responseRate = hasValidData ? 
        Math.min(95, Math.max(60, aggregatedMetrics.satisfaction + 5)) : 0; // Response rate correlates with satisfaction
      const avgRating = hasValidData ? 
        Math.max(3.0, Math.min(5.0, aggregatedMetrics.satisfaction / 20)) : 0; // Convert percentage to 5-point scale

      return {
        reportGeneration: { generated: aggregatedMetrics.cases || 0, total: 50 },
        dsatPercentage: dissatisfaction,
        responseRate,
        avgRating: parseFloat(avgRating.toFixed(1)),
        surveyData: getSurveyDataFromPerformanceData(performanceData, true),
        teamData: performanceData,
        sct: aggregatedMetrics.sct,
        cases: aggregatedMetrics.cases,
        satisfaction: aggregatedMetrics.satisfaction,
        dissatisfaction,
        totalSurveys,
        hasData: hasValidData // Flag to indicate valid data is available
      };
    }

    // Fallback for invalid selections or no cached data
    return {
      reportGeneration: null,
      dsatPercentage: null,
      responseRate: null,
      avgRating: null,
      surveyData: [],
      teamData: [],
      sct: null,
      cases: null,
      satisfaction: null,
      dissatisfaction: null,
      totalSurveys: null,
      hasData: false // Flag to indicate no data available
    };
  };

  // Sample data and constants
  // Don't show sample insights - only real insights when data is available
  const sampleInsights: any[] = [];

  // Combine static insights with analysis results
  const getAllInsights = () => {
    let allInsights = [...sampleInsights];
    
    if (sctAnalysisResults) {
      allInsights = [...allInsights, ...sctAnalysisResults.insights];
    }
    
    if (cxInsightResults) {
      allInsights = [...allInsights, ...cxInsightResults.insights];
    }
    
    return allInsights;
  };

  // Use report data only - no live current data
  // const currentData = getCurrentData(); // Removed to prevent UI updates on entity selection

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="/src/assets/i16e-logo-dark.jpeg" 
                  alt="I16E Logo" 
                  className="h-8 w-auto dark:hidden"
                />
                <img 
                  src="/src/assets/i16e-logo-light.jpeg" 
                  alt="I16E Logo" 
                  className="h-8 w-auto hidden dark:block"
                />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Intelliperformance</h1>
                  <p className="text-sm text-muted-foreground">Real-time performance analytics and customer insights</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 space-y-4">
        {/* Performance Analysis Tools - First Panel */}
        <Card className="glass-card p-4">
          <CardHeader className="p-0 mb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Analysis Tools
              </CardTitle>
              <div className="flex items-center gap-2">
                <QuickEntityAdd
                  createTeam={createTeam}
                  createSquad={createSquad}
                  createDPE={createDPE}
                  entityData={formatEntityDataForQuickAdd()}
                  key={entityRefreshKey}
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
              </div>
            </div>
          </CardHeader>
          <div className="flex flex-wrap gap-2 px-0 pb-0">
            <Button 
              onClick={handleAnalyzeSCT}
              disabled={isLoading || !isAnalysisEnabled}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Analyze SCT
            </Button>
            <Button 
              onClick={handleCXInsight}
              disabled={isLoading || !isAnalysisEnabled}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              CX Insight
            </Button>
            <Button 
              onClick={generateDummyData}
              disabled={isLoading}
              variant={dummyDataActive ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              {dummyDataActive ? "Dummy Data Active" : "Dummy Data"}
            </Button>
          </div>
        </Card>

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

        {/* Dashboard Content */}
        {reportGenerated && generatedEntityValue && reportCurrentData ? (() => {
          // Check for entity mapping issues using generated values (not reactive to selection changes)
          const getGeneratedEntityMappingWarning = () => {
            console.log('Checking mapping warning for:', { generatedEntity, generatedEntityValue });
            console.log('Available entityMappings:', entityMappings);
            
            // Skip mapping warnings when dummy data is active
            if (dummyDataActive) {
              console.log('Dummy data active, skipping mapping validation');
              return null;
            }
            
            if (!generatedEntity || !generatedEntityValue) {
              console.log('No generated entity/value, returning null');
              return null;
            }

            if (generatedEntity === 'dpe' && generatedEntityValue) {
              const mappedSquad = entityMappings?.dpeToSquad?.[generatedEntityValue];
              console.log(`DPE "${generatedEntityValue}" mapped to squad:`, mappedSquad);
              if (!mappedSquad) {
                return `DPE "${generatedEntityValue}" is not mapped to any squad`;
              }
              
              const mappedTeam = entityMappings?.squadToTeam?.[mappedSquad];
              console.log(`Squad "${mappedSquad}" mapped to team:`, mappedTeam);
              if (!mappedTeam) {
                return `Squad "${mappedSquad}" is not mapped to any team`;
              }
            }

            if (generatedEntity === 'squad' && generatedEntityValue) {
              const mappedTeam = entityMappings?.squadToTeam?.[generatedEntityValue];
              console.log(`Squad "${generatedEntityValue}" mapped to team:`, mappedTeam);
              if (!mappedTeam) {
                return `Squad "${generatedEntityValue}" is not mapped to any team`;
              }
              
              // Check if squad has any DPEs mapped to it
              const mappedDPEs = Object.entries(entityMappings?.dpeToSquad || {})
                .filter(([dpe, squad]) => squad === generatedEntityValue)
                .map(([dpe]) => dpe);
              
              console.log(`Squad "${generatedEntityValue}" mapped DPEs:`, mappedDPEs);
              if (mappedDPEs.length === 0) {
                return `Squad "${generatedEntityValue}" has no DPE members mapped to it`;
              }
            }

            if (generatedEntity === 'team' && generatedEntityValue) {
              // Check if team has any squads mapped to it
              const mappedSquads = Object.entries(entityMappings?.squadToTeam || {})
                .filter(([squad, team]) => team === generatedEntityValue)
                .map(([squad]) => squad);
              
              console.log(`Team "${generatedEntityValue}" has squads:`, mappedSquads);
              if (mappedSquads.length === 0) {
                return `Team "${generatedEntityValue}" has no squads mapped to it`;
              }
              
              // Check if any of the squads have DPEs mapped to them
              const hasAnyDPEs = mappedSquads.some(squad => {
                const dpeCount = Object.entries(entityMappings?.dpeToSquad || {})
                  .filter(([dpe, mappedSquad]) => mappedSquad === squad).length;
                return dpeCount > 0;
              });
              
              console.log(`Team "${generatedEntityValue}" has DPEs in squads:`, hasAnyDPEs);
              if (!hasAnyDPEs) {
                return `Team "${generatedEntityValue}" has squads but no DPEs mapped to any squad`;
              }
            }

            console.log('No mapping issues found');
            return null;
          };

          const mappingWarning = getGeneratedEntityMappingWarning();
          console.log('Mapping warning result:', mappingWarning);
          
          if (mappingWarning) {
            return (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Entity Mapping Issue</h3>
                <p className="text-muted-foreground mb-4">
                  {mappingWarning}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  This entity configuration prevents generating meaningful performance insights.
                </p>
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                    How to fix this:
                  </h4>
                  <ul className="text-xs text-orange-700 dark:text-orange-300 text-left space-y-1">
                    {generatedEntity === 'team' ? (
                      <>
                        <li>• Use the settings button (⚙️) to manage entity mappings</li>
                        <li>• Create squads and map them to this team</li>
                        <li>• Add DPEs to the created squads</li>
                      </>
                    ) : generatedEntity === 'squad' ? (
                      <>
                        <li>• Use the settings button (⚙️) to manage entity mappings</li>
                        <li>• Create DPEs and map them to this squad</li>
                        <li>• Ensure the squad is mapped to a team</li>
                      </>
                    ) : (
                      <>
                        <li>• Use the settings button (⚙️) to manage entity mappings</li>
                        <li>• Ensure this DPE is mapped to a squad</li>
                        <li>• Ensure the squad is mapped to a team</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            );
          }
          
          // If no mapping issues, render the normal dashboard
          return (
            <div className="space-y-2">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="SCT Score"
                  value={(() => {
                    console.log('KPI Debug - SCT:', reportCurrentData?.sct);
                    return reportCurrentData?.sct;
                  })()}
                  target={reportCurrentData?.sct !== undefined ? 15 : null}
                  unit="days"
                  icon={<Clock className="h-4 w-4" />}
                  description=""
                />
                <KPICard
                  title="Closed Cases"
                  value={(() => {
                    console.log('KPI Debug - Cases:', reportCurrentData?.cases);
                    return reportCurrentData?.cases;
                  })()}
                  target={null}
                  unit=""
                  icon={<CheckCircle className="h-4 w-4" />}
                  description=""
                />
                <KPICard
                  title="CSAT Score"
                  value={(() => {
                    console.log('KPI Debug - CSAT:', reportCurrentData?.satisfaction);
                    return reportCurrentData?.satisfaction;
                  })()}
                  target={reportCurrentData?.satisfaction !== undefined ? 85 : null}
                  unit="%"
                  icon={<ThumbsUp className="h-4 w-4" />}
                  description=""
                />
                <KPICard
                  title="DSAT Score"
                  value={(() => {
                    console.log('KPI Debug - DSAT:', reportCurrentData?.dsatPercentage);
                    return reportCurrentData?.dsatPercentage;
                  })()}
                  target={reportCurrentData?.dsatPercentage !== undefined ? 5 : null}
                  unit="%"
                  icon={<ThumbsDown className="h-4 w-4" />}
                  description=""
                />
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm chart-container">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">
                          {generatedEntity === 'dpe' ? 'DPE Performance Overview' :
                           generatedEntity === 'squad' ? 'Squad Performance Overview' :
                           generatedEntity === 'team' ? 'Team Performance Overview' :
                           'Performance Overview'}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <TeamPerformanceChart
                      data={(() => {
                        if (!reportDashboardData && !reportCurrentData) {
                          return []; // No report generated yet
                        }
                        
                        return reportDashboardData?.performanceData && reportDashboardData.performanceData.length > 0
                          ? reportDashboardData.performanceData
                          : generatedEntity === 'dpe' ? [
                              // For DPE, always create entry even if no data
                              {
                                name: generatedEntityValue || 'Selected DPE', 
                                sct: reportCurrentData?.sct, 
                                cases: reportCurrentData?.cases, 
                                satisfaction: reportCurrentData?.satisfaction
                              }
                            ] : generatedEntity === 'squad' ? (() => {
                              // For squad members using entity mappings
                              const squadMembers = getSquadMembers();
                              if (squadMembers.length === 0) {
                                return [];
                              }
                              // Always show DPE names, use individual performance data if available
                              return squadMembers.map((dpeName) => {
                                // Look for individual DPE data in reportDashboardData.performanceData
                                const dpeData = reportDashboardData?.performanceData?.find(p => p.name === dpeName);
                                return {
                                  name: dpeName,
                                  sct: dpeData?.sct,
                                  cases: dpeData?.cases,
                                  satisfaction: dpeData?.satisfaction
                                };
                              });
                            })() : generatedEntity === 'team' ? (() => {
                              // For team members (squads) using entity mappings
                              const teamMembers = getTeamMembers();
                              if (teamMembers.length === 0) {
                                // No fallback - let the mapping warning system handle this
                                return [];
                              }
                              // Always show squad names, use individual performance data if available
                              return teamMembers.map((squadName) => {
                                // Look for individual squad data in reportDashboardData.performanceData
                                const squadData = reportDashboardData?.performanceData?.find(p => p.name === squadName);
                                return {
                                  name: squadName,
                                  sct: squadData?.sct,
                                  cases: squadData?.cases,
                                  satisfaction: squadData?.satisfaction
                                };
                              });
                            })() : [];
                      })()}
                      onBarClick={handleIndividualBarClick}
                      title={generatedEntityValue || 'Performance Overview'}
                    />
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm chart-container">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="h-5 w-5" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">Customer Satisfaction Distribution</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <SurveyAnalysisChart
                      data={reportCurrentData?.surveyData || []}
                      title={generatedEntityValue || 'Customer Satisfaction'}
                      totalSurveys={reportCurrentData?.totalSurveys || 0}
                      onPieClick={handleSurveySegmentClick}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Backend Status Panel */}
              <BackendStatus className="mt-6" />
              
              {/* Insights Panel */}
              <InsightsPanel 
                insights={getAllInsights()}
                onAnalyzeSCT={handleAnalyzeSCT}
                onCXInsight={handleCXInsight}
                sctAnalyzed={sctAnalyzed}
                cxAnalyzed={cxAnalyzed}
                selectedEntity={selectedEntity}
                generatedEntity={generatedEntity}
                generatedEntityValue={generatedEntityValue}
                isLoading={isLoading}
                isAnalysisEnabled={isAnalysisEnabled}
              />
            </div>
          );
        })() : (
          <div className="space-y-2">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="SCT Score"
                value={null}
                target={null}
                unit="days"
                icon={<Clock className="h-4 w-4" />}
                description=""
              />
              <KPICard
                title="Closed Cases"
                value={null}
                target={null}
                unit=""
                icon={<CheckCircle className="h-4 w-4" />}
                description=""
              />
              <KPICard
                title="CSAT Score"
                value={null}
                target={null}
                unit="%"
                icon={<ThumbsUp className="h-4 w-4" />}
                description=""
              />
              <KPICard
                title="DSAT Score"
                value={null}
                target={null}
                unit="%"
                icon={<ThumbsDown className="h-4 w-4" />}
                description=""
              />
            </div>

            {/* Charts Section - Show different charts based on entity type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart - Always show for DPE, Squad, Team */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm chart-container">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">Performance Overview</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {(() => {
                    const performanceData = cachedDashboardData?.performanceData && cachedDashboardData.performanceData.length > 0
                      ? cachedDashboardData.performanceData
                      : []; // Always show empty data in fallback section
                    
                    // Always show the TeamPerformanceChart component, it will handle the "No data available" state internally
                    return (
                      <TeamPerformanceChart
                        data={performanceData}
                        onBarClick={handleIndividualBarClick}
                        title="Performance Overview"
                      />
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Customer Satisfaction Chart - Conditional based on data availability */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm chart-container">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">Customer Satisfaction Distribution</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  {(() => {
                    const surveyData = [];
                    const totalSurveys = 0;
                    
                    // Always show the SurveyAnalysisChart component, it will handle the "No data available" state internally
                    return (
                      <SurveyAnalysisChart
                        data={surveyData}
                        title="Customer Satisfaction"
                        totalSurveys={totalSurveys}
                        onPieClick={handleSurveySegmentClick}
                      />
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Insights Panel */}
            <InsightsPanel
              insights={getAllInsights()}
              onAnalyzeSCT={handleAnalyzeSCT}
              onCXInsight={handleCXInsight}
              sctAnalyzed={sctAnalyzed}
              cxAnalyzed={cxAnalyzed}
              isAnalysisEnabled={isAnalysisEnabled}
              selectedEntity={selectedEntity}
            />
            
            {/* Metric Breakdown Modal */}
            {selectedMember && (
              <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedMember.metric === 'sct' ? 'SCT Score Breakdown' : 
                       selectedMember.metric === 'cases' ? 'Closed Cases Breakdown' :
                       selectedMember.metric === 'csat' ? 'CSAT Breakdown' :
                       selectedMember.metric === 'neutral' ? 'Neutral Feedback Breakdown' :
                       'DSAT Breakdown'} - {selectedMember.member.name || generatedEntityValue}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {selectedMember.metric === 'sct' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Current SCT</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{selectedMember.member.sct} days</div>
                              <div className="text-xs text-muted-foreground">Target: ≤15 days</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className={`text-2xl font-bold ${selectedMember.member.sct <= 15 ? 'text-green-600' : 'text-red-600'}`}>
                                {selectedMember.member.sct <= 15 ? 'Meeting Target' : 'Above Target'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {selectedMember.member.sct <= 15 ? 'Good performance' : `${selectedMember.member.sct - 15} days over target`}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">SCT Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Analysis Phase:</span>
                                <span>{Math.round(selectedMember.member.sct * 0.3)} days</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Development Phase:</span>
                                <span>{Math.round(selectedMember.member.sct * 0.5)} days</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Testing & Deployment:</span>
                                <span>{Math.round(selectedMember.member.sct * 0.2)} days</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : selectedMember.metric === 'cases' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Closed Cases</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{selectedMember.member.cases}</div>
                              <div className="text-xs text-muted-foreground">This period</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Success Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-green-600">
                                {Math.round((selectedMember.member.cases / (selectedMember.member.cases + 2)) * 100)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {selectedMember.member.cases} closed, {2} pending
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Case Types Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Bug Fixes:</span>
                                <span>{Math.round(selectedMember.member.cases * 0.4)} cases</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Feature Requests:</span>
                                <span>{Math.round(selectedMember.member.cases * 0.3)} cases</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Support Issues:</span>
                                <span>{Math.round(selectedMember.member.cases * 0.3)} cases</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : selectedMember.metric === 'csat' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">CSAT Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-green-600">{selectedMember.member.value}</div>
                              <div className="text-xs text-muted-foreground">{selectedMember.member.percentage}% of total</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Rating Range</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">4-5 Stars</div>
                              <div className="text-xs text-muted-foreground">Satisfied customers</div>
                            </CardContent>
                          </Card>
                        </div>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Satisfaction Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>5-Star Ratings:</span>
                                <span>{Math.round(selectedMember.member.value * 0.7)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>4-Star Ratings:</span>
                                <span>{Math.round(selectedMember.member.value * 0.3)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Primary Praise:</span>
                                <span>Quality & Speed</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : selectedMember.metric === 'neutral' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Neutral Responses</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-yellow-600">{selectedMember.member.value}</div>
                              <div className="text-xs text-muted-foreground">{selectedMember.member.percentage}% of total</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Rating Range</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">3 Stars</div>
                              <div className="text-xs text-muted-foreground">Neutral feedback</div>
                            </CardContent>
                          </Card>
                        </div>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Neutral Feedback Insights</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Mixed Experience:</span>
                                <span>{Math.round(selectedMember.member.value * 0.6)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Indifferent:</span>
                                <span>{Math.round(selectedMember.member.value * 0.4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Improvement Opportunity:</span>
                                <span>Communication</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">DSAT Responses</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-red-600">{selectedMember.member.value}</div>
                              <div className="text-xs text-muted-foreground">{selectedMember.member.percentage}% of total</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Rating Range</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">1-2 Stars</div>
                              <div className="text-xs text-muted-foreground">Dissatisfied customers</div>
                            </CardContent>
                          </Card>
                        </div>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Dissatisfaction Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>1-Star Ratings:</span>
                                <span>{Math.round(selectedMember.member.value * 0.4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>2-Star Ratings:</span>
                                <span>{Math.round(selectedMember.member.value * 0.6)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Primary Concern:</span>
                                <span>Response Time</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Detailed Stats Modal */}
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
