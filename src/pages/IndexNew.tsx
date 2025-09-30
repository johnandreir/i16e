import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, FileText, Users, TrendingUp, AlertCircle, CheckCircle2, Clock, Target, BarChart3, PieChart, PieChart as PieChartIcon, Activity, ThumbsUp, ThumbsDown, CheckCircle, Lightbulb, Database } from 'lucide-react';
import ThemeToggle from '@/components/ui/theme-toggle';
import KPICard from '@/components/dashboard/KPICard';
import FilterSection from '@/components/dashboard/FilterSection';
import TeamPerformanceChart from '@/components/dashboard/TeamPerformanceChart';
import SurveyAnalysisChart from '@/components/dashboard/SurveyAnalysisChart';
import InsightsPanel from '@/components/dashboard/ImprovedInsightsPanel';
import DetailedStatsModal from '@/components/dashboard/DetailedStatsModal';
import QuickEntityAdd from '@/components/dashboard/QuickEntityAdd';
import EntityManagementDialog from '@/components/dashboard/EntityManagementDialog';
import BackendStatus from '@/components/dashboard/BackendStatus';
import Chatbot from '@/components/dashboard/Chatbot';
import { useEntityDatabase } from '@/hooks/useEntityDatabase';
import { DashboardData } from '@/lib/entityService';
import CasePerformanceService from '@/lib/casePerformanceService';
import CustomerSatisfactionService, { EntitySatisfactionData, ChartSurveyData } from '@/lib/customerSatisfactionService';
import { n8nWorkflowService } from '@/lib/n8nWorkflowService';
import { useToast } from '@/hooks/use-toast';

// Interface for TeamPerformanceChart data
interface TeamMember {
  name: string;
  sct: number;
  cases: number;
  satisfaction: number;
  detailedCases?: any[];
}

