import React, { useState } from 'react';
import { Clock, Users, ThumbsUp, AlertCircle, BarChart3, TrendingUp, Settings } from 'lucide-react';
import FilterSection from '@/components/dashboard/FilterSection';
import KPICard from '@/components/dashboard/KPICard';
import TeamPerformanceChart from '@/components/dashboard/TeamPerformanceChart';
import SurveyAnalysisChart from '@/components/dashboard/SurveyAnalysisChart';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import DetailedStatsModal from '@/components/dashboard/DetailedStatsModal';
import EntityManagementDialog from '@/components/dashboard/EntityManagementDialog';
import ThemeToggle from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  name: string;
  sct: number;
  cases: number;
  satisfaction: number;
}

const Index = () => {
  const { toast } = useToast();
  const [selectedEntity, setSelectedEntity] = useState('squad'); // Changed to squad to show team chart
  const [selectedEntityValue, setSelectedEntityValue] = useState('Alpha Squad'); // Pre-selected
  const [selectedTimeRange, setSelectedTimeRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(2024, 7, 1), // Aug 1, 2024
    to: new Date(2024, 7, 31),  // Aug 31, 2024
  });
  const [isLoading, setIsLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(true); // Set to true to show sample data
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalType, setModalType] = useState<'team' | 'survey' | 'individual'>('team');
  const [modalTitle, setModalTitle] = useState('');

  // Dynamic entity data with mapping
  const [entityData, setEntityData] = useState({
    dpe: ['Juan Dela Cruz', 'Maria Santos', 'Carlos Rodriguez', 'Ana Garcia', 'Miguel Torres', 'Sofia Lopez', 'Diego Martinez', 'Isabella Chen', 'Add New DPE...'],
    squad: ['Alpha Squad', 'Beta Squad', 'Gamma Squad', 'Delta Squad', 'Echo Squad', 'Add New Squad...'],
    team: ['Platform Engineering', 'DevOps Infrastructure', 'Cloud Operations', 'Security Engineering', 'Site Reliability', 'Add New Team...']
  });

  // Entity mapping relationships
  const [entityMappings, setEntityMappings] = useState({
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
  });

  // Enhanced sample data with more realistic metrics
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
    sct: 16,
    cases: 45,
    satisfaction: 87,
    neutral: 8,
    dissatisfied: 5,
    totalSurveys: 42
  };

  const teamAverages = {
    sct: 15.2,
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

  const handleGenerateReport = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setReportGenerated(true);
      toast({
        title: "Report Generated Successfully",
        description: `KPI analysis for ${selectedEntityValue} from ${selectedTimeRange.from?.toLocaleDateString()} to ${selectedTimeRange.to?.toLocaleDateString()}`,
      });
    }, 2000);
  };

  const handleScrubCases = () => {
    toast({
      title: "Case Scrubbing Initiated",
      description: "Analyzing D365 cases for performance insights...",
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
            priority: ['P1', 'P2', 'P3', 'P3'][i % 4],
            status: 'Closed',
            complexity: Math.floor(Math.random() * 5) + 1,
            createdDate: new Date(2024, 7, Math.floor(Math.random() * 30) + 1).toLocaleDateString(),
            closedDate: new Date(2024, 7, Math.floor(Math.random() * 30) + 1).toLocaleDateString()
          }));
        case 'cases':
          return Array.from({ length: member.cases }, (_, i) => ({
            caseId: `CASE-${2024}${String(i + 1).padStart(3, '0')}`,
            title: `Case ${i + 1}: ${['Configuration', 'Performance', 'Integration', 'Security', 'Deployment'][i % 5]} Request`,
            status: ['Closed', 'In Progress', 'Pending'][i % 3],
            priority: ['P1', 'P2', 'P3', 'P3'][i % 4],
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

  const handleEntityDataChange = (entityType: string, data: string[]) => {
    setEntityData(prev => ({
      ...prev,
      [entityType]: data
    }));
  };

  const handleMappingsChange = (mappings: any) => {
    setEntityMappings(mappings);
  };

  // Dynamic data based on selected entity
  const getCurrentData = () => {
    if (selectedEntity === 'dpe') {
      return {
        sct: individualDPEData.sct,
        cases: individualDPEData.cases,
        satisfaction: individualDPEData.satisfaction,
        totalSurveys: individualDPEData.totalSurveys
      };
    } else {
      return {
        sct: teamAverages.sct,
        cases: teamAverages.cases,
        satisfaction: teamAverages.satisfaction,
        totalSurveys: 400
      };
    }
  };

  const currentData = getCurrentData();

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
          <EntityManagementDialog
            entityType={selectedEntity as 'dpe' | 'squad' | 'team'}
            entities={entityData[selectedEntity as keyof typeof entityData] || []}
            onEntitiesChange={(entities) => handleEntityDataChange(selectedEntity, entities)}
            entityMappings={entityMappings}
            onMappingsChange={handleMappingsChange}
            allEntityData={entityData}
          />
          <ThemeToggle />
        </div>
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            DevOps KPI Insight Engine
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AI-Powered Performance Analytics for DevOps Platform Engineers, Squads, and Teams
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <FilterSection
        selectedEntity={selectedEntity}
        selectedEntityValue={selectedEntityValue}
        selectedTimeRange={selectedTimeRange}
        onEntityChange={setSelectedEntity}
        onEntityValueChange={setSelectedEntityValue}
        onTimeRangeChange={setSelectedTimeRange}
        onGenerateReport={handleGenerateReport}
        entityData={entityData}
        onEntityDataChange={handleEntityDataChange}
        isLoading={isLoading}
      />

      {reportGenerated && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              description="CSAT rating 4-5 stars"
              variant="success"
              icon={<ThumbsUp className="h-5 w-5" />}
            />
            <KPICard
              title="Dissatisfaction Rate"
              value={6}
              unit="%"
              target={5}
              description="DSAT rating 1-2 stars"
              variant="warning"
              icon={<AlertCircle className="h-5 w-5" />}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamPerformanceChart
              data={sampleTeamData}
              title={getEntityTitle()}
              onBarClick={handleIndividualBarClick}
            />
            <SurveyAnalysisChart
              data={sampleSurveyData}
              title="Customer Satisfaction Distribution"
              totalSurveys={currentData.totalSurveys}
              onPieClick={(data) => handleChartClick(data, 'survey', 'Customer Satisfaction')}
            />
          </div>

          {/* Insights Panel */}
          <InsightsPanel
            insights={sampleInsights}
            onScrubCases={handleScrubCases}
            onAnalyzeEmails={handleAnalyzeEmails}
            isLoading={isLoading}
          />
        </>
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