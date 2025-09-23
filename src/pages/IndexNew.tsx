import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { useToast } from '@/hooks/use-toast';

const IndexNew = () => {
  const { toast } = useToast();
  
  // Helper function to format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
  // Helper function to format products array
  const formatProducts = (products: any) => {
    if (!products) return 'N/A';
    
    try {
      // If it's a string, try to parse it as JSON
      if (typeof products === 'string') {
        const parsed = JSON.parse(products);
        if (Array.isArray(parsed)) {
          return parsed.length > 0 ? parsed.join(', ') : 'N/A';
        }
        return products;
      }
      
      // If it's already an array
      if (Array.isArray(products)) {
        return products.length > 0 ? products.join(', ') : 'N/A';
      }
      
      // Fallback to string conversion
      return String(products);
    } catch (error) {
      // If JSON parsing fails, return the original string
      return typeof products === 'string' ? products : 'N/A';
    }
  };
  
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
  const [workflowCompleted, setWorkflowCompleted] = useState<boolean>(false);

  // Additional state for insights and modals
  const [sctAnalyzed, setSctAnalyzed] = useState<boolean>(false);
  const [cxAnalyzed, setCxAnalyzed] = useState<boolean>(false);
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
  
  // Calculate metrics workflow results state
  const [calculateMetricsData, setCalculateMetricsData] = useState<any>(null);
  const [detailedCasesData, setDetailedCasesData] = useState<any[]>([]);

  // Removed auto-selection to allow user to manually choose entities

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
    setWorkflowCompleted(false); // Reset workflow completion
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
    setWorkflowCompleted(false); // Reset workflow completion
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
    // Comprehensive validation before generating report
    if (!selectedEntity) {
      return;
    }
    
    if (!selectedEntityValue || selectedEntityValue.includes('Add New')) {
      return;
    }
    
    // Validate entity type
    if (!['dpe', 'squad', 'team'].includes(selectedEntity)) {
      return;
    }
    
    // Validate that selected entity value exists in current data
    const formattedData = formatEntityDataForComponents();
    
    const entityOptions = formattedData[selectedEntity as 'team' | 'squad' | 'dpe'] || [];
    
    const validOptions = entityOptions.filter(e => !e.includes('Add New'));
    
    if (!validOptions.includes(selectedEntityValue)) {
      return;
    }
    
    // Validate mappings for squad and dpe
    if (selectedEntity === 'dpe') {
      const mappedSquad = entityMappings.dpeToSquad[selectedEntityValue];
      if (!mappedSquad) {
        // DPE is not mapped to any squad
      }
    }
    
    if (selectedEntity === 'squad') {
      const mappedTeam = entityMappings.squadToTeam[selectedEntityValue];
      if (!mappedTeam) {
        // Squad is not mapped to any team
      }
    }
    
    setIsLoading(true);
    setWorkflowCompleted(false); // Reset workflow completion status
    
    // Add diagnostic logging
    diagnoseEntityData(selectedEntity, selectedEntityValue);
    
    try {
      // Fetch real dashboard data based on entity selection and time range
      const startDate = selectedTimeRange.from?.toISOString().split('T')[0];
      const endDate = selectedTimeRange.to?.toISOString().split('T')[0];
      
      const dashboardData = await getDashboardData(selectedEntity, selectedEntityValue, startDate, endDate);
      
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
        setReportCurrentData(reportData);
        
        // Trigger N8N webhook for case data
        try {
          
          // Format date range for API
          const startDate = selectedTimeRange.from!.toISOString().split('T')[0];
          const endDate = selectedTimeRange.to!.toISOString().split('T')[0];
          const formattedDateRange = `${startDate}T00:00:00Z TO ${endDate}T23:59:59Z`;
          
          // Create payload based on entity type and value
          let ownerNames: string[] = [];
          
          
          if (selectedEntity === 'dpe') {
            ownerNames = [selectedEntityValue];
          } else if (selectedEntity === 'squad') {
            // Get DPEs for this squad
            const dpes = await getDPEsWithIds();
            const squads = await getSquadsWithIds();
            
            const squad = squads.find(s => s.name === selectedEntityValue);
            
            if (squad) {
              const squadDPEs = dpes.filter(dpe => dpe.squadID === squad.id);
              ownerNames = squadDPEs.map(dpe => dpe.name);
            }
          } else if (selectedEntity === 'team') {
            // Get all DPEs for this team
            const allDPEs = await getDPEsWithIds();
            const allSquads = await getSquadsWithIds();
            const teams = await getTeamsWithIds();
            
            const team = teams.find(t => t.name === selectedEntityValue);
            
            if (team) {
              const teamSquads = allSquads.filter(squad => squad.teamID === team.id);
              
              const teamSquadIds = teamSquads.map(squad => squad.id);
              
              const teamDPEs = allDPEs.filter(dpe => teamSquadIds.includes(dpe.squadID));
              ownerNames = teamDPEs.map(dpe => dpe.name);
            }
          }
          
          if (ownerNames.length === 0) {
            throw new Error(`No owner names found for ${selectedEntity}: ${selectedEntityValue}`);
          }
          
          const payload = {
            entityType: selectedEntity,
            entityName: selectedEntityValue,
            ownerNames: ownerNames,
            eurekaDateRange: formattedDateRange,
            // Also include the original format for compatibility
            owner_full_name: ownerNames,
            closed_date: [formattedDateRange]
          };
          
          // Step 1: Call get-cases webhook
          const getCasesResponse = await fetch('http://localhost:3001/api/n8n/get-cases', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          
          const getCasesResult = await getCasesResponse.json();
          
          if (getCasesResponse.ok && getCasesResult.success) {
            toast({
              title: "Workflow Started",
              description: "N8N workflow started successfully. Case data collection and metrics calculation will run sequentially.",
            });
          } else {
            toast({
              title: "Workflow Failed", 
              description: `Get-cases workflow trigger failed: ${getCasesResult.message || 'Unknown error'}`,
              variant: "destructive"
            });
          }
        } catch (webhookError) {
          toast({
            title: "Webhook Error",
            description: "Failed to trigger N8N workflow, but report generation continues.",
            variant: "destructive"
          });
        }
        
        // Always generate report - let dashboard components handle "No data available" display
        setReportGenerated(true);
        setGeneratedEntity(selectedEntity);
        setGeneratedEntityValue(selectedEntityValue);
        setEntityChanged(false);
        setIsAnalysisEnabled(true);
      } else {
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

  // Function to fetch Calculate metrics results from database
  const fetchCalculateMetricsResults = async () => {
    try {
      // Check if we have the entity and time range data needed
      if (!generatedEntity || !generatedEntityValue) {
        alert(`Missing entity data: generatedEntity=${generatedEntity}, generatedEntityValue=${generatedEntityValue}`);
        return;
      }

      // First try to get performance data from the performance_data collection
      const startDate = selectedTimeRange.from?.toISOString().split('T')[0];
      const endDate = selectedTimeRange.to?.toISOString().split('T')[0];

      // Query using entity_name instead of entity since we're storing the name directly
      const apiUrl = `http://localhost:3001/api/performance-data?entity_name=${generatedEntityValue}&startDate=${startDate}&endDate=${endDate}`;
      
      try {
        let performanceResponse = await fetch(apiUrl);
        
        if (performanceResponse.ok) {
          const performanceResult = await performanceResponse.json();
          
          if (performanceResult && performanceResult.length > 0) {
            const latestMetrics = performanceResult[0];
            
            const metricsToSet = {
              sct: latestMetrics.metrics?.sct,
              closedCases: latestMetrics.metrics?.closedCases,
              satisfaction: latestMetrics.metrics?.satisfaction
            };
            
            setCalculateMetricsData(metricsToSet);
          
          if (latestMetrics.sample_cases) {
            // Map the real case data to the format expected by the UI
            const mappedCasesData = latestMetrics.sample_cases.map(caseItem => {
              let parsedProducts = [];
              try {
                if (caseItem.products) {
                  if (typeof caseItem.products === 'string') {
                    parsedProducts = JSON.parse(caseItem.products);
                  } else if (Array.isArray(caseItem.products)) {
                    parsedProducts = caseItem.products;
                  }
                }
              } catch (error) {
                parsedProducts = [caseItem.products]; // Keep as string if JSON parsing fails
              }

              return {
                case_id: caseItem.case_id,
                title: caseItem.title,
                status: caseItem.status,
                case_age_days: caseItem.case_age_days,
                sct: caseItem.case_age_days, // Map case_age_days to sct for compatibility
                sctTime: caseItem.case_age_days, // Also map to sctTime
                owner_full_name: caseItem.owner_full_name,
                created_date: caseItem.created_date,
                closed_date: caseItem.closed_date,
                priority: caseItem.priority || 'Medium', // Use actual priority from data
                products: parsedProducts // Properly parsed products
              };
            });
            setDetailedCasesData(mappedCasesData);
          } else {
            alert('No sample_cases found in performance data');
          }
          
          // Update reportCurrentData with the actual calculated metrics
          setReportCurrentData(prev => ({
            ...prev,
            sct: latestMetrics.metrics?.sct,
            closedCases: latestMetrics.metrics?.closedCases,
            cases: latestMetrics.metrics?.closedCases,
            satisfaction: latestMetrics.metrics?.satisfaction,
            hasMetricsData: true
          }));
          
          // Mark workflow as completed since we have performance data
          setWorkflowCompleted(true);
          return;
        } else {
          // Performance data response was empty
        }
      } else {
        // Performance data response not OK
      }
      } catch (apiError) {
        // Error during API call
      }

      // Fallback: Calculate metrics from cases data directly
      const casesResponse = await fetch(`http://localhost:3001/api/cases?owner_full_name=${generatedEntityValue}&status=Resolved&startDate=${startDate}&endDate=${endDate}`);
      
      if (casesResponse.ok) {
        const casesResult = await casesResponse.json();
        
        if (casesResult.data && casesResult.data.length > 0) {
          const cases = casesResult.data;
          
          // Calculate metrics from cases
          let totalSct = 0;
          let validSctCases = 0;
          
          cases.forEach(caseItem => {
            if (caseItem.case_age_days && !isNaN(caseItem.case_age_days)) {
              totalSct += caseItem.case_age_days;
              validSctCases++;
            }
          });
          
          const avgSct = validSctCases > 0 ? Math.round((totalSct / validSctCases) * 10) / 10 : 0;
          const closedCases = cases.length;
          
          // Store calculated metrics
          setCalculateMetricsData({
            sct: avgSct,
            closedCases: closedCases,
            satisfaction: 85 // Default value
          });
          
          // Store detailed cases
          setDetailedCasesData(cases.map(caseItem => ({
            case_id: caseItem.case_id,
            title: caseItem.title,
            status: caseItem.status,
            case_age_days: caseItem.case_age_days,
            owner_full_name: caseItem.owner_full_name,
            created_date: caseItem.created_date,
            closed_date: caseItem.closed_date,
            priority: caseItem.priority || 'Medium',
            products: caseItem.products
          })));
          
          // Update reportCurrentData with calculated values
          setReportCurrentData(prev => ({
            ...prev,
            sct: avgSct,
            closedCases: closedCases,
            cases: closedCases,
            satisfaction: 85,
            hasMetricsData: true
          }));
          
          toast({
            title: "Metrics Calculated",
            description: `Calculated metrics from ${closedCases} resolved cases.`,
          });
          
          // Mark workflow as completed for fallback calculation
          setWorkflowCompleted(true);
        } else {
          // Mark workflow as completed even without data to prevent infinite loading
          setWorkflowCompleted(true);
        }
      } else {
        // Mark workflow as completed even on failure to prevent infinite loading
        setWorkflowCompleted(true);
      }
    } catch (error) {
      // Mark workflow as completed on error to prevent infinite loading
      setWorkflowCompleted(true);
    }
  };

  // Effect to poll for Calculate metrics results after report generation
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (reportGenerated && generatedEntity && generatedEntityValue && isLoading === false && !workflowCompleted) {
      
      // Initial fetch
      fetchCalculateMetricsResults();
      
      // Poll every 3 seconds for up to 90 seconds
      let pollCount = 0;
      const maxPolls = 30; // 90 seconds with 3-second intervals
      
      pollInterval = setInterval(async () => {
        pollCount++;
        
        await fetchCalculateMetricsResults();
        
        // Stop polling if max attempts reached (workflowCompleted is checked in auto-completion effect)
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
        }
      }, 3000);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [reportGenerated, generatedEntity, generatedEntityValue, isLoading]); // Removed workflowCompleted from dependencies

  // Effect to stop polling when workflow is completed
  useEffect(() => {
    if (workflowCompleted) {
      // Note: polling interval is automatically cleared by the auto-completion effect
    }
  }, [workflowCompleted]);

  // Effect to auto-complete workflow if we have valid data
  useEffect(() => {
    // Auto-complete if we have calculateMetricsData (primary data source)
    if (reportGenerated && !workflowCompleted && calculateMetricsData) {
      setWorkflowCompleted(true);
    }
    // Fallback: auto-complete after 90 seconds if we have reportCurrentData but no calculateMetricsData
    else if (reportGenerated && !workflowCompleted && reportCurrentData && !calculateMetricsData) {
      const fallbackTimer = setTimeout(() => {
        setWorkflowCompleted(true);
      }, 90000); // 90 seconds
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [reportGenerated, workflowCompleted, calculateMetricsData, reportCurrentData]);

  const handleEntityDataChange = (entityType: string, data: string[]) => {
    setEntityRefreshKey(prev => prev + 1);
    refreshData();
  };

  const handleMappingsChange = (mappings: any) => {
    setEntityRefreshKey(prev => prev + 1);
    refreshData();
  };

  const handleChartClick = (data: any, chartType: string, title: string) => {
    // Chart click handler
  };

  const handleSurveySegmentClick = (data: any, segment: string) => {
    
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
    // Use detailed cases data from the clicked member's data if available
    let detailsData;
    const memberDetailedCases = data.detailedCases || detailedCasesData || [];
    
    if (memberDetailedCases && memberDetailedCases.length > 0) {
      // Filter cases based on metric type and show actual workflow data
      if (metric === 'sct') {
        // For SCT analysis, show all cases (they all have SCT data)
        detailsData = memberDetailedCases;
      } else if (metric === 'cases') {
        detailsData = memberDetailedCases; // Show all closed cases
      }
    } else {
      // Fallback to generated data if no workflow results available
      detailsData = generateDetailedData(data, metric);
    }
    
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
      // Generate sample SCT case details with correct field names
      return Array.from({ length: 8 }, (_, index) => ({
        case_id: `TM-${String(2024001 + index).padStart(7, '0')}`,
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
        case_age_days: 15 + index, // SCT days
        priority: ['P1', 'P2', 'P3', 'P4'][index % 4],
        products: '["Trend Vision One"]',
        created_date: new Date(Date.now() - (index + 5) * 24 * 60 * 60 * 1000).toISOString(),
        closed_date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Closed'
      }));
    } else {
      // Generate sample cases data with correct field names
      return Array.from({ length: member.cases || 10 }, (_, index) => ({
        case_id: `TM-${String(2024100 + index).padStart(7, '0')}`,
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
        status: 'Closed',
        priority: ['P1', 'P2', 'P3', 'P4'][index % 4],
        products: '["Trend Vision One"]',
        created_date: new Date(Date.now() - (index + 10) * 24 * 60 * 60 * 1000).toISOString(),
        closed_date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        case_age_days: index + 5
      }));
    }
  };

  const handleAnalyzeSCT = () => {
    setSctAnalyzed(true);
    
    // Get entity-specific terminology
    const entityType = generatedEntity || selectedEntity;
    const entityName = generatedEntityValue || selectedEntityValue;
    const entityLabel = entityType === 'dpe' ? 'DPE' : entityType === 'squad' ? 'Squad' : 'Team';
    
    // Use real case data if available
    const realCaseData = detailedCasesData || [];
    const currentSCT = calculateMetricsData?.sct || reportCurrentData?.sct || 0;
    
    if (realCaseData.length === 0) {
      // Fallback to dummy data only if no real data available
      const sctAnalysis = {
        insights: [
          {
            id: '1',
            title: 'No Case Data Available',
            description: 'No resolved cases found for the selected time period to analyze SCT performance.',
            impact: 'Low',
            category: 'data',
            type: 'info',
            recommendation: 'Generate a report for a period with resolved cases to see detailed SCT analysis.'
          }
        ],
        metrics: {
          averageSCT: currentSCT,
          targetSCT: 15,
          improvement: 'N/A',
          bottleneck: 'N/A',
          efficiency: 'N/A',
          trend: 'Insufficient Data'
        },
        cases: []
      };
      setSctAnalysisResults(sctAnalysis);
      return;
    }
    
    // Analyze real case data
    const insights = [];
    const caseList = realCaseData.map(caseItem => ({
      case_id: caseItem.case_id,
      title: caseItem.title,
      sct_days: caseItem.case_age_days,
      status: caseItem.status,
      created_date: caseItem.created_date,
      closed_date: caseItem.closed_date
    }));
    
    // Calculate actual metrics from real data
    const sctValues = realCaseData.map(c => c.case_age_days).filter(sct => sct > 0);
    const avgSCT = sctValues.length > 0 ? Math.round(sctValues.reduce((a, b) => a + b, 0) / sctValues.length * 10) / 10 : currentSCT;
    const minSCT = sctValues.length > 0 ? Math.min(...sctValues) : 0;
    const maxSCT = sctValues.length > 0 ? Math.max(...sctValues) : 0;
    const targetSCT = 15;
    
    // Performance analysis
    if (avgSCT <= targetSCT) {
      insights.push({
        id: '1',
        title: `${entityLabel} SCT Performance Above Target`,
        description: `${entityName} achieves ${avgSCT} days average SCT, meeting the ≤${targetSCT} days target. Best case: ${minSCT} days, Longest case: ${maxSCT} days.`,
        impact: 'High',
        category: 'performance',
        type: 'success',
        recommendation: `Continue current practices. Share successful techniques with team members.`
      });
    } else {
      insights.push({
        id: '1',
        title: `${entityLabel} SCT Performance Below Target`,
        description: `${entityName} averages ${avgSCT} days SCT, ${Math.round((avgSCT - targetSCT) * 10) / 10} days above the ${targetSCT} days target. Improvement needed.`,
        impact: 'High',
        category: 'performance',
        type: 'warning',
        recommendation: `Focus on reducing case resolution time. Analyze longest cases (${maxSCT} days) for process improvements.`
      });
    }
    
    // Case complexity analysis
    const complexCases = realCaseData.filter(c => c.case_age_days > 30);
    if (complexCases.length > 0) {
      insights.push({
        id: '2',
        title: `Complex Cases Identified`,
        description: `${complexCases.length} of ${realCaseData.length} cases took over 30 days to resolve. These include: ${complexCases.map(c => c.case_id).join(', ')}.`,
        impact: 'Medium',
        category: 'process',
        type: 'warning',
        recommendation: `Review complex cases for common patterns. Consider breaking down large cases or improving estimation.`
      });
    }
    
    // Case variety analysis
    const uniqueTitles = [...new Set(realCaseData.map(c => c.title.toLowerCase()))];
    insights.push({
      id: '3',
      title: `Case Variety Analysis`,
      description: `${realCaseData.length} cases resolved with ${uniqueTitles.length} unique case types. Most common areas: ${realCaseData.map(c => c.title).slice(0, 3).join(', ')}.`,
      impact: 'Medium',
      category: 'process',
      type: 'info',
      recommendation: `Consider creating templates or knowledge base articles for recurring case types to improve resolution speed.`
    });
    
    const sctAnalysis = {
      insights,
      metrics: {
        averageSCT: avgSCT,
        targetSCT: targetSCT,
        improvement: avgSCT <= targetSCT ? 'Target Met' : `${Math.round((avgSCT - targetSCT) * 10) / 10} days over target`,
        bottleneck: maxSCT > 60 ? 'Complex Cases' : 'Standard Process',
        efficiency: Math.round((targetSCT / avgSCT) * 100) + '%',
        trend: avgSCT <= targetSCT ? 'On Target' : 'Needs Improvement'
      },
      cases: caseList
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
      return [];
    }
    
    // Validate entity data exists  
    if (!entityData || !entityData.dpes) {
      return [];
    }
    
    const dpeNames = entityData.dpes.filter(dpe => 
      !dpe.includes('Add New') && 
      entityMappings.dpeToSquad[dpe] === generatedEntityValue
    );
    
    // Validate that squad has members
    if (dpeNames.length === 0) {
      // No DPEs found for squad
    }
    
    return dpeNames;
  };

  const getTeamMembers = () => {
    if (!generatedEntityValue || generatedEntity !== 'team') {
      return [];
    }
    
    // Validate entity mappings exist
    if (!entityMappings || !entityMappings.squadToTeam) {
      return [];
    }
    
    // Validate entity data exists
    if (!entityData || !entityData.squads) {
      return [];
    }
    
    const squadNames = entityData.squads.filter(squad => 
      !squad.includes('Add New') && 
      entityMappings.squadToTeam[squad] === generatedEntityValue
    );
    
    // Validate that team has members
    if (squadNames.length === 0) {
      // No Squads found for team
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
    if (entityType === 'team') {
      // Check if team exists in entity data
      const teamExists = entityData.teams?.includes(entityValue);
      
      // Check squads mapped to this team
      const mappedSquads = Object.entries(entityMappings.squadToTeam || {})
        .filter(([squad, team]) => team === entityValue);
      
      // Check DPEs in those squads
      mappedSquads.forEach(([squadName]) => {
        const dpes = Object.entries(entityMappings.dpeToSquad || {})
          .filter(([dpe, squad]) => squad === squadName);
      });
      
      // Check if squads exist in entityData
      mappedSquads.forEach(([squadName]) => {
        const squadExists = entityData.squads?.includes(squadName);
      });
    }
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
        performanceData = rawPerformanceData.filter(p => mappedDPEs.includes(p.name));
        
        // Check if we have any meaningful performance data
        if (performanceData && performanceData.length > 0) {
          // Squad has performance records
        } else {
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
        
        // Only include DPEs with valid satisfaction data (> 0) for satisfaction average
        const validSatisfactionData = performanceData.filter(p => p.satisfaction > 0);
        const avgSatisfaction = validSatisfactionData.length > 0 
          ? Math.round(validSatisfactionData.reduce((sum, p) => sum + p.satisfaction, 0) / validSatisfactionData.length)
          : 0;
        
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
      
      // Also check if the entity has proper mappings AND valid satisfaction data
      let hasValidMappings = false;
      let hasValidSatisfactionData = false;
      
      if (selectedEntity === 'squad') {
        const mappedDPEs = Object.entries(entityMappings.dpeToSquad || {})
          .filter(([dpe, squad]) => squad === selectedEntityValue);
        hasValidMappings = mappedDPEs.length > 0;
        // Check if any DPE has valid satisfaction data (> 0)
        hasValidSatisfactionData = performanceData.some(p => p.satisfaction > 0);
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
      
      const dissatisfaction = hasValidData ? 
        Math.max(2, Math.min(12, 100 - aggregatedMetrics.satisfaction - 10)) : 0;
      
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
        {/* Backend Status - Always visible at the top */}
        <BackendStatus />
        
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

        {/* Workflow Processing Status */}
        {reportGenerated && !workflowCompleted && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div className="space-y-2">
                <p className="text-lg font-medium">Processing workflows...</p>
                <p className="text-sm text-muted-foreground">
                  Calculating performance metrics from case data. This may take up to 2 minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {reportGenerated && generatedEntityValue && reportCurrentData && workflowCompleted ? (() => {
          // Check for entity mapping issues using generated values (not reactive to selection changes)
          const getGeneratedEntityMappingWarning = () => {
            if (!generatedEntity || !generatedEntityValue) {
              return null;
            }

            if (generatedEntity === 'dpe' && generatedEntityValue) {
              const mappedSquad = entityMappings?.dpeToSquad?.[generatedEntityValue];
              if (!mappedSquad) {
                return `DPE "${generatedEntityValue}" is not mapped to any squad`;
              }
              
              const mappedTeam = entityMappings?.squadToTeam?.[mappedSquad];
              if (!mappedTeam) {
                return `Squad "${mappedSquad}" is not mapped to any team`;
              }
            }

            if (generatedEntity === 'squad' && generatedEntityValue) {
              const mappedTeam = entityMappings?.squadToTeam?.[generatedEntityValue];
              if (!mappedTeam) {
                return `Squad "${generatedEntityValue}" is not mapped to any team`;
              }
              
              // Check if squad has any DPEs mapped to it
              const mappedDPEs = Object.entries(entityMappings?.dpeToSquad || {})
                .filter(([dpe, squad]) => squad === generatedEntityValue)
                .map(([dpe]) => dpe);
              
              if (mappedDPEs.length === 0) {
                return `Squad "${generatedEntityValue}" has no DPE members mapped to it`;
              }
            }

            if (generatedEntity === 'team' && generatedEntityValue) {
              // Check if team has any squads mapped to it
              const mappedSquads = Object.entries(entityMappings?.squadToTeam || {})
                .filter(([squad, team]) => team === generatedEntityValue)
                .map(([squad]) => squad);
              
              if (mappedSquads.length === 0) {
                return `Team "${generatedEntityValue}" has no squads mapped to it`;
              }
              
              // Check if any of the squads have DPEs mapped to them
              const hasAnyDPEs = mappedSquads.some(squad => {
                const dpeCount = Object.entries(entityMappings?.dpeToSquad || {})
                  .filter(([dpe, mappedSquad]) => mappedSquad === squad).length;
                return dpeCount > 0;
              });
              
              if (!hasAnyDPEs) {
                return `Team "${generatedEntityValue}" has squads but no DPEs mapped to any squad`;
              }
            }

            return null;
          };

          const mappingWarning = getGeneratedEntityMappingWarning();
          
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
                  value={calculateMetricsData?.sct || reportCurrentData?.sct}
                  target={calculateMetricsData?.sct !== undefined || reportCurrentData?.sct !== undefined ? 15 : null}
                  unit="days"
                  icon={<Clock className="h-4 w-4" />}
                  description=""
                />
                <KPICard
                  title="Closed Cases"
                  value={calculateMetricsData?.closedCases || reportCurrentData?.closedCases || reportCurrentData?.cases}
                  target={null}
                  unit=""
                  icon={<CheckCircle className="h-4 w-4" />}
                  description=""
                />
                <KPICard
                  title="CSAT Score"
                  value={calculateMetricsData?.satisfaction || reportCurrentData?.satisfaction}
                  target={calculateMetricsData?.satisfaction !== undefined || reportCurrentData?.satisfaction !== undefined ? 85 : null}
                  unit="%"
                  icon={<ThumbsUp className="h-4 w-4" />}
                  description=""
                />
                <KPICard
                  title="DSAT Score"
                  value={calculateMetricsData?.dsatPercentage || reportCurrentData?.dsatPercentage}
                  target={calculateMetricsData?.dsatPercentage !== undefined || reportCurrentData?.dsatPercentage !== undefined ? 5 : null}
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
                        if (!reportDashboardData && !reportCurrentData && !calculateMetricsData) {
                          return []; // No report generated yet
                        }
                        
                        return reportDashboardData?.performanceData && reportDashboardData.performanceData.length > 0
                          ? reportDashboardData.performanceData.map(item => ({
                              name: item.name,
                              sct: calculateMetricsData?.sct || item.sct,
                              cases: calculateMetricsData?.closedCases || item.cases,
                              satisfaction: calculateMetricsData?.satisfaction || item.satisfaction,
                              detailedCases: detailedCasesData || item.cases || [] // Real case data for modal
                            }))
                          : generatedEntity === 'dpe' ? [
                              // For DPE, always create entry even if no data
                              {
                                name: generatedEntityValue || 'Selected DPE',
                                sct: calculateMetricsData?.sct || reportCurrentData?.sct || 0, 
                                cases: calculateMetricsData?.closedCases || reportCurrentData?.closedCases || reportCurrentData?.cases || 0,
                                satisfaction: calculateMetricsData?.satisfaction || reportCurrentData?.satisfaction || 0,
                                detailedCases: detailedCasesData || [] // Real case data for modal
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
                                  sct: calculateMetricsData?.sct || dpeData?.sct || 0,
                                  cases: calculateMetricsData?.closedCases || dpeData?.cases || 0,
                                  satisfaction: calculateMetricsData?.satisfaction || dpeData?.satisfaction || 0,
                                  detailedCases: detailedCasesData || [] // Real case data
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
                                  sct: calculateMetricsData?.sct || squadData?.sct || 0,
                                  cases: calculateMetricsData?.closedCases || squadData?.cases || 0,
                                  satisfaction: calculateMetricsData?.satisfaction || squadData?.satisfaction || 0,
                                  detailedCases: detailedCasesData || [] // Real case data
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

export default IndexNew;