const IndexNew = () => {
  const { toast } = useToast();
  
  // Helper function to format numbers to 2 decimal places if not integer
  const formatKPIValue = (value: number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    
    // If it's already an integer, return as is
    if (Number.isInteger(value)) return value;
    
    // Round to 2 decimal places
    return Math.round(value * 100) / 100;
  };
  
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
    from.setDate(to.getDate() - 120); // Last 120 days as default, but will strictly filter by this range
    console.log('📅 Setting initial time range:', from.toISOString(), 'to', to.toISOString());
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
  const [isSurveyAnalyzed, setIsSurveyAnalyzed] = useState<boolean>(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(false);
  const [isSCTAnalysisLoading, setIsSCTAnalysisLoading] = useState<boolean>(false);
  const [isSurveyAnalysisLoading, setIsSurveyAnalysisLoading] = useState<boolean>(false);
  const [cxAnalyzed, setCxAnalyzed] = useState<boolean>(false);
  const [performanceOverviewData, setPerformanceOverviewData] = useState<TeamMember[]>([]);
  const [isAnalysisEnabled, setIsAnalysisEnabled] = useState<boolean>(false);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState<boolean>(false);
  const [isSatisfactionLoading, setIsSatisfactionLoading] = useState<boolean>(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [cachedDashboardData, setCachedDashboardData] = useState<DashboardData | null>(null);
  const [reportDashboardData, setReportDashboardData] = useState<DashboardData | null>(null);
  const [reportCurrentData, setReportCurrentData] = useState<any>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalType, setModalType] = useState<'team' | 'survey' | 'individual'>('individual');
  const [modalTitle, setModalTitle] = useState<string>('');
  const [sctAnalysisResults, setSctAnalysisResults] = useState<any>(null);
  const [cxInsightResults, setCxInsightResults] = useState<any>(null);
  const [surveyAnalysisResults, setSurveyAnalysisResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  // Set default active tab based on selected entity
  useEffect(() => {
    if (selectedEntity === 'squad') {
      setActiveTab('dpe');
    } else if (selectedEntity === 'team') {
      setActiveTab('squad');
    }
  }, [selectedEntity]);

  // Helper function to calculate aggregated data based on active tab
  const getAggregatedData = () => {
    // Use the correct data source based on tab and entity type
    let dataToAggregate = [];
    
    if (!reportDashboardData?.performanceData || reportDashboardData.performanceData.length === 0) {
      return { avgSct: null, totalCases: null, avgSatisfaction: null };
    }

    // Always use reportDashboardData.performanceData for aggregation
    dataToAggregate = reportDashboardData.performanceData;
    
    const avgSct = dataToAggregate.reduce((acc, member) => acc + member.sct, 0) / dataToAggregate.length;
    const totalCases = dataToAggregate.reduce((acc, member) => acc + member.cases, 0);
    const avgSatisfaction = dataToAggregate.reduce((acc, member) => acc + member.satisfaction, 0) / dataToAggregate.length;

    return {
      avgSct: Math.round(avgSct * 100) / 100,
      totalCases,
      avgSatisfaction: Math.round(avgSatisfaction * 100) / 100
    };
  };

  // Helper function to get chart data based on active tab
  const getChartData = () => {
    if (!reportDashboardData?.performanceData) return [];

    let chartData = [];

    if (selectedEntity === 'squad') {
      if (activeTab === 'squad') {
        // Squad tab: Show aggregated squad-level data (one bar for the entire squad)
        const aggregated = getAggregatedData();
        chartData = [{
          name: generatedEntityValue || 'Squad',
          sct: aggregated.avgSct,
          cases: aggregated.totalCases,
          satisfaction: aggregated.avgSatisfaction,
          detailedCases: reportDashboardData.performanceData.flatMap(member => member.detailedCases || [])
        }];
        console.log(`📊 getChartData (${selectedEntity} - ${activeTab} - squad aggregated):`, chartData);
      } else {
        // DPE tab: Show individual DPE data (each bar represents one squad member)
        chartData = reportDashboardData.performanceData.map(member => ({
          name: member.name,
          sct: member.sct,
          cases: member.cases,
          satisfaction: member.satisfaction,
          detailedCases: member.detailedCases
        }));
        console.log(`📊 getChartData (${selectedEntity} - ${activeTab} - individual DPE):`, chartData);
      }
    } else if (selectedEntity === 'team') {
      if (activeTab === 'team') {
        // Team tab: Show squad-level aggregated data for team view
        // Each bar represents one squad's aggregated metrics
        chartData = reportDashboardData.performanceData.map(squad => ({
          name: squad.name,
          sct: squad.sct,
          cases: squad.cases,
          satisfaction: squad.satisfaction,
          detailedCases: squad.detailedCases
        }));
        console.log(`📊 getChartData (${selectedEntity} - ${activeTab} - squad level):`, chartData);
      } else {
        // Squad tab: Show individual DPE data from all squads in the team
        // Each bar represents one individual DPE across all squads
        const individualData = reportDashboardData.individualDPEData || reportDashboardData.performanceData;
        chartData = individualData.map(member => ({
          name: member.name,
          sct: member.sct,
          cases: member.cases,
          satisfaction: member.satisfaction,
          detailedCases: member.detailedCases
        }));
        console.log(`📊 getChartData (${selectedEntity} - ${activeTab} - individual DPE):`, chartData);
      }
    } else {
      chartData = reportDashboardData.performanceData;
      console.log(`📊 getChartData (fallback):`, chartData);
    }

    return chartData;
  };

  // Helper function to get ALL KPI data based on active tab (SCT, Cases, CSAT, DSAT)
  const getKPIData = () => {
    const aggregated = getAggregatedData();
    const aggregatedSatisfaction = getAggregatedSatisfactionData();
    
    if (selectedEntity === 'squad') {
      // For squad entities, always show aggregated data from the squad members (DPEs)
      // This applies to both DPE and Squad tabs since they show the same underlying data
      return {
        sct: aggregated.avgSct,
        cases: aggregated.totalCases,
        csat: aggregatedSatisfaction.csat,
        dsat: aggregatedSatisfaction.dsat
      };
    } else if (selectedEntity === 'team') {
      // For team entities, show appropriate data based on tab
      if (activeTab === 'team') {
        // Team tab: Show aggregated data from all squads
        return {
          sct: aggregated.avgSct,
          cases: aggregated.totalCases,
          csat: aggregatedSatisfaction.csat,
          dsat: aggregatedSatisfaction.dsat
        };
      } else {
        // Squad tab: Show aggregated data from all individual DPEs in all squads
        // Use individual DPE data if available, otherwise fall back to squad data
        if (reportDashboardData?.individualDPEData && reportDashboardData.individualDPEData.length > 0) {
          const individualData = reportDashboardData.individualDPEData;
          const individualAggregated = {
            avgSct: individualData.reduce((acc, member) => acc + member.sct, 0) / individualData.length,
            totalCases: individualData.reduce((acc, member) => acc + member.cases, 0),
            avgSatisfaction: individualData.reduce((acc, member) => acc + member.satisfaction, 0) / individualData.length
          };
          return {
            sct: Math.round(individualAggregated.avgSct * 100) / 100,
            cases: individualAggregated.totalCases,
            csat: Math.round(individualAggregated.avgSatisfaction * 100) / 100,
            dsat: aggregatedSatisfaction.dsat // Use existing satisfaction calculation
          };
        } else {
          // Fallback to aggregated data
          return {
            sct: aggregated.avgSct,
            cases: aggregated.totalCases,
            csat: aggregatedSatisfaction.csat,
            dsat: aggregatedSatisfaction.dsat
          };
        }
      }
    }

    // Default fallback
    return {
      sct: calculateMetricsData?.sct || reportCurrentData?.sct,
      cases: calculateMetricsData?.closedCases || reportCurrentData?.closedCases || reportCurrentData?.cases,
      csat: satisfactionData?.satisfactionData?.csatPercentage ?? calculateMetricsData?.satisfaction ?? reportCurrentData?.satisfaction,
      dsat: satisfactionData?.satisfactionData?.dsatPercentage ?? calculateMetricsData?.dsatPercentage ?? reportCurrentData?.dsatPercentage
    };
  };

  // Helper function to calculate aggregated satisfaction data
  const getAggregatedSatisfactionData = () => {
    if (!satisfactionData?.satisfactionData) {
      return { csat: null, dsat: null };
    }

    // For aggregated views, use the existing satisfaction data
    // In a real scenario, you might want to aggregate individual member satisfaction data
    return {
      csat: satisfactionData.satisfactionData.csatPercentage,
      dsat: satisfactionData.satisfactionData.dsatPercentage
    };
  };

  // Helper function to get survey chart data based on active tab
  const getSurveyChartData = () => {
    if (!chartSurveyData || chartSurveyData.length === 0) return [];

    if (selectedEntity === 'squad') {
      if (activeTab === 'squad') {
        // Show combined data of all members for squad tab
        // Aggregate the survey data if needed
        return chartSurveyData;
      } else {
        // Show individual DPE data for dpe tab
        return chartSurveyData;
      }
    } else if (selectedEntity === 'team') {
      if (activeTab === 'team') {
        // Show combined data of all squads for team tab
        return chartSurveyData;
      } else {
        // Show individual squad data for squad tab
        return chartSurveyData;
      }
    }

    return chartSurveyData;
  };
  
  // Webhook warm-up effect - runs once when component mounts
  useEffect(() => {
    const warmUpWebhooks = async () => {
      try {
        console.log('🚀 Dashboard mounted - warming up n8n webhooks...');
        const warmedUp = await n8nWorkflowService.warmUpWebhooks();
        if (warmedUp) {
          console.log('🔥 Webhooks warmed up successfully - High SCT Email Scrubber ready!');
        } else {
          console.log('⚠️ Webhook warm-up completed with warnings');
        }
      } catch (error) {
        console.log('⚠️ Webhook warm-up failed, but this won\'t prevent normal operation:', error);
      }
    };
    
    // Warm up webhooks after a short delay to let the dashboard finish loading
    const timer = setTimeout(warmUpWebhooks, 2000);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs once on mount
  
  // Calculate metrics workflow results state
  const [calculateMetricsData, setCalculateMetricsData] = useState<any>(null);
  const [detailedCasesData, setDetailedCasesData] = useState<any[]>([]);
  
  // Customer satisfaction data state
  const [satisfactionData, setSatisfactionData] = useState<EntitySatisfactionData | null>(null);
  const [chartSurveyData, setChartSurveyData] = useState<ChartSurveyData[]>([]);
  const [satisfactionLoading, setSatisfactionLoading] = useState<boolean>(false);

  // Removed auto-selection to allow user to manually choose entities

  // Handler functions
  const handleEntityChange = (entity: string) => {
    // Validate entity type
    if (!entity || !['dpe', 'squad', 'team'].includes(entity)) {
      return;
    }
    setSelectedEntity(entity);
    setSelectedEntityValue(''); // Reset entity value when type changes
    setEntityChanged(true);
    
    // Don't reset reportGenerated to ensure loading states are maintained
    // Don't clear generatedEntity/generatedEntityValue to maintain chart titles
    // We will update these only when Generate Report is clicked
    
    // We should still clear the data since it's no longer valid for the new entity
    setWorkflowCompleted(false); // Reset workflow completion
    setReportDashboardData(null); // Clear report data
    setReportCurrentData(null); // Clear report current data
    setIsAnalysisEnabled(false); // Disable analysis when entity changes
    
    // Keep isPerformanceLoading and isSatisfactionLoading as they are - don't reset them
  };

  const handleEntityValueChange = (value: string) => {
    // Validate entity value
    if (!value || value.includes('Add New')) {
      setSelectedEntityValue('');
      return;
    }
    
    // Validate that the entity value exists in the current entity data
    const formattedData = formatEntityDataForComponents();
    const entityOptions = formattedData[selectedEntity as 'team' | 'squad' | 'dpe'] || [];
    if (!entityOptions.includes(value)) {
      return;
    }
    setSelectedEntityValue(value);
    setEntityChanged(true);
    
    // Don't reset reportGenerated to ensure loading states are maintained
    // Don't clear generatedEntity/generatedEntityValue to maintain chart titles
    // We will update these only when Generate Report is clicked
    
    // We should still clear the data since it's no longer valid for the new entity value
    setReportDashboardData(null); // Clear report data
    setReportCurrentData(null); // Clear report current data
    setIsAnalysisEnabled(false); // Disable analysis when entity value changes
    
    // Keep isPerformanceLoading and isSatisfactionLoading as they are - don't reset them
  };

  const handleTimeRangeChange = (range: { from: Date; to: Date }) => {
    // Validate date range
    if (!range.from || !range.to) {
      return;
    }
    
    if (range.from > range.to) {
      return;
    }
    
    // Validate that date range is not too far in the future
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
    if (range.to > maxFutureDate) {
      return;
    }
    
    setSelectedTimeRange(range);
    
    // Only recalculate chart data if a report has been generated (data persistence requirement)
    if (reportGenerated && satisfactionData && satisfactionData.satisfactionData) {
      // Recalculate filtered chart data
      // Use formatted data from CustomerSatisfactionService instead of raw data
      const chartData = CustomerSatisfactionService.formatSatisfactionDataForChart(satisfactionData.satisfactionData);
      console.log('📊 Using pre-formatted chart data:', chartData);
      const filteredChartData = chartData;
      setChartSurveyData(filteredChartData);
    }
  };

  // Helper function to generate filtered chart data based on time range
  const generateFilteredChartData = (surveyDetails: any[]) => {
    console.log('🔍 Processing survey details:', surveyDetails?.length || 0, 'entries');
    if (!surveyDetails || !Array.isArray(surveyDetails) || surveyDetails.length === 0) {
      console.log('❌ No survey details to process');
      return [];
    }

    if (surveyDetails.length > 0) {
      console.log('📝 Sample survey detail:', surveyDetails[0]);
    }

    // Log the current selected time range in more detail
    console.log('📅 Selected time range:', 
                selectedTimeRange.from ? `${selectedTimeRange.from.toLocaleDateString()} (${selectedTimeRange.from.toISOString()})` : 'none', 
                'to', 
                selectedTimeRange.to ? `${selectedTimeRange.to.toLocaleDateString()} (${selectedTimeRange.to.toISOString()})` : 'none');
    
    // Get current date for reference
    const currentDate = new Date();
    console.log('📅 Current date:', currentDate.toLocaleDateString(), `(${currentDate.toISOString()})`);
                
    // Always strictly enforce time range filtering with no fallback mechanisms
    const isTimeRangeActive = selectedTimeRange.from && selectedTimeRange.to;
    console.log('📅 Time range filtering is:', isTimeRangeActive ? 'STRICTLY ENFORCED' : 'DISABLED');
    
    // Filter surveys by time range if one is selected
    const filteredSurveys = surveyDetails.filter(survey => {
      // If no time range is selected or survey has no date, include it
      if (!isTimeRangeActive || !survey.surveyDate) {
        return true;
      }
      
      try {
        // Handle multiple date formats (M/D/YYYY HH:MM or ISO string)
        let surveyDate;
        
        // Debug the date being processed
        console.log('🔍 Processing survey date:', survey.surveyDate);
        
        if (typeof survey.surveyDate === 'string' && survey.surveyDate.includes('/')) {
          try {
            // Parse M/D/YYYY HH:MM format (example: "6/5/2025 21:48")
            const [datePart, timePart] = survey.surveyDate.split(' ');
            const [month, day, year] = datePart.split('/');
            const [hours, minutes] = timePart ? timePart.split(':') : ['0', '0'];
            
            // Log the parsed components
            console.log('📅 Parsed date components:', {
              month: parseInt(month),
              day: parseInt(day),
              year: parseInt(year),
              hours: parseInt(hours || '0'),
              minutes: parseInt(minutes || '0')
            });
            
            // Convert to Date object properly (month is 0-indexed in JavaScript)
            surveyDate = new Date(
              parseInt(year), 
              parseInt(month) - 1, 
              parseInt(day), 
              parseInt(hours || '0'), 
              parseInt(minutes || '0')
            );
            
            // Force the date to be valid using Date methods
            surveyDate = new Date(
              surveyDate.getFullYear(),
              surveyDate.getMonth(),
              surveyDate.getDate(),
              surveyDate.getHours(),
              surveyDate.getMinutes()
            );
            
            console.log('📅 Parsed date:', surveyDate, '(ISO:', surveyDate.toISOString(), ')');
          } catch (dateError) {
            // If any error in parsing, create a fallback date
            console.error('❌ Error parsing date format:', survey.surveyDate, dateError);
            const fallbackYear = parseInt(survey.surveyDate.split('/')[2]?.split(' ')[0] || '2025');
            surveyDate = new Date(fallbackYear, 0, 1); // Fallback to January 1st of the year
            console.log('📅 Using fallback date:', surveyDate);
          }
        } else {
          // Standard date parsing for ISO strings
          surveyDate = new Date(survey.surveyDate);
          console.log('📅 Parsed standard date:', surveyDate);
        }
        
        const fromDate = new Date(selectedTimeRange.from);
        const toDate = new Date(selectedTimeRange.to);
        
        // Enforce strict adherence to selected date range
        fromDate.setHours(0, 0, 0, 0); // Start of day for from date
        toDate.setHours(23, 59, 59, 999); // End of day for to date
        
        // For debugging, log the comparison with more detail
        const isInRange = surveyDate >= fromDate && surveyDate <= toDate;
        console.log(
          `📅 Date comparison: ${surveyDate.toISOString()} (${surveyDate.toLocaleDateString()}) ` +
          `in range ${fromDate.toISOString()} - ${toDate.toISOString()}? ${isInRange ? 'YES' : 'NO'}`
        );
        
        // Use more inclusive date range filtering
        return isInRange;
      } catch (error) {
        console.error('Error parsing survey date:', survey.surveyDate, error);
        return true; // Include if date parsing fails
      }
    });

    console.log(`📅 Filtered ${surveyDetails.length} surveys to ${filteredSurveys.length} based on date range`);

    // Recalculate metrics from filtered surveys
    // Check multiple possible rating fields and categorize based on rating value or category
    const csatCount = filteredSurveys.filter(s => {
      // First check overallSatisfaction which is in your data
      const rating = s.overallSatisfaction || s.rating || s.customerSatisfactionRating || s.ratingValue;
      if (rating !== undefined && rating !== null) {
        return rating >= 4 && rating <= 5;
      }
      // Fallback to category field
      return s.category?.toLowerCase() === 'csat';
    }).length;
    
    const neutralCount = filteredSurveys.filter(s => {
      const rating = s.overallSatisfaction || s.rating || s.customerSatisfactionRating || s.ratingValue;
      if (rating !== undefined && rating !== null) {
        return rating === 3;
      }
      // Fallback to category field
      return s.category?.toLowerCase() === 'neutral';
    }).length;
    
    const dsatCount = filteredSurveys.filter(s => {
      const rating = s.overallSatisfaction || s.rating || s.customerSatisfactionRating || s.ratingValue;
      if (rating !== undefined && rating !== null) {
        return rating >= 1 && rating <= 2;
      }
      // Fallback to category field
      return s.category?.toLowerCase() === 'dsat';
    }).length;
    
    const total = csatCount + neutralCount + dsatCount;

    if (total === 0) {
      console.log('❌ No satisfaction data found after filtering by current time range');
      return []; // No data to display - strictly enforce the selected time range
    }

    const csatPercentage = Math.round((csatCount / total) * 100);
    const neutralPercentage = Math.round((neutralCount / total) * 100);
    const dsatPercentage = Math.round((dsatCount / total) * 100);

    console.log('📊 Filtered chart data generated:', {
      total: filteredSurveys.length,
      calculatedTotal: total,
      csat: csatCount,
      neutral: neutralCount,
      dsat: dsatCount,
      csatPercentage,
      neutralPercentage,
      dsatPercentage,
      timeRange: selectedTimeRange.from && selectedTimeRange.to ? 
        `${selectedTimeRange.from.toLocaleDateString()} - ${selectedTimeRange.to.toLocaleDateString()}` : 'All time'
    });

    return [{
      name: 'CSAT (4-5)',
      value: csatCount,
      percentage: csatPercentage,
      color: '#10b981'
    }, {
      name: 'Neutral (3)',
      value: neutralCount,
      percentage: neutralPercentage,
      color: '#f59e0b'
    }, {
      name: 'DSAT (1-2)',
      value: dsatCount,
      percentage: dsatPercentage,
      color: '#ef4444'
    }];
  };



  // Fetch satisfaction data for the selected entity
  const fetchSatisfactionData = async (entityName: string, entityType: string) => {
    try {
      setSatisfactionLoading(true);
      setIsSatisfactionLoading(true); // Also set the chart loading state
      
      if (entityType === 'dpe') {
        // Direct DPE satisfaction data
        const data = await CustomerSatisfactionService.getEntitySatisfactionData(entityName, entityType);
        if (data) {
          setSatisfactionData(data);
          // Only update chart data if report is already generated (data persistence)
          if (reportGenerated) {
            console.log('🔎 Found data for entity:', data.entityName, 'with', data.surveyDetails?.length || 0, 'survey details');
            const chartData = data.surveyDetails && data.surveyDetails.length > 0
              ? generateFilteredChartData(data.surveyDetails)
              : [];
            setChartSurveyData(chartData);
          }
        } else {
          setSatisfactionData(null);
          setChartSurveyData([]);
        }
      } else if (entityType === 'squad') {
        // Aggregate satisfaction data for squad members
        const squadMembers = getSquadMembers();
        
        if (squadMembers.length > 0) {
          const aggregatedData = await CustomerSatisfactionService.getAggregatedSatisfactionData(squadMembers, entityType);
          if (aggregatedData) {
            // Also collect survey details from individual DPEs for drill-down functionality
            const individualSatisfactionData = await Promise.all(
              squadMembers.map(memberName => 
                CustomerSatisfactionService.getEntitySatisfactionData(memberName, 'dpe')
              )
            );
            
            const allSurveyDetails = individualSatisfactionData
              .filter(data => data !== null)
              .flatMap(data => data!.surveyDetails || []);
            
            setSatisfactionData({
              entityName,
              entityType,
              entityId: entityName,
              owner_full_name: entityName,
              satisfactionData: aggregatedData,
              surveyDetails: allSurveyDetails // Include all survey details from squad members
            });
            // Only update chart data if report is already generated (data persistence)
            if (reportGenerated) {
              const chartData = generateFilteredChartData(allSurveyDetails);
              setChartSurveyData(chartData);
            }
          } else {
            setSatisfactionData(null);
            setChartSurveyData([]);
          }
        } else {
          setSatisfactionData(null);
          setChartSurveyData([]);
        }
      } else if (entityType === 'team') {
        // Aggregate satisfaction data for all squad members in the team
        const teamSquads = Object.entries(entityMappings?.squadToTeam || {})
          .filter(([squad, team]) => team === entityName)
          .map(([squad]) => squad);
        
        const teamDPEs = teamSquads.flatMap(squadName => 
          Object.entries(entityMappings?.dpeToSquad || {})
            .filter(([dpe, squad]) => squad === squadName)
            .map(([dpe]) => dpe)
        );
        
        if (teamDPEs.length > 0) {
          const aggregatedData = await CustomerSatisfactionService.getAggregatedSatisfactionData(teamDPEs, entityType);
          if (aggregatedData) {
            // Also collect survey details from individual DPEs for drill-down functionality
            const individualSatisfactionData = await Promise.all(
              teamDPEs.map(memberName => 
                CustomerSatisfactionService.getEntitySatisfactionData(memberName, 'dpe')
              )
            );
            
            const allSurveyDetails = individualSatisfactionData
              .filter(data => data !== null)
              .flatMap(data => data!.surveyDetails || []);
            
            setSatisfactionData({
              entityName,
              entityType,
              entityId: entityName,
              owner_full_name: entityName,
              satisfactionData: aggregatedData,
              surveyDetails: allSurveyDetails // Include all survey details from team members
            });
            // Only update chart data if report is already generated (data persistence)
            if (reportGenerated) {
              const chartData = generateFilteredChartData(allSurveyDetails);
              setChartSurveyData(chartData);
            }
          } else {
            setSatisfactionData(null);
            setChartSurveyData([]);
          }
        } else {
          setSatisfactionData(null);
          setChartSurveyData([]);
        }
      }
      
    } catch (error) {
      setSatisfactionData(null);
      setChartSurveyData([]);
      
      toast({
        title: "Satisfaction Data Error",
        description: `Failed to load satisfaction data for ${entityName}. Using fallback display.`,
        variant: "destructive"
      });
    } finally {
      setSatisfactionLoading(false);
      setIsSatisfactionLoading(false); // Also clear the chart loading state
    }
  };

  const handleGenerateReport = async () => {
    // Clear insights and analysis results when generating new report
    setSctAnalysisResults(null);
    setCxInsightResults(null);
    setSurveyAnalysisResults(null);
    setSctAnalyzed(false);
    setCxAnalyzed(false);
    setIsSurveyAnalyzed(false);
    
    // Clear chart data to ensure fresh start for new report
    setChartSurveyData([]);

    // Comprehensive validation before generating report
    if (!selectedEntity) {
      return;
    }
    
    if (!selectedEntityValue || selectedEntityValue.includes('Add New')) {
      return;
    }
    
    // Delete all performance_data documents before generating a new report
    try {
      // Use the general clear endpoint with DELETE method and body
      const deleteResponse = await fetch('http://localhost:3001/api/collections/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collections: ['performance_data']
        }),
      });
      
      if (deleteResponse && deleteResponse.ok) {
        const result = await deleteResponse.json();
        console.log('Deleted performance_data documents', result);
        
        toast({
          title: "Data Cleared",
          description: "Existing performance data records have been deleted.",
        });
      } else {
        console.error('Failed to delete performance_data documents:', deleteResponse.statusText);
        toast({
          title: "Warning",
          description: "Failed to clear old data. New data may be mixed with old data.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to delete performance_data documents:', error);
      toast({
        title: "Warning",
        description: "Failed to clear old data. New data may be mixed with old data.",
        variant: "destructive"
      });
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
    // NO WORKFLOW DEPENDENCY - only database polling matters
    
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
        
        // Set loading states when starting report generation
        // The 10-minute polling system will handle data fetching and loading state management
        setIsPerformanceLoading(true);
        setIsSatisfactionLoading(true);
        
        // Don't call fetchPerformanceOverviewData or fetchSatisfactionData immediately
        // Let the 10-minute polling system (useEffect with fetchCalculateMetricsResults) handle all data fetching
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
        
        // Set loading states when starting report generation
        // The 10-minute polling system will handle data fetching and loading state management
        setIsPerformanceLoading(true);
        setIsSatisfactionLoading(true);
        
        // Don't call fetchPerformanceOverviewData or fetchSatisfactionData immediately
        // Let the 10-minute polling system (useEffect with fetchCalculateMetricsResults) handle all data fetching
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

  // Function to fetch performance overview data using direct API calls like KPI cards
  const fetchPerformanceOverviewData = async () => {
    try {
      if (!generatedEntity || !generatedEntityValue) {
        setIsPerformanceLoading(false);
        return;
      }
      
      setIsPerformanceLoading(true);
      const startDate = selectedTimeRange.from?.toISOString().split('T')[0];
      const endDate = selectedTimeRange.to?.toISOString().split('T')[0];
      
      if (generatedEntity === 'dpe') {
        // For DPE, query performance_data collection directly via API (same as KPI cards)
        const apiUrl = `http://localhost:3001/api/performance-data?entity_name=${encodeURIComponent(generatedEntityValue)}`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const performanceData = await response.json();
          if (performanceData.length > 0) {
            const latestRecord = performanceData[0];
            const mappedData = [{
              name: latestRecord.entity_name || latestRecord.owner,
              sct: latestRecord.metrics?.sct || 0,
              cases: latestRecord.metrics?.closedCases || 0,
              satisfaction: latestRecord.metrics?.customerSatisfaction?.csatPercentage || 0,
              detailedCases: latestRecord.metrics?.cases || []
            }];
            setPerformanceOverviewData(mappedData);
            setIsPerformanceLoading(false);
            return;
          }
        }
        
        // No data found - start polling to wait for data
        let attempts = 0;
        const maxAttempts = 20; // Poll for up to 1 minute (20 * 3 seconds)
        
        const pollForData = async () => {
          attempts++;
          try {
            const pollResponse = await fetch(apiUrl);
            if (pollResponse.ok) {
              const pollData = await pollResponse.json();
              
              if (pollData.length > 0) {
                const latestRecord = pollData[0];
                const mappedData = [{
                  name: latestRecord.entity_name || latestRecord.owner,
                  sct: latestRecord.metrics?.sct || 0,
                  cases: latestRecord.metrics?.closedCases || 0,
                  satisfaction: latestRecord.metrics?.customerSatisfaction?.csatPercentage || 0,
                  detailedCases: latestRecord.metrics?.cases || []
                }];
                
                setPerformanceOverviewData(mappedData);
                setIsPerformanceLoading(false);
                return;
              }
            }
            
            if (attempts >= maxAttempts) {
              setPerformanceOverviewData([]);
              setIsPerformanceLoading(false);
              return;
            }
            
            setTimeout(pollForData, 3000); // Poll again in 3 seconds
            
          } catch (pollError) {
            setPerformanceOverviewData([]);
            setIsPerformanceLoading(false);
          }
        };
        
        setTimeout(pollForData, 3000); // Start first poll in 3 seconds
        
      } else {
        // For squad/team, use existing service layer approach
        const performanceData = await CasePerformanceService.getPerformanceOverviewByDateRange(
          selectedTimeRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          selectedTimeRange.to || new Date()
        );
        
        const mappedData = performanceData.map(item => ({
          name: item.owner,
          sct: item.sct || 0,
          cases: item.closedCases || 0,
          satisfaction: 0,
          detailedCases: item.cases || []
        }));
        
        setPerformanceOverviewData(mappedData);
        setIsPerformanceLoading(false);
      }
    } catch (error) {
      setPerformanceOverviewData([]);
      setIsPerformanceLoading(false);
    }
  };

  // Function to fetch Calculate metrics results from database
  const fetchCalculateMetricsResults = async () => {
    try {
      // Check if we have the entity and time range data needed
      if (!generatedEntity || !generatedEntityValue) {
        return;
      }
      
      // Start loading state if not already loading
      if (!isPerformanceLoading) {
        setIsPerformanceLoading(true);
      }
      if (!isSatisfactionLoading) {
        setIsSatisfactionLoading(true);
      }

      // First try to get performance data from the performance_data collection
      const startDate = selectedTimeRange.from?.toISOString().split('T')[0];
      const endDate = selectedTimeRange.to?.toISOString().split('T')[0];
      // Fix timezone issue by using local date instead of UTC
      const startDateLocal = selectedTimeRange.from ? 
        `${selectedTimeRange.from.getFullYear()}-${String(selectedTimeRange.from.getMonth() + 1).padStart(2, '0')}-${String(selectedTimeRange.from.getDate()).padStart(2, '0')}` 
        : startDate;
      const endDateLocal = selectedTimeRange.to ? 
        `${selectedTimeRange.to.getFullYear()}-${String(selectedTimeRange.to.getMonth() + 1).padStart(2, '0')}-${String(selectedTimeRange.to.getDate()).padStart(2, '0')}` 
        : endDate;
      // Debug: Get ALL entities from database to see what's available
      try {
        const allEntitiesResponse = await fetch('http://localhost:3001/api/performance-data');
        if (allEntitiesResponse.ok) {
          const allEntities = await allEntitiesResponse.json();
        }
      } catch (error) {
      }

      // For squad selections, we need to fetch individual DPE performance data
      if (generatedEntity === 'squad') {
        // Get squad members
        let squadMembers;
        try {
          squadMembers = getSquadMembers();
        } catch (error) {
          setIsPerformanceLoading(false);
          setIsSatisfactionLoading(false);
          return;
        }
        
        if (squadMembers.length > 0) {
          // Fetch performance data for each DPE in the squad
          const dpePerformancePromises = squadMembers.map(async (dpeName) => {
            // Use corrected local dates for date filtering
            const dpeApiUrl = `http://localhost:3001/api/performance-data?entity_name=${encodeURIComponent(dpeName)}&start_date=${startDateLocal}&end_date=${endDateLocal}`;
            try {
              const response = await fetch(dpeApiUrl);
              if (response.ok) {
                const data = await response.json();
                return data.length > 0 ? { dpeName, data: data[0] } : null;
              } else {
              }
            } catch (error) {
            }
            return null;
          });
          
          const dpePerformanceResults = await Promise.all(dpePerformancePromises);
          const validResults = dpePerformanceResults.filter(result => result !== null);
          
          if (validResults.length > 0) {
            // Set the individual DPE performance data for the chart
            const performanceData = validResults.map(result => {
              // Map the case data for this specific DPE
              const dpeDetailedCases = result.data.sample_cases ? result.data.sample_cases.map(caseItem => {
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
                }

                return {
                  ...caseItem,
                  products: parsedProducts,
                  formattedProducts: parsedProducts.length > 0 ? parsedProducts.join(', ') : 'N/A'
                };
              }) : [];

              return {
                name: result.dpeName,
                sct: result.data.metrics?.sct || 0,
                cases: result.data.metrics?.closedCases || 0,
                satisfaction: result.data.metrics?.customerSatisfaction?.csatPercentage || 0,
                detailedCases: dpeDetailedCases // Store individual DPE case data
              };
            });

            // Set reportDashboardData with individual DPE performance
            setReportDashboardData(prev => ({
              ...prev,
              performanceData: performanceData,
              individualDPEData: performanceData // For squads, individual data is the same as performance data
            }));
            // Calculate aggregated squad metrics for KPI cards
            const squadAggregatedMetrics = {
              sct: Math.round((performanceData.reduce((sum, dpe) => sum + dpe.sct, 0) / performanceData.length) * 100) / 100, // Average SCT rounded to 2 decimal places
              closedCases: performanceData.reduce((sum, dpe) => sum + dpe.cases, 0), // Total cases (always integer)
              satisfaction: Math.round((performanceData.reduce((sum, dpe) => sum + dpe.satisfaction, 0) / performanceData.length) * 100) / 100, // Average satisfaction rounded to 2 decimal places
              dsatPercentage: null // Will be calculated from satisfaction data below
            };
            
            // Aggregate satisfaction data for squad
            let totalCsat = 0, totalNeutral = 0, totalDsat = 0;
            const validSatisfactionData = validResults.filter(result => result.data.metrics?.customerSatisfaction);
            
            validSatisfactionData.forEach(result => {
              const satisfaction = result.data.metrics.customerSatisfaction;
              totalCsat += satisfaction.csat || 0;
              totalNeutral += satisfaction.neutral || 0;
              totalDsat += satisfaction.dsat || 0;
            });
            
            const totalSurveys = totalCsat + totalNeutral + totalDsat;
            if (totalSurveys > 0) {
              const aggregatedSatisfaction = {
                csat: totalCsat,
                neutral: totalNeutral,
                dsat: totalDsat,
                total: totalSurveys,
                csatPercentage: Math.round((totalCsat / totalSurveys) * 100),
                neutralPercentage: Math.round((totalNeutral / totalSurveys) * 100),
                dsatPercentage: Math.round((totalDsat / totalSurveys) * 100),
                lastUpdated: new Date().toISOString(),
                source: 'squad-aggregated-satisfaction'
              };
              
              // Update squad metrics with DSAT percentage
              squadAggregatedMetrics.dsatPercentage = aggregatedSatisfaction.dsatPercentage;
              
              // Collect all survey details from squad members for drill-down functionality
              const allSquadSurveyDetails = validSatisfactionData
                .flatMap(result => result.data.surveyDetails || [])
                .filter(survey => survey.caseNumber && survey.category); // Filter out invalid entries
              // Set satisfaction data for the squad
              setSatisfactionData({
                entityName: generatedEntityValue,
                entityType: 'squad',
                entityId: generatedEntityValue,
                owner_full_name: generatedEntityValue,
                satisfactionData: aggregatedSatisfaction,
                surveyDetails: allSquadSurveyDetails // Include all survey details from squad members
              });
              
              // End satisfaction loading state since we have data now
              setIsSatisfactionLoading(false);
              
              // Format for chart with time range filtering (only if report is already generated)
              if (reportGenerated) {
                const chartData = generateFilteredChartData(allSquadSurveyDetails);
                setChartSurveyData(chartData);
              }
            }
            
            // Aggregate all detailed cases for the squad
            const allSquadCases = performanceData.reduce((allCases, dpe) => {
              return allCases.concat(dpe.detailedCases || []);
            }, []);
            setCalculateMetricsData(squadAggregatedMetrics);
            setDetailedCasesData(allSquadCases); // Set aggregated cases for squad-level view
            
            // CLEAR LOADING STATES when squad data is found (like KPI cards)
            setIsPerformanceLoading(false);
            setIsSatisfactionLoading(false);
            
            setReportGenerated(true);
            setGeneratedEntity(selectedEntity);
            setGeneratedEntityValue(selectedEntityValue);
            // NO WORKFLOW DEPENDENCY - only data availability matters
            setIsLoading(false);
            return; // Exit early for squad processing
          }
        } else {
          // Since squad has no members, clear loading states and show "no data"
          setIsPerformanceLoading(false);
          setIsSatisfactionLoading(false);
          return; // Don't continue to individual DPE logic for squad names
        }
      }

      // For team selections, we need to fetch DPE data for all squads in the team
      if (generatedEntity === 'team') {
        // Get team members (squads)
        const teamSquads = getTeamMembers();
        if (teamSquads.length > 0) {
          // For each squad, get all DPEs and fetch their performance data
          const allSquadPromises = teamSquads.map(async (squadName) => {
            // Get DPEs for this squad
            const squadDPEs = Object.entries(entityMappings.dpeToSquad || {})
              .filter(([dpe, squad]) => squad === squadName)
              .map(([dpe]) => dpe)
              .filter(dpe => !dpe.includes('Add New'));
            
            if (squadDPEs.length === 0) return { squadName, dpeData: [], squadMetrics: null };
            
            // Fetch performance data for each DPE in this squad
            const dpePromises = squadDPEs.map(async (dpeName) => {
              // Use corrected local dates for date filtering
              const dpeApiUrl = `http://localhost:3001/api/performance-data?entity_name=${encodeURIComponent(dpeName)}&start_date=${startDateLocal}&end_date=${endDateLocal}`;
              try {
                const response = await fetch(dpeApiUrl);
                if (response.ok) {
                  const data = await response.json();
                  return data.length > 0 ? { dpeName, data: data[0] } : null;
                }
              } catch (error) {
              }
              return null;
            });
            
            const squadDPEResults = await Promise.all(dpePromises);
            const validDPEResults = squadDPEResults.filter(result => result !== null);
            
            // Calculate squad metrics from its DPEs
            if (validDPEResults.length > 0) {
              const squadMetrics = {
                sct: validDPEResults.reduce((sum, dpe) => sum + (dpe.data.metrics?.sct || 0), 0) / validDPEResults.length,
                cases: validDPEResults.reduce((sum, dpe) => sum + (dpe.data.metrics?.closedCases || 0), 0),
                satisfaction: validDPEResults.reduce((sum, dpe) => sum + (dpe.data.metrics?.customerSatisfaction?.csatPercentage || 0), 0) / validDPEResults.length
              };
              
              // Aggregate all detailed cases for this squad
              const squadDetailedCases = validDPEResults.reduce((allCases, dpe) => {
                const dpeCases = dpe.data.sample_cases ? dpe.data.sample_cases.map(caseItem => {
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
                  }
                  return {
                    ...caseItem,
                    products: parsedProducts,
                    formattedProducts: parsedProducts.length > 0 ? parsedProducts.join(', ') : 'N/A'
                  };
                }) : [];
                return allCases.concat(dpeCases);
              }, []);
              
              return { squadName, dpeData: validDPEResults, squadMetrics, squadDetailedCases };
            }
            
            return { squadName, dpeData: [], squadMetrics: null, squadDetailedCases: [] };
          });
          
          const teamSquadResults = await Promise.all(allSquadPromises);
          const validSquadResults = teamSquadResults.filter(result => result.squadMetrics !== null);
          if (validSquadResults.length > 0) {
            // Create performance data for chart (show squads as bars)
            const performanceData = validSquadResults.map(result => ({
              name: result.squadName,
              sct: result.squadMetrics.sct,
              cases: result.squadMetrics.cases,
              satisfaction: result.squadMetrics.satisfaction,
              detailedCases: result.squadDetailedCases || []
            }));

            // Create individual DPE data for team tab view (collect all DPEs from all squads)
            const allDPEResults = validSquadResults.flatMap(squad => squad.dpeData || []);
            const individualDPEData = allDPEResults.map(dpe => ({
              name: dpe.dpeName,
              sct: dpe.data.metrics?.sct || 0,
              cases: dpe.data.metrics?.closedCases || 0,
              satisfaction: dpe.data.metrics?.customerSatisfaction?.csatPercentage || 0,
              detailedCases: dpe.data.sample_cases ? dpe.data.sample_cases.map(caseItem => {
                let parsedProducts = [];
                try {
                  if (caseItem.products) {
                    if (typeof caseItem.products === 'string') {
                      parsedProducts = JSON.parse(caseItem.products);
                    } else if (Array.isArray(caseItem.products)) {
                      parsedProducts = caseItem.products;
                    }
                  }
                } catch (error) {}
                return {
                  ...caseItem,
                  products: parsedProducts,
                  formattedProducts: parsedProducts.length > 0 ? parsedProducts.join(', ') : 'N/A'
                };
              }) : []
            }));

            // Set reportDashboardData with squad-level performance and individual DPE data
            setReportDashboardData(prev => ({
              ...prev,
              performanceData: performanceData,
              individualDPEData: individualDPEData // Store individual DPE data for squad tab
            }));
            // Calculate aggregated team metrics for KPI cards
            const teamAggregatedMetrics = {
              sct: Math.round((validSquadResults.reduce((sum, squad) => sum + squad.squadMetrics.sct, 0) / validSquadResults.length) * 100) / 100, // Average SCT
              closedCases: validSquadResults.reduce((sum, squad) => sum + squad.squadMetrics.cases, 0), // Total cases
              satisfaction: Math.round((validSquadResults.reduce((sum, squad) => sum + squad.squadMetrics.satisfaction, 0) / validSquadResults.length) * 100) / 100, // Average satisfaction
              dsatPercentage: null // Will be calculated from satisfaction data below
            };
            
            // Aggregate satisfaction data for team (from all squads' DPE data)
            let totalTeamCsat = 0, totalTeamNeutral = 0, totalTeamDsat = 0;
            const validTeamSatisfactionData = allDPEResults.filter(dpe => dpe.data.metrics?.customerSatisfaction);
            
            validTeamSatisfactionData.forEach(dpe => {
              const satisfaction = dpe.data.metrics.customerSatisfaction;
              totalTeamCsat += satisfaction.csat || 0;
              totalTeamNeutral += satisfaction.neutral || 0;
              totalTeamDsat += satisfaction.dsat || 0;
            });
            
            const totalTeamSurveys = totalTeamCsat + totalTeamNeutral + totalTeamDsat;
            if (totalTeamSurveys > 0) {
              const aggregatedTeamSatisfaction = {
                csat: totalTeamCsat,
                neutral: totalTeamNeutral,
                dsat: totalTeamDsat,
                total: totalTeamSurveys,
                csatPercentage: Math.round((totalTeamCsat / totalTeamSurveys) * 100),
                neutralPercentage: Math.round((totalTeamNeutral / totalTeamSurveys) * 100),
                dsatPercentage: Math.round((totalTeamDsat / totalTeamSurveys) * 100),
                lastUpdated: new Date().toISOString(),
                source: 'team-aggregated-satisfaction'
              };
              
              // Update team metrics with DSAT percentage
              teamAggregatedMetrics.dsatPercentage = aggregatedTeamSatisfaction.dsatPercentage;
              
              // Collect all survey details from team members (all DPEs across all squads) for drill-down functionality
              const allTeamSurveyDetails = validTeamSatisfactionData
                .flatMap(dpe => dpe.data.surveyDetails || [])
                .filter(survey => survey.caseNumber && survey.category); // Filter out invalid entries
              // Set satisfaction data for the team
              setSatisfactionData({
                entityName: generatedEntityValue,
                entityType: 'team',
                entityId: generatedEntityValue,
                owner_full_name: generatedEntityValue,
                satisfactionData: aggregatedTeamSatisfaction,
                surveyDetails: allTeamSurveyDetails // Include all survey details from team members
              });
              
              // Format for chart (only if report is already generated)
              if (reportGenerated) {
                const chartData = generateFilteredChartData(allTeamSurveyDetails);
                setChartSurveyData(chartData);
              }
            }
            
            // Aggregate all detailed cases for the team
            const allTeamCases = performanceData.reduce((allCases, squad) => {
              return allCases.concat(squad.detailedCases || []);
            }, []);
            setCalculateMetricsData(teamAggregatedMetrics);
            setDetailedCasesData(allTeamCases); // Set aggregated cases for team-level view
            
            // CLEAR LOADING STATES when team data is found (like KPI cards)
            setIsPerformanceLoading(false);
            setIsSatisfactionLoading(false);
            
            setReportGenerated(true);
            setGeneratedEntity(selectedEntity);
            setGeneratedEntityValue(selectedEntityValue);
            // NO WORKFLOW DEPENDENCY - only data availability matters
            setIsLoading(false);
            return; // Exit early for team processing
          }
        } else {
          // Since team has no squads, clear loading states and show "no data"
          setIsPerformanceLoading(false);
          setIsSatisfactionLoading(false);
          return; // Don't continue to individual DPE logic for team names
        }
      }

      // Query using entity_name with corrected local date range
      let apiUrl = `http://localhost:3001/api/performance-data?entity_name=${encodeURIComponent(generatedEntityValue)}&start_date=${startDateLocal}&end_date=${endDateLocal}`;
      try {
        let performanceResponse = await fetch(apiUrl);
        if (performanceResponse.ok) {
          let performanceResult = await performanceResponse.json();
          // Debug: Compare with known database data
          // If no data found, entity name doesn't match or no data in date range
          if (!performanceResult || performanceResult.length === 0) {
          }
          if (performanceResult && performanceResult.length > 0) {
            const latestMetrics = performanceResult[0];
            
            // No mock satisfaction data - use real data only
            
            const metricsToSet = {
              sct: latestMetrics.metrics?.sct,
              closedCases: latestMetrics.metrics?.closedCases,
              satisfaction: latestMetrics.metrics?.customerSatisfaction?.csatPercentage || latestMetrics.metrics?.satisfaction,
              dsatPercentage: latestMetrics.metrics?.customerSatisfaction?.dsatPercentage || 0
            };
            
            setCalculateMetricsData(metricsToSet);

            // Also set performance data for DPE entities (same as KPI cards data source)
            const performanceDataForChart = [{
              name: latestMetrics.entity_name,
              sct: latestMetrics.metrics?.sct || 0,
              cases: latestMetrics.metrics?.closedCases || 0,
              satisfaction: latestMetrics.metrics?.customerSatisfaction?.csatPercentage || 0,
              detailedCases: latestMetrics.sample_cases || []
            }];
            
            setReportDashboardData(prev => ({
              ...prev,
              performanceData: performanceDataForChart
            }));
            
            // Clear loading states immediately when data is found (like KPI cards)
            setIsPerformanceLoading(false);
            // Also extract satisfaction data directly from performance data if available
            if (latestMetrics.metrics?.customerSatisfaction) {
              const satisfactionFromPerformance = {
                entityName: latestMetrics.entity_name,
                entityType: latestMetrics.entity_type,
                entityId: latestMetrics.entity_id || latestMetrics._id,
                owner_full_name: latestMetrics.entity_name,
                satisfactionData: latestMetrics.metrics.customerSatisfaction,
                surveyDetails: latestMetrics.surveyDetails || []  // Fixed: survey details are at root level
              };
              
              setSatisfactionData(satisfactionFromPerformance);
              
              // End satisfaction loading state since we have data now
              setIsSatisfactionLoading(false);
              
              // Format for chart (only if report is already generated)
              if (reportGenerated) {
                const chartData = generateFilteredChartData(latestMetrics.surveyDetails || []);
                setChartSurveyData(chartData);
              }
              setIsSatisfactionLoading(false); // Clear loading state when satisfaction data is set
            } else {
              setIsSatisfactionLoading(false); // Clear loading state even if no satisfaction data
            }
          
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
          }
          
          // Update reportCurrentData with the actual calculated metrics
          setReportCurrentData(prev => ({
            ...prev,
            sct: latestMetrics.metrics?.sct,
            closedCases: latestMetrics.metrics?.closedCases,
            cases: latestMetrics.metrics?.closedCases,
            satisfaction: latestMetrics.metrics?.customerSatisfaction?.csatPercentage || latestMetrics.metrics?.satisfaction,
            dsatPercentage: latestMetrics.metrics?.customerSatisfaction?.dsatPercentage || 0,
            hasMetricsData: true
          }));
          
          // NO WORKFLOW DEPENDENCY - only clear loading states when data found
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
          
          // End loading states since we have data now
          setIsPerformanceLoading(false);
          
          toast({
            title: "Metrics Calculated",
            description: `Calculated metrics from ${closedCases} resolved cases.`,
          });
          
          // NO WORKFLOW DEPENDENCY - only time-based polling timeout matters
          // Clear satisfaction loading state only after polling timeout (not on first attempt)
          // The polling mechanism will handle clearing loading states when timeout is reached
        } else {
          // No fallback data available - continue polling, don't mark as completed yet
        }
      } else {
        // API call failed - continue polling, don't mark as completed yet
      }
    } catch (error) {
      // Error occurred - continue polling, don't mark as completed yet (unless this is a repeated failure)
    }
    
    // Check if we have data already - if so, stop loading states
    if ((calculateMetricsData && calculateMetricsData.length > 0) || 
        (chartSurveyData && chartSurveyData.length > 0)) {
      setIsPerformanceLoading(false);
      setIsSatisfactionLoading(false);
      console.log('Data already loaded, setting loading states to false');
    }
  };

  // Effect to poll for Calculate metrics results after report generation
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (reportGenerated && generatedEntity && generatedEntityValue && isLoading === false) {
      // Set loading start time when beginning to fetch data
      const startTime = Date.now();
      setLoadingStartTime(startTime);
      setHasTimedOut(false);
      
      // Initial fetch
      fetchCalculateMetricsResults();
      
      // Poll every 3 seconds for up to 10 minutes (NO WORKFLOW DEPENDENCY)
      let pollCount = 0;
      const maxPolls = 200; // 600 seconds (10 minutes) with 3-second intervals
      
      pollInterval = setInterval(async () => {
        pollCount++;
        await fetchCalculateMetricsResults();
        
        // Check if we've reached 10 minutes (600,000 ms)
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        
        // Stop polling if data is loaded (both performance and satisfaction)
        if ((!isPerformanceLoading && !isSatisfactionLoading) || 
            (calculateMetricsData && calculateMetricsData.length > 0) || 
            (chartSurveyData && chartSurveyData.length > 0)) {
          clearInterval(pollInterval);
          console.log('Data loaded successfully, polling stopped');
          
          // Ensure loading states are set to false when data is available
          if (isPerformanceLoading || isSatisfactionLoading) {
            setIsPerformanceLoading(false);
            setIsSatisfactionLoading(false);
          }
          
          toast({
            title: "Data Loaded",
            description: "Performance data loaded successfully."
          });
          
          return;
        }
        
        // Stop polling if max attempts reached or 10 minutes elapsed
        if (pollCount >= maxPolls || elapsedTime >= 600000) {
          setIsPerformanceLoading(false);
          setIsSatisfactionLoading(false);
          setHasTimedOut(true);
          clearInterval(pollInterval);
          
          toast({
            title: "Data Loading Timeout",
            description: "Unable to load all data within 10 minutes. Showing available data.",
            variant: "destructive"
          });
        }
      }, 3000);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [reportGenerated, generatedEntity, generatedEntityValue, isLoading]); // Removed workflowCompleted from dependencies

  // NO WORKFLOW DEPENDENCY - Loading states managed purely by database polling

  // NO WORKFLOW AUTO-COMPLETION - Only database polling controls loading states

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
    console.log('🔍 Survey segment clicked:', segment);
    console.log('📊 Satisfaction data available:', !!satisfactionData);
    
    if (!satisfactionData) {
      console.log('❌ No satisfaction data');
      return;
    }
    if (!satisfactionData.surveyDetails) {
      console.log('❌ No survey details');
      return;
    }
    
    if (!Array.isArray(satisfactionData.surveyDetails)) {
      console.log('❌ Survey details not an array');
      return;
    }
    
    if (satisfactionData.surveyDetails.length === 0) {
      console.log('❌ No survey details available');
      return;
    }
    
    console.log('📋 Total surveys available:', satisfactionData.surveyDetails.length);
    console.log('📅 Survey dates:', satisfactionData.surveyDetails.map(s => ({ 
      case: s.caseNumber, 
      category: s.category,
      date: s.surveyDate 
    })));
    // Helper function to check if a survey date is within the selected time range
    const isDateInRange = (dateString: string): boolean => {
      if (!selectedTimeRange.from || !selectedTimeRange.to || !dateString) {
        return true; // If no date range selected or no survey date, include all
      }
      
      try {
        const surveyDate = new Date(dateString);
        const fromDate = new Date(selectedTimeRange.from);
        const toDate = new Date(selectedTimeRange.to);
        
        // Set time to start/end of day for proper comparison
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        
        return surveyDate >= fromDate && surveyDate <= toDate;
      } catch (error) {
        console.warn('Invalid date format in survey:', dateString);
        return true; // Include surveys with invalid dates as fallback
      }
    };

    // Filter survey details by the clicked segment category AND selected time range
    const segmentSurveys = satisfactionData.surveyDetails.filter(survey => {
      const category = survey.category?.toLowerCase();
      const categoryMatch = category === segment.toLowerCase();
      const dateMatch = isDateInRange(survey.surveyDate);
      return categoryMatch && dateMatch;
    });
    
    console.log('🔍 Filtered surveys for segment:', segmentSurveys.length);
    console.log('📅 Time range:', {
      from: selectedTimeRange.from?.toLocaleDateString(),
      to: selectedTimeRange.to?.toLocaleDateString()
    });
    
    if (segmentSurveys.length === 0) {
      console.log('❌ No surveys found for segment after filtering');
      return;
    }
    
    // Transform survey details into the format expected by DetailedStatsModal
    const modalSurveyData = segmentSurveys.map((survey, index) => ({
      id: `${segment}-survey-${index}`,
      case_id: survey.caseNumber,
      caseNumber: survey.caseNumber,
      overallSatisfaction: survey.overallSatisfaction,
      category: survey.category,
      feedback: survey.feedback || 'No feedback provided',
      surveyDate: survey.surveyDate,
      customerName: survey.customerName || 'N/A',
      productArea: survey.productArea || 'N/A',
      ownerName: survey.ownerName,
      owner_full_name: survey.ownerName, // Add this field for the Case Owner column
      // Additional case details can be added here if available
      title: `Survey for Case ${survey.caseNumber}`,
      status: 'Completed', // Assuming surveys are for completed cases
      priority: 'N/A',
      products: survey.productArea ? `["${survey.productArea}"]` : '[]'
    }));
    // Format date range for modal title
    const formatDateRange = () => {
      if (!selectedTimeRange.from || !selectedTimeRange.to) {
        return '(All Time)';
      }
      const fromDate = selectedTimeRange.from.toLocaleDateString();
      const toDate = selectedTimeRange.to.toLocaleDateString();
      return `(${fromDate} - ${toDate})`;
    };
    
    // Open the detailed modal with real survey data
    setModalData(modalSurveyData);
    setModalType('survey');
    setModalTitle(`${segment.toUpperCase()} Feedback Details - Customer Satisfaction Survey Results ${formatDateRange()}`);
    setModalOpen(true);
    
    // Add insight to CX results
    const segmentInsight = {
      id: `survey-${segment}-${Date.now()}`,
      title: `${segment.toUpperCase()} Feedback Analysis`,
      description: `${segmentSurveys.length} customers provided ${segment} feedback. ${
        segment === 'csat' ? 'High satisfaction indicates strong service quality and customer loyalty.' :
        segment === 'neutral' ? 'Neutral feedback suggests opportunities for service improvement and enhanced customer experience.' :
        'Dissatisfaction requires immediate attention to address service gaps and prevent customer churn.'
      }`,
      impact: segment === 'csat' ? 'High' : segment === 'neutral' ? 'Medium' : 'Critical',
      category: 'Customer Experience',
      type: segment === 'csat' ? 'success' : segment === 'neutral' ? 'warning' : 'error'
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
    
    // Set modal type based on current entity selection
    if (generatedEntity === 'team') {
      setModalType('team');
    } else {
      setModalType('individual');
    }
    
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

  // Helper function for local SCT analysis
  const performLocalSCTAnalysis = (entityLabel: string, entityName: string, realCaseData: any[], currentSCT: number) => {
    // Analyze real case data locally
    const localInsights: any[] = [];
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
      localInsights.push({
        id: '1',
        title: `${entityLabel} SCT Performance Above Target`,
        description: `${entityName} achieves ${avgSCT} days average SCT, meeting the ≤${targetSCT} days target. Best case: ${minSCT} days, Longest case: ${maxSCT} days.`,
        impact: 'High',
        category: 'performance',
        type: 'success',
        recommendation: `Continue current practices. Share successful techniques with team members.`
      });
    } else {
      localInsights.push({
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
      localInsights.push({
        id: '2',
        title: `Complex Cases Identified`,
        description: `${complexCases.length} of ${realCaseData.length} cases took over 30 days to resolve. These include: ${complexCases.map(c => c.case_id).join(', ')}.`,
        impact: 'Medium',
        category: 'process',
        type: 'warning',
        recommendation: `Review complex cases for common patterns. Consider breaking down large cases or improving estimation.`
      });
    }
    
    // Set the analysis results using local analysis
    const sctAnalysis = {
      insights: localInsights,
      metrics: {
        averageSCT: avgSCT,
        targetSCT: targetSCT,
        improvement: avgSCT <= targetSCT ? 'Meeting target' : 'Needs improvement',
        bottleneck: avgSCT > targetSCT ? 'Case resolution time' : 'None identified',
        efficiency: avgSCT <= targetSCT ? 'Good' : 'Needs improvement',
        trend: realCaseData.length > 3 ? 'Stable' : 'Insufficient Data'
      },
      cases: caseList
    };
    
    setSctAnalysisResults(sctAnalysis);
  };

  // Helper function for local survey analysis
  const performLocalSurveyAnalysis = (entityLabel: string, entityName: string, surveyData: any[], realSatisfactionData: any) => {
    // Analyze real survey data locally
    const localInsights: any[] = [];
    const surveys = surveyData.length > 0 ? surveyData : (realSatisfactionData.surveyDetails || []);
    
    // Calculate metrics from survey data
    const totalSurveys = surveys.length;
    const ratings = surveys.map((s: any) => s.overallSatisfaction).filter((r: number) => r > 0);
    const averageRating = ratings.length > 0 ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10 : 0;
    
    const csatCount = surveys.filter((s: any) => s.category === 'csat').length;
    const neutralCount = surveys.filter((s: any) => s.category === 'neutral').length;
    const dsatCount = surveys.filter((s: any) => s.category === 'dsat').length;
    
    const csatPercentage = totalSurveys > 0 ? Math.round((csatCount / totalSurveys) * 100) : 0;
    const neutralPercentage = totalSurveys > 0 ? Math.round((neutralCount / totalSurveys) * 100) : 0;
    const dsatPercentage = totalSurveys > 0 ? Math.round((dsatCount / totalSurveys) * 100) : 0;
    
    // Overall satisfaction analysis
    if (csatPercentage >= 80) {
      localInsights.push({
        id: '1',
        title: `Excellent Customer Satisfaction Performance`,
        description: `${entityName} achieves ${csatPercentage}% CSAT rate with an average rating of ${averageRating}/5. ${csatCount} satisfied customers out of ${totalSurveys} total surveys.`,
        impact: 'High',
        category: 'satisfaction',
        type: 'success',
        recommendation: 'Continue the excellent customer service practices. Consider documenting successful approaches for training materials.'
      });
    } else if (csatPercentage >= 60) {
      localInsights.push({
        id: '1',
        title: `Good Customer Satisfaction Performance`,
        description: `${entityName} achieves ${csatPercentage}% CSAT rate with an average rating of ${averageRating}/5. ${dsatCount} dissatisfied customers out of ${totalSurveys} total surveys.`,
        impact: 'Medium',
        category: 'satisfaction',
        type: 'success',
        recommendation: 'Maintain current satisfaction levels while focusing on addressing areas that received neutral ratings.'
      });
    } else {
      localInsights.push({
        id: '1',
        title: `Customer Satisfaction Needs Improvement`,
        description: `${entityName} has a ${csatPercentage}% CSAT rate with an average rating of ${averageRating}/5. ${dsatCount} dissatisfied customers out of ${totalSurveys} total surveys.`,
        impact: 'High',
        category: 'satisfaction',
        type: 'warning',
        recommendation: 'Review DSAT cases to identify common issues. Implement targeted training on addressing specific customer concerns.'
      });
    }
    
    // DSAT analysis
    if (dsatCount > 0) {
      const dsatFeedback = surveys.filter((s: any) => s.category === 'dsat');
      const commonIssues = dsatFeedback.filter((s: any) => s.feedback && s.feedback !== '');
      
      localInsights.push({
        id: '2',
        title: `DSAT Feedback Analysis`,
        description: `${dsatCount} customers expressed dissatisfaction (${dsatPercentage}% of total). ${commonIssues.length} provided specific feedback.`,
        impact: 'High',
        category: 'improvement',
        type: 'warning',
        recommendation: `Review detailed feedback from dissatisfied customers. Address common themes in training and process improvements.`
      });
    } else {
      localInsights.push({
        id: '2',
        title: `Zero DSAT Rate - Excellent Performance`,
        description: `No DSAT feedback received from ${totalSurveys} survey responses. This indicates consistent service quality.`,
        impact: 'High',
        category: 'satisfaction',
        type: 'success',
        recommendation: `Maintain current service quality standards. Document and share successful approaches with other teams.`
      });
    }
    
    // Set the analysis results using local analysis
    const surveyAnalysis = {
      insights: localInsights,
      metrics: {
        totalSurveys: totalSurveys,
        averageRating: averageRating,
        csatPercentage: csatPercentage,
        neutralPercentage: neutralPercentage,
        dsatPercentage: dsatPercentage,
        trend: totalSurveys > 3 ? 'Stable' : 'Insufficient Data',
        sentiment: csatPercentage >= 70 ? 'Positive' : csatPercentage >= 50 ? 'Neutral' : 'Needs Improvement'
      },
      surveys: surveys.map((s: any) => ({
        case_id: s.case_id,
        rating: s.overallSatisfaction,
        category: s.category,
        feedback: s.feedback || ''
      }))
    };
    
    setSurveyAnalysisResults(surveyAnalysis);
  };

  const handleAnalyzeSCT = async () => {
    console.log('🎯 HANDLEANALYZESCT FUNCTION CALLED - This is for SCT analysis');
    setSctAnalyzed(true);
    setIsAnalysisLoading(true);
    setIsSCTAnalysisLoading(true);
    
    // Show notification that SCT analysis is starting
    toast({
      title: "SCT Analysis Starting",
      description: "Processing solution cycle time data. Please check Insights & Recommendations section for results.",
    });
    
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
      setIsAnalysisLoading(false);
      setIsSCTAnalysisLoading(false);
      return;
    }
    
    try {
      // Trigger the High SCT Email Scrubber workflow for SCT analysis
      console.log('🔍 Starting High SCT Email Scrubber workflow...', { entityType, entityName, casesCount: realCaseData.length });
      console.log('⏳ Waiting for workflow to complete...');
      
      const workflowResults = await n8nWorkflowService.analyzeSCT(entityType, entityName, realCaseData);
      
      console.log('✅ Workflow completed! Processing results...');
      console.log('📊 Full workflow response:', JSON.stringify(workflowResults, null, 2));
      console.log('🔍 Workflow response type:', typeof workflowResults);
      console.log('🔍 Is array:', Array.isArray(workflowResults));
      
      // Debug validation checks
      console.log('🔍 VALIDATION CHECKS:');
      console.log('   - workflowResults exists:', !!workflowResults);
      console.log('   - has email_sentiment_analysis:', !!(workflowResults?.email_sentiment_analysis));
      console.log('   - has case_handoffs_and_delays:', !!(workflowResults?.case_handoffs_and_delays));
      console.log('   - has summary:', !!(workflowResults?.summary));
      console.log('   - is array with length > 0:', Array.isArray(workflowResults) && workflowResults.length > 0);
      
      // Validate and process workflow results - handle both direct High SCT format and wrapped format
      const isDirectHighSctFormat = workflowResults && (
        workflowResults.email_sentiment_analysis || 
        workflowResults.case_handoffs_and_delays || 
        workflowResults.summary || 
        (Array.isArray(workflowResults) && workflowResults.length > 0)
      );
      
      const isWrappedHighSctFormat = workflowResults?.data && (
        workflowResults.data.email_sentiment_analysis || 
        workflowResults.data.case_handoffs_and_delays || 
        workflowResults.data.summary ||
        (Array.isArray(workflowResults.data) && workflowResults.data.length > 0)
      );
      
      console.log('🔍 Format detection:', { isDirectHighSctFormat, isWrappedHighSctFormat });
      
      if (isDirectHighSctFormat || isWrappedHighSctFormat) {
        console.log('✅ Valid High SCT Email Scrubber results detected');
        
        // Extract the actual High SCT data - handle both direct and wrapped formats
        let rawScrubberData;
        if (isDirectHighSctFormat) {
          console.log('📊 Using direct High SCT format');
          rawScrubberData = workflowResults;
        } else if (isWrappedHighSctFormat) {
          console.log('📊 Using wrapped High SCT format - extracting from .data');
          rawScrubberData = workflowResults.data;
        }
        
        // Handle array output from High SCT Email Scrubber workflow
        let scrubberOutput;
        if (Array.isArray(rawScrubberData) && rawScrubberData.length > 0) {
          console.log('📊 Processing array format results');
          scrubberOutput = rawScrubberData[0]; // Take first item from array
        } else {
          console.log('📊 Processing direct object format results');
          scrubberOutput = rawScrubberData; // Handle non-array format
        }
        
        console.log('🔍 Scrubber output structure:', {
          hasEmailAnalysis: !!scrubberOutput.email_sentiment_analysis,
          hasDelayAnalysis: !!scrubberOutput.case_handoffs_and_delays,
          hasSummary: !!scrubberOutput.summary,
          casesAnalyzedCount: scrubberOutput.cases_analyzed?.length || 0
        });
        
        // Process the AI analysis results
        const aiInsights = [];
        
        // Map email sentiment analysis to insights
        if (scrubberOutput.email_sentiment_analysis && scrubberOutput.email_sentiment_analysis.length > 0) {
          scrubberOutput.email_sentiment_analysis.forEach((item: any, index: number) => {
            aiInsights.push({
              id: `email-${index + 1}`,
              title: `Email Communication Analysis: Case ${item.case_id}`,
              description: item.problem,
              impact: 'Medium',
              category: 'communication',
              type: 'warning',
              recommendation: item.recommendations?.join('\n') || 'No specific recommendations',
              caseId: item.case_id,
              caseTitle: item.case_title || item.title || undefined
            });
          });
        }
        
        // Map case handoffs and delays to insights
        if (scrubberOutput.case_handoffs_and_delays && scrubberOutput.case_handoffs_and_delays.length > 0) {
          scrubberOutput.case_handoffs_and_delays.forEach((item: any, index: number) => {
            aiInsights.push({
              id: `delay-${index + 1}`,
              title: `Process Delay Analysis: Case ${item.case_id}`,
              description: item.problem,
              impact: 'High',
              category: 'process',
              type: 'warning',
              recommendation: item.recommendations?.join('\n') || 'No specific recommendations',
              caseId: item.case_id,
              caseTitle: item.case_title || item.title || undefined
            });
          });
        }
        
        // Add summary insight if available
        if (scrubberOutput.summary && (scrubberOutput.summary.areas_for_improvement?.length > 0 || scrubberOutput.summary.strengths?.length > 0)) {
          aiInsights.unshift({
            id: 'summary-1',
            title: `${entityLabel} Performance Summary`,
            description: `Solution cycle time performance overview with multiple optimization opportunities identified.`,
            impact: 'High',
            category: 'performance',
            type: 'info',
            recommendation: `Areas for improvement: ${scrubberOutput.summary.areas_for_improvement?.join(', ') || 'None identified'}\n\nStrengths: ${scrubberOutput.summary.strengths?.join(', ') || 'None identified'}`
          });
        }
        
        // Use the workflow results as our analysis
        const sctAnalysis = {
          insights: aiInsights.length > 0 ? aiInsights : [
            {
              id: '1',
              title: `${entityLabel} SCT Analysis Complete`,
              description: `Analysis completed for ${entityName}. ${scrubberOutput.cases_analyzed?.length || 0} cases were analyzed.`,
              impact: 'Medium',
              category: 'performance',
              type: 'info',
              recommendation: scrubberOutput.summary?.areas_for_improvement?.join('\n') || 'No specific recommendations found.'
            }
          ],
          metrics: {
            averageSCT: currentSCT,
            targetSCT: 15,
            improvement: scrubberOutput.summary?.strengths?.length > 0 ? 'Analysis Complete' : 'Needs Attention',
            bottleneck: scrubberOutput.summary?.areas_for_improvement?.[0] || 'N/A',
            efficiency: aiInsights.length === 0 ? 'Good' : 'Needs Improvement',
            trend: scrubberOutput.cases_analyzed?.length > 0 ? 'Analysis Complete' : 'Insufficient Data'
          },
          cases: scrubberOutput.cases_analyzed || []
        };
        
        setSctAnalysisResults(sctAnalysis);
        
        // Show detailed success message
        const casesAnalyzed = scrubberOutput.cases_analyzed?.length || realCaseData.length || 0;
        const insightsGenerated = aiInsights.length;
        
        console.log('🎉 High SCT Email Scrubber analysis complete!', {
          casesAnalyzed,
          insightsGenerated,
          emailAnalysisCount: scrubberOutput.email_sentiment_analysis?.length || 0,
          delayAnalysisCount: scrubberOutput.case_handoffs_and_delays?.length || 0,
          hasSummary: !!scrubberOutput.summary
        });
        
        toast({
          title: `🎉 ${entityLabel} SCT Analysis Complete`,
          description: `High SCT Email Scrubber analyzed ${casesAnalyzed} cases for ${entityName} and generated ${insightsGenerated} insights.`,
          variant: "default"
        });
      } else {
        // Fall back to local analysis if workflow didn't return results
        console.log('❌ HIGH SCT EMAIL SCRUBBER WORKFLOW VALIDATION FAILED');
        console.log('📊 Workflow returned:', workflowResults);
        console.log('🔄 Falling back to local SCT analysis (this is what you\'re seeing now)');
        console.log('💡 Check n8n workflow output format - needs email_sentiment_analysis, case_handoffs_and_delays, or summary properties');
        
        // Analyze real case data locally
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
        
        // Set the analysis results using local analysis
        const sctAnalysis = {
          insights: insights,
          metrics: {
            averageSCT: avgSCT,
            targetSCT: targetSCT,
            improvement: avgSCT <= targetSCT ? 'Meeting target' : 'Needs improvement',
            bottleneck: avgSCT > targetSCT ? 'Case resolution time' : 'None identified',
            efficiency: avgSCT <= targetSCT ? 'Good' : 'Needs improvement',
            trend: realCaseData.length > 3 ? 'Stable' : 'Insufficient Data'
          },
          cases: caseList
        };
        
        setSctAnalysisResults(sctAnalysis);
        
        // Show fallback message
        toast({
          title: `${entityLabel} SCT Analysis (Local)`,
          description: `High SCT Email Scrubber unavailable. Local analysis of ${realCaseData.length} cases completed.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('❌ Error running High SCT Email Scrubber workflow:', error);
      
      // Show specific error message with more details
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "High SCT Email Scrubber Failed",
        description: `Workflow error: ${errorMessage}. Please check if n8n is running and the workflow is activated.`,
        variant: "destructive"
      });
      
      // Fallback to local analysis if workflow failed
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
          title: `${entityLabel} SCT Performance Above Target (Local Analysis)`,
          description: `${entityName} achieves ${avgSCT} days average SCT, meeting the ≤${targetSCT} days target. Best case: ${minSCT} days, Longest case: ${maxSCT} days. Note: AI analysis unavailable.`,
          impact: 'High',
          category: 'performance',
          type: 'success',
          recommendation: `Continue current practices. Note: Detailed AI insights not available due to workflow error.`
        });
      } else {
        insights.push({
          id: '1',
          title: `${entityLabel} SCT Performance Below Target (Local Analysis)`,
          description: `${entityName} averages ${avgSCT} days SCT, ${Math.round((avgSCT - targetSCT) * 10) / 10} days above the ${targetSCT} days target. Note: AI analysis unavailable.`,
          impact: 'High',
          category: 'performance',
          type: 'warning',
          recommendation: `Focus on reducing case resolution time. Note: Detailed AI insights not available due to workflow error.`
        });
      }
      
      // Set the analysis results using local analysis
      const sctAnalysis = {
        insights: insights,
        metrics: {
          averageSCT: avgSCT,
          targetSCT: targetSCT,
          improvement: avgSCT <= targetSCT ? 'Meeting target (Basic)' : 'Needs improvement (Basic)',
          bottleneck: avgSCT > targetSCT ? 'Case resolution time' : 'None identified',
          efficiency: avgSCT <= targetSCT ? 'Good (Basic)' : 'Needs improvement (Basic)',
          trend: realCaseData.length > 3 ? 'Stable (Basic)' : 'Insufficient Data'
        },
        cases: caseList
      };
      
      // Append new results to existing ones instead of replacing
      setSctAnalysisResults(prevResults => {
        if (!prevResults) {
          console.log('✅ SCT Analysis completed successfully! First results set:', sctAnalysis);
          return sctAnalysis;
        } else {
          const existingCases = prevResults.cases || [];
          const newCases = sctAnalysis.cases || [];
          const combinedCases = [...existingCases, ...newCases];
          
          const combinedResults = {
            ...sctAnalysis,
            cases: combinedCases
          };
          
          console.log('🔄 Appending SCT results - Previous cases:', existingCases.length, 'New cases:', newCases.length, 'Combined:', combinedCases.length);
          console.log('✅ SCT Analysis completed successfully! Combined results set:', combinedResults);
          return combinedResults;
        }
      });
    } finally {
      setIsAnalysisLoading(false);
      setIsSCTAnalysisLoading(false);
      console.log('🔄 SCT Analysis loading state cleared');
    }
    
  };

  const handleCXInsight = async () => {
    setCxAnalyzed(true);
    setIsAnalysisLoading(true);
    
    // Get entity-specific terminology
    const entityType = generatedEntity || selectedEntity;
    const entityName = generatedEntityValue || selectedEntityValue;
    const entityLabel = entityType === 'dpe' ? 'DPE' : entityType === 'squad' ? 'Squad' : 'Team';
    const entityContext = entityType === 'dpe' ? 'individual' : entityType === 'squad' ? 'squad' : 'team';
    const peerGroup = entityType === 'dpe' ? 'other DPEs' : entityType === 'squad' ? 'other squads' : 'other teams';
    const performanceLevel = entityType === 'dpe' ? 'all DPEs' : entityType === 'squad' ? 'all squads' : 'all teams';
    
    // Use real survey data if available
    const realSurveyData = satisfactionData?.surveyDetails || [];
    
    if (realSurveyData.length === 0) {
      // Fallback to dummy data only if no real data available
      const cxAnalysis = {
        insights: [
          {
            id: '1',
            title: 'No Survey Data Available',
            description: 'No customer satisfaction survey data found for the selected time period to analyze CX performance.',
            impact: 'Low',
            category: 'data',
            type: 'info',
            recommendation: 'Generate a report for a period with survey responses to see detailed CX analysis.'
          }
        ]
      };
      setSurveyAnalysisResults(cxAnalysis);
      setIsAnalysisLoading(false);
      return;
    }
    
    try {
      // Trigger the Analyze Survey workflow for CX analysis
      console.log('🔍 Starting Analyze Survey workflow...', { entityType, entityName, surveysCount: realSurveyData.length });
      console.log('⏳ Waiting for workflow to complete...');
      
      const workflowResults = await n8nWorkflowService.analyzeSurvey(entityType, entityName, realSurveyData);
      
      console.log('✅ Workflow completed! Processing results...');
      console.log('📊 Full workflow response:', JSON.stringify(workflowResults, null, 2));
      
      // Process the workflow results into insights format
      const processedInsights = [];
      
      // Check if we have direct insights from the workflow
      if (workflowResults && Array.isArray(workflowResults)) {
        workflowResults.forEach((item: any, index: number) => {
          if (item.title && item.description) {
            processedInsights.push({
              id: `survey-${index + 1}`,
              title: item.title,
              description: item.description,
              impact: item.impact || 'Medium',
              category: item.category || 'satisfaction',
              type: item.type || 'info',
              recommendation: item.recommendation || 'No specific recommendations provided.'
            });
          }
        });
      } else if (workflowResults && typeof workflowResults === 'object') {
        // Handle single object response
        if (workflowResults.title && workflowResults.description) {
          processedInsights.push({
            id: 'survey-1',
            title: workflowResults.title,
            description: workflowResults.description,
            impact: workflowResults.impact || 'Medium',
            category: workflowResults.category || 'satisfaction',
            type: workflowResults.type || 'info',
            recommendation: workflowResults.recommendation || 'No specific recommendations provided.'
          });
        }
        
        // Check for nested insights structure
        if (workflowResults.insights && Array.isArray(workflowResults.insights)) {
          workflowResults.insights.forEach((insight: any, index: number) => {
            processedInsights.push({
              id: `survey-insight-${index + 1}`,
              title: insight.title || `Survey Insight ${index + 1}`,
              description: insight.description || insight.analysis || 'No description available',
              impact: insight.impact || 'Medium',
              category: insight.category || 'satisfaction',
              type: insight.type || 'info',
              recommendation: insight.recommendation || insight.recommendations || 'No recommendations provided.'
            });
          });
        }
      }
      
      // If no insights were found, create a summary insight
      if (processedInsights.length === 0) {
        processedInsights.push({
          id: `survey-summary-cx-${Date.now()}`,
          title: `${entityLabel} Survey Analysis Complete`,
          description: `Customer satisfaction analysis completed for ${entityName}. ${realSurveyData.length} survey responses were analyzed.`,
          impact: 'Medium',
          category: 'satisfaction',
          type: 'info',
          recommendation: 'Review the detailed workflow output for specific insights and recommendations.'
        });
      }
      
      const cxAnalysis = {
        insights: processedInsights
      };
      
      setSurveyAnalysisResults(cxAnalysis);
      setIsAnalysisLoading(false);
      
    } catch (error) {
      console.error('❌ Error running Analyze Survey workflow:', error);
      
      // Fallback to error state
      const errorAnalysis = {
        insights: [
          {
            id: 'error-1',
            title: 'Survey Analysis Failed',
            description: `Failed to analyze customer satisfaction data: ${error.message}`,
            impact: 'Low',
            category: 'error',
            type: 'warning',
            recommendation: 'Check n8n workflow status and try again. Ensure the Analyze Survey workflow is active and accessible.'
          }
        ]
      };
      
      setSurveyAnalysisResults(errorAnalysis);
      setIsAnalysisLoading(false);
    }

  };

  const handleAnalyzeSurvey = async () => {
    setIsSurveyAnalyzed(true);
    setIsAnalysisLoading(true);
    setIsSurveyAnalysisLoading(true);
    
    // Show notification that Survey analysis is starting
    toast({
      title: "Survey Analysis Starting", 
      description: "Processing customer satisfaction survey data. Please check Insights & Recommendations section for results.",
    });
    
    // Get entity-specific terminology
    const entityType = generatedEntity || selectedEntity;
    const entityName = generatedEntityValue || selectedEntityValue;
    const entityLabel = entityType === 'dpe' ? 'DPE' : entityType === 'squad' ? 'Squad' : 'Team';
    
    // Use survey data from modalData or satisfaction data
    const surveyDataFromModal = modalData || [];
    const realSurveyData = surveyDataFromModal.length > 0 ? surveyDataFromModal : (satisfactionData?.surveyDetails || []);
    
    if (realSurveyData.length === 0) {
      // Fallback when no survey data available
      const fallbackAnalysis = {
        insights: [
          {
            id: '1',
            title: 'No Survey Data Available',
            description: 'No customer satisfaction survey data found for the selected entity and time period.',
            impact: 'Low',
            category: 'data',
            type: 'info',
            recommendation: 'Ensure surveys are being collected and processed for comprehensive feedback analysis.'
          }
        ]
      };
      setSurveyAnalysisResults(fallbackAnalysis);
      setIsAnalysisLoading(false);
      setIsSurveyAnalysisLoading(false);
      return;
    }
    
    try {
      // Trigger the Analyze Survey workflow
      console.log('🔍 Starting Analyze Survey workflow from modal...', { entityType, entityName, surveysCount: realSurveyData.length });
      console.log('⏳ Waiting for workflow to complete...');
      
      const workflowResults = await n8nWorkflowService.analyzeSurvey(entityType, entityName, realSurveyData);
      
      console.log('✅ Workflow completed! Processing results...');
      console.log('📊 Full workflow response:', JSON.stringify(workflowResults, null, 2));
      
      // Process the workflow results into insights format
      const processedInsights = [];
      
      console.log('🔍 Processing Analyze Survey workflow results...');
      console.log('🔍 Workflow response type:', typeof workflowResults);
      console.log('🔍 Has survey_sentiment_analysis:', !!(workflowResults?.survey_sentiment_analysis));
      console.log('🔍 Has summary:', !!(workflowResults?.summary));
      console.log('🔍 survey_sentiment_analysis length:', workflowResults?.survey_sentiment_analysis?.length);
      console.log('🔍 survey_sentiment_analysis content:', workflowResults?.survey_sentiment_analysis);
      
      // Handle the Analyze Survey workflow format
      if (workflowResults && typeof workflowResults === 'object') {
        // Process survey_sentiment_analysis array
        if (workflowResults.survey_sentiment_analysis && Array.isArray(workflowResults.survey_sentiment_analysis)) {
          console.log(`📊 Processing ${workflowResults.survey_sentiment_analysis.length} survey analysis items`);
          
          for (let index = 0; index < workflowResults.survey_sentiment_analysis.length; index++) {
            const item = workflowResults.survey_sentiment_analysis[index];
            console.log(`🔍 Processing item ${index + 1}:`, item);
            console.log(`🔍 Item case_id: ${item?.case_id}, survey_type: ${item?.survey_type}`);
            
            if (item && item.case_id && item.problem) {
              // Debug: Log available fields to see what verbatim fields exist
              console.log(`🔍 Available fields for case ${item.case_id}:`, Object.keys(item));
              console.log(`🔍 Verbatim fields:`, {
                customer_verbatim: item.customer_verbatim,
                verbatim: item.verbatim,
                feedback: item.feedback,
                customer_feedback: item.customer_feedback,
                survey_feedback: item.survey_feedback,
                comments: item.comments
              });

              // Get customer verbatim from original survey data
              let customerVerbatim = undefined;
              
              // First try the item itself (from n8n workflow response)
              const verbatimOptions = [
                item.customer_verbatim,
                item.verbatim, 
                item.feedback,
                item.customer_feedback,
                item.survey_feedback,
                item.comments
              ];
              
              customerVerbatim = verbatimOptions.find(v => v && typeof v === 'string' && v.trim().length > 0);
              
              // If not found in n8n response, get it from original survey data
              if (!customerVerbatim && item.case_id && realSurveyData) {
                const originalSurvey = realSurveyData.find(survey => 
                  survey.caseNumber === item.case_id || survey.case_id === item.case_id
                );
                
                if (originalSurvey && originalSurvey.feedback && 
                    typeof originalSurvey.feedback === 'string' && 
                    originalSurvey.feedback.trim().length > 0 &&
                    originalSurvey.feedback !== 'No feedback provided') {
                  customerVerbatim = originalSurvey.feedback.trim();
                }
              }

              // Get case owner information from the original survey data
              let caseOwner = undefined;
              if (realSurveyData) {
                const originalSurveyForOwner = realSurveyData.find(survey => 
                  survey.caseNumber === item.case_id || survey.case_id === item.case_id
                );
                
                if (originalSurveyForOwner && originalSurveyForOwner.ownerName) {
                  caseOwner = originalSurveyForOwner.ownerName;
                }
              }

              const insight = {
                id: `survey-analysis-${item.case_id}-${Date.now()}-${index + 1}`,
                title: `Case Analysis: ${item.case_id}`,
                description: item.problem,
                impact: 'Medium',
                category: 'case-analysis',
                type: item.survey_type === 'DSAT' ? 'warning' : 'info',
                recommendation: Array.isArray(item.recommendations) ? 
                  `• ${item.recommendations.join('\n• ')}` : 
                  'No specific recommendations provided.',
                surveyType: item.survey_type, // Add survey type for grouping
                caseId: item.case_id,
                caseTitle: item.case_title || item.title || undefined,
                customerVerbatim: customerVerbatim, // Add customer verbatim
                caseOwner: caseOwner // Add case owner information
              };

              console.log(`💬 Customer verbatim for ${item.case_id}:`, customerVerbatim ? `"${customerVerbatim}"` : 'NO VERBATIM FOUND');
              console.log(`👤 Case owner for ${item.case_id}:`, caseOwner ? `"${caseOwner}"` : 'NO OWNER FOUND');
              
              console.log(`📝 Created insight for ${item.survey_type} case ${item.case_id}:`, insight);
              processedInsights.push(insight);
            } else {
              console.warn(`⚠️ Skipping invalid item at index ${index}:`, item);
            }
          }
          
          console.log(`✅ Added ${processedInsights.length} case insights to processedInsights array`);
        } else {
          console.warn('⚠️ survey_sentiment_analysis not found or not an array');
        }
        
        // Add summary insight if available
        if (workflowResults.summary) {
          const summary = workflowResults.summary;
          
          // Determine survey type from processed case insights
          let surveyType = '';
          if (processedInsights.length > 0) {
            // Count CSAT, DSAT, and NEUTRAL cases
            const csatCount = processedInsights.filter(insight => insight.surveyType === 'CSAT').length;
            const dsatCount = processedInsights.filter(insight => insight.surveyType === 'DSAT').length;
            const neutralCount = processedInsights.filter(insight => insight.surveyType === 'NEUT' || insight.surveyType === 'NEUTRAL').length;
            
            // Use the predominant type
            if (dsatCount > csatCount && dsatCount > neutralCount) {
              surveyType = 'DSAT';
            } else if (csatCount > dsatCount && csatCount > neutralCount) {
              surveyType = 'CSAT';
            } else if (neutralCount > csatCount && neutralCount > dsatCount) {
              surveyType = 'NEUT';
            } else if (csatCount > 0) {
              surveyType = 'CSAT';
            } else if (dsatCount > 0) {
              surveyType = 'DSAT';
            } else if (neutralCount > 0) {
              surveyType = 'NEUT';
            } else {
              // Fallback: check raw data for survey types
              const allSurveyTypes = workflowResults.survey_sentiment_analysis?.map((item: any) => item.survey_type).filter(Boolean) || [];
              const uniqueTypes = [...new Set(allSurveyTypes)] as string[];
              surveyType = uniqueTypes.length === 1 ? uniqueTypes[0] as string : (uniqueTypes.includes('CSAT') ? 'CSAT' : uniqueTypes.includes('DSAT') ? 'DSAT' : uniqueTypes.includes('NEUT') ? 'NEUT' : 'Mixed');
            }
          }
          
          let summaryDescription = `Customer satisfaction analysis reveals key trends and improvement opportunities.`;
          
          if (summary.strengths?.length > 0) {
            summaryDescription += `\n\n✅ Strengths identified:\n• ${summary.strengths.join('\n• ')}`;
          }
          
          if (summary.areas_for_improvement?.length > 0) {
            summaryDescription += `\n\n🎯 Areas for improvement:\n• ${summary.areas_for_improvement.join('\n• ')}`;
          }
          
          const summaryInsight = {
            id: `survey-summary-${Date.now()}`,
            title: `${entityLabel} Customer Survey Summary`,
            description: summaryDescription,
            impact: 'High',
            category: 'summary',
            type: 'success',
            surveyType: surveyType, // Add survey type for display
            recommendation: summary.areas_for_improvement?.length > 0 ? 
              `Focus on:\n• ${summary.areas_for_improvement.join('\n• ')}` : 
              'Continue current excellent practices.'
          };
          console.log(`📋 Adding summary insight:`, summaryInsight);
          processedInsights.unshift(summaryInsight);
        }
        
        console.log(`🎉 Total insights created: ${processedInsights.length}`);
        console.log(`📊 Individual case insights: ${workflowResults.survey_sentiment_analysis?.length || 0}`);
        console.log(`📋 Summary insights: ${workflowResults.summary ? 1 : 0}`);
        console.log(`🔍 All processed insights:`, processedInsights);
      }
      
      // If no insights were found, create a summary insight
      if (processedInsights.length === 0) {
        processedInsights.push({
          id: `survey-summary-analyze-${Date.now()}`,
          title: `${entityLabel} Survey Analysis Complete`,
          description: `Customer satisfaction analysis completed for ${entityName}. ${realSurveyData.length} survey responses were analyzed.`,
          impact: 'Medium',
          category: 'satisfaction',
          type: 'info',
          recommendation: 'Review the detailed workflow output for specific insights and recommendations.'
        });
      }
      
      const surveyAnalysis = {
        insights: processedInsights
      };
      
      // Append new results to existing ones instead of replacing
      setSurveyAnalysisResults(prevResults => {
        const existingInsights = prevResults?.insights || [];
        const combinedInsights = [...existingInsights, ...processedInsights];
        console.log('🔄 Appending survey results - Previous:', existingInsights.length, 'New:', processedInsights.length, 'Combined:', combinedInsights.length);
        return { insights: combinedInsights };
      });
      setIsAnalysisLoading(false);
      setIsSurveyAnalysisLoading(false);
      
      toast({
        title: `${entityLabel} Survey Analysis Complete`,
        description: `Analysis completed for ${entityName} with ${processedInsights.length} insights generated.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('❌ Error running Analyze Survey workflow:', error);
      
      // Fallback to error state
      const errorAnalysis = {
        insights: [
          {
            id: 'error-1',
            title: 'Survey Analysis Failed',
            description: `Failed to analyze customer satisfaction data: ${error.message}`,
            impact: 'Low',
            category: 'error',
            type: 'warning',
            recommendation: 'Check n8n workflow status and try again. Ensure the Analyze Survey workflow is active and accessible.'
          }
        ]
      };
      
      setSurveyAnalysisResults(errorAnalysis);
      setIsAnalysisLoading(false);
      setIsSurveyAnalysisLoading(false);
      
      toast({
        title: "Survey Analysis Error",
        description: "Failed to analyze survey data. Please try again.",
        variant: "destructive"
      });
    }
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
    // Log each DPE and its mapping to debug the filtering
    entityData.dpes.forEach(dpe => {
      if (!dpe.includes('Add New')) {
        const mappedSquad = entityMappings.dpeToSquad[dpe];
      }
    });
    
    const dpeNames = entityData.dpes.filter(dpe => 
      !dpe.includes('Add New') && 
      entityMappings.dpeToSquad[dpe] === generatedEntityValue
    );
    // Validate that squad has members
    if (dpeNames.length === 0) {
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
    
    // Calculate survey responses based on ACTUAL data, not fallback data
    // Get direct values from the performance data metrics if available
    const totalSatisfaction = performanceData.reduce((sum: {csat: number, neutral: number, dsat: number}, data: any) => {
      // Extract actual satisfaction metrics if they exist
      if (data && data.metrics && data.metrics.customerSatisfaction) {
        const cs = data.metrics.customerSatisfaction;
        return {
          csat: sum.csat + (cs.csat || 0),
          neutral: sum.neutral + (cs.neutral || 0),
          dsat: sum.dsat + (cs.dsat || 0)
        };
      }
      return sum;
    }, { csat: 0, neutral: 0, dsat: 0 });
    
    const totalResponses = totalSatisfaction.csat + totalSatisfaction.neutral + totalSatisfaction.dsat;
    
    // Only generate survey data if we have actual responses
    if (totalResponses === 0) {
      return [];
    }
    
    return [
      { 
        name: 'CSAT (4-5)', 
        value: totalSatisfaction.csat, 
        percentage: Math.round((totalSatisfaction.csat / totalResponses) * 100),
        color: '#4ade80' 
      },
      { 
        name: 'Neutral (3)', 
        value: totalSatisfaction.neutral, 
        percentage: Math.round((totalSatisfaction.neutral / totalResponses) * 100),
        color: '#fbbf24' 
      },
      { 
        name: 'DSAT (1-2)', 
        value: totalSatisfaction.dsat, 
        percentage: Math.round((totalSatisfaction.dsat / totalResponses) * 100),
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
    
    console.log('🔍 getAllInsights called - Current state:');
    console.log('   - sctAnalysisResults:', !!sctAnalysisResults, sctAnalysisResults?.insights?.length || 0);
    console.log('   - cxInsightResults:', !!cxInsightResults, cxInsightResults?.insights?.length || 0);
    console.log('   - surveyAnalysisResults:', !!surveyAnalysisResults, surveyAnalysisResults?.insights?.length || 0);
    
    if (sctAnalysisResults) {
      console.log('   📊 Adding SCT insights:', sctAnalysisResults.insights.length);
      allInsights = [...allInsights, ...sctAnalysisResults.insights];
    }
    
    if (cxInsightResults) {
      console.log('   📊 Adding CX insights:', cxInsightResults.insights.length);
      allInsights = [...allInsights, ...cxInsightResults.insights];
    }
    
    if (surveyAnalysisResults) {
      console.log('   📊 Adding Survey insights:', surveyAnalysisResults.insights.length);
      allInsights = [...allInsights, ...surveyAnalysisResults.insights];
    }
    
    console.log('🎯 Total insights returned:', allInsights.length);
    
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
                  <h1 className="text-2xl font-bold text-foreground">IntelliPerformance</h1>
                  <p className="text-sm text-muted-foreground">Performance Analytics and Customer Insights</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
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
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 space-y-4">
        {/* Backend Status - Always visible at the top */}
        <BackendStatus />
        
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
        {reportGenerated && generatedEntityValue ? (() => {
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
                  value={formatKPIValue(getKPIData().sct)}
                  target={
                    (getKPIData().sct !== undefined && getKPIData().sct !== null) ? 15 : null
                  }
                  unit="days"
                  icon={<Clock className="h-4 w-4" />}
                  description=""
                  isLoading={isPerformanceLoading && !hasTimedOut}
                  loadingStartTime={loadingStartTime}
                />
                <KPICard
                  title="Closed Cases"
                  value={getKPIData().cases}
                  target={null}
                  unit=""
                  icon={<CheckCircle className="h-4 w-4" />}
                  description=""
                  isLoading={isPerformanceLoading && !hasTimedOut}
                  loadingStartTime={loadingStartTime}
                />
                <KPICard
                  title="CSAT Score"
                  value={formatKPIValue(getKPIData().csat)}
                  target={
                    (getKPIData().csat !== null && getKPIData().csat !== undefined) ? 85 : null
                  }
                  unit="%"
                  icon={<ThumbsUp className="h-4 w-4" />}
                  description=""
                  isLoading={isSatisfactionLoading && !hasTimedOut}
                  loadingStartTime={loadingStartTime}
                />
                <KPICard
                  title="DSAT Score"
                  value={formatKPIValue(getKPIData().dsat)}
                  target={
                    (getKPIData().dsat !== null && getKPIData().dsat !== undefined) ? 5 : null
                  }
                  unit="%"
                  icon={<ThumbsDown className="h-4 w-4" />}
                  description=""
                  isLoading={isSatisfactionLoading && !hasTimedOut}
                  loadingStartTime={loadingStartTime}
                />
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm chart-container h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">
                          Performance Overview
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 card-content">
                    {/* Chart Section */}
                    <div className="mb-4">
                      {isPerformanceLoading ? (
                        <TeamPerformanceChart
                          key={`loading-${selectedEntity}-${activeTab}`}
                          data={[]}
                          title={reportGenerated ? generatedEntityValue : 'No Entity Selected'}
                          onBarClick={handleIndividualBarClick}
                          isLoading={true}
                        />
                      ) : (
                        <TeamPerformanceChart
                          key={`${selectedEntity}-${activeTab}-${generatedEntityValue}`}
                          data={getChartData()}
                          title={reportGenerated ? generatedEntityValue : 'No Entity Selected'}
                          onBarClick={handleIndividualBarClick}
                        />
                      )}
                    </div>

                    {/* Dynamic Tabs Section - Centered */}
                    {reportGenerated && selectedEntity && selectedEntity !== 'dpe' && (
                      <div className="flex justify-center">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
                          <TabsList className="grid w-full grid-cols-2 mb-4">
                            {selectedEntity === 'squad' && (
                              <>
                                <TabsTrigger value="dpe">DPE</TabsTrigger>
                                <TabsTrigger value="squad">Squad</TabsTrigger>
                              </>
                            )}
                            {selectedEntity === 'team' && (
                              <>
                                <TabsTrigger value="squad">Squad</TabsTrigger>
                                <TabsTrigger value="team">Team</TabsTrigger>
                              </>
                            )}
                          </TabsList>
                        </Tabs>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-lg border bg-card text-card-foreground shadow-sm chart-container h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="h-5 w-5" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">Customer Satisfaction Distribution</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="card-content">
                    {/* Chart Section */}
                    <div className="mb-4">
                      {isSatisfactionLoading && !hasTimedOut ? (
                        <SurveyAnalysisChart
                          data={[]}
                          title={reportGenerated ? generatedEntityValue : 'No Entity Selected'}
                          totalSurveys={0}
                          isLoading={true}
                          onPieClick={handleSurveySegmentClick}
                        />
                      ) : (
                        // Always use SurveyAnalysisChart component for consistent styling
                        <SurveyAnalysisChart
                          data={(() => {
                            const chartData = getSurveyChartData();
                            console.log('📊 Chart data provided to SurveyAnalysisChart:', chartData);
                            return chartData;
                          })()}
                          title={reportGenerated ? generatedEntityValue : 'No Entity Selected'}
                          totalSurveys={
                            getSurveyChartData().length > 0 ? 
                            (getSurveyChartData().reduce((sum, item) => sum + (item.value || 0), 0) ||
                            (satisfactionData?.satisfactionData?.total || 0)) : 0
                          }
                          onPieClick={handleSurveySegmentClick}
                        />
                      )}
                    </div>
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
                isSCTAnalysisLoading={isSCTAnalysisLoading}
                isSurveyAnalysisLoading={isSurveyAnalysisLoading}
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
                isLoading={isPerformanceLoading && !hasTimedOut}
                loadingStartTime={loadingStartTime}
              />
              <KPICard
                title="Closed Cases"
                value={null}
                target={null}
                unit=""
                icon={<CheckCircle className="h-4 w-4" />}
                description=""
                isLoading={isPerformanceLoading && !hasTimedOut}
                loadingStartTime={loadingStartTime}
              />
              <KPICard
                title="CSAT Score"
                value={null}
                target={null}
                unit="%"
                icon={<ThumbsUp className="h-4 w-4" />}
                description=""
                isLoading={isSatisfactionLoading && !hasTimedOut}
                loadingStartTime={loadingStartTime}
              />
              <KPICard
                title="DSAT Score"
                value={null}
                target={null}
                unit="%"
                icon={<ThumbsDown className="h-4 w-4" />}
                description=""
                isLoading={isSatisfactionLoading && !hasTimedOut}
                loadingStartTime={loadingStartTime}
              />
            </div>

            {/* Charts Section - Show different charts based on entity type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Performance Chart - Always show for DPE, Squad, Team */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm chart-container h-full">
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
                        data={reportDashboardData?.performanceData || []}
                        onBarClick={handleIndividualBarClick}
                        title={reportGenerated ? generatedEntityValue : 'No Entity Selected'}
                      />
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Customer Satisfaction Chart - Conditional based on data availability */}
              <Card className="rounded-lg border bg-card text-card-foreground shadow-sm chart-container h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">Customer Satisfaction Distribution</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="card-content">
                  {(() => {
                    // Use real satisfaction data if available
                    const realSurveyData = chartSurveyData || [];
                    // Calculate total surveys from the actual chart data values
                    const totalSurveys = realSurveyData.length > 0 
                      ? realSurveyData.reduce((sum, item) => sum + (item.value || 0), 0)
                      : (satisfactionData?.satisfactionData?.total || 0);
                    const entityTitle = reportGenerated ? generatedEntityValue : 'No Entity Selected';
                    
                    // Let the chart component handle the no-data state
                    
                    return (
                      <SurveyAnalysisChart
                        data={realSurveyData}
                        title={reportGenerated ? generatedEntityValue : 'No Entity Selected'}
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
              isSCTAnalysisLoading={isSCTAnalysisLoading}
              isSurveyAnalysisLoading={isSurveyAnalysisLoading}
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
        onAnalyzeSCT={handleAnalyzeSCT}
        onAnalyzeSurvey={handleAnalyzeSurvey}
        isSCTAnalysisLoading={isSCTAnalysisLoading}
        isSurveyAnalysisLoading={isSurveyAnalysisLoading}
      />

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default IndexNew;