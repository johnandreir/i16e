import React, { useState } from 'react';
import { Clock, Users, ThumbsUp, AlertCircle, BarChart3, TrendingUp } from 'lucide-react';
import FilterSection from '@/components/dashboard/FilterSection';
import KPICard from '@/components/dashboard/KPICard';
import TeamPerformanceChart from '@/components/dashboard/TeamPerformanceChart';
import SurveyAnalysisChart from '@/components/dashboard/SurveyAnalysisChart';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [selectedEntity, setSelectedEntity] = useState('dpe');
  const [selectedEntityValue, setSelectedEntityValue] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Sample data - in real implementation, this would come from D365 API
  const sampleTeamData = [
    { name: 'Juan D.', sct: 16, cases: 45, satisfaction: 87 },
    { name: 'Maria S.', sct: 12, cases: 52, satisfaction: 92 },
    { name: 'Carlos R.', sct: 20, cases: 38, satisfaction: 78 },
    { name: 'Ana G.', sct: 14, cases: 48, satisfaction: 89 },
    { name: 'Miguel T.', sct: 18, cases: 41, satisfaction: 85 },
  ];

  const sampleSurveyData = [
    { name: 'Satisfied (4-5)', value: 156, percentage: 78, color: 'hsl(var(--kpi-success))' },
    { name: 'Neutral (3)', value: 32, percentage: 16, color: 'hsl(var(--kpi-warning))' },
    { name: 'Dissatisfied (1-2)', value: 12, percentage: 6, color: 'hsl(var(--kpi-danger))' },
  ];

  const sampleInsights = [
    {
      id: '1',
      type: 'improvement' as const,
      title: 'Carlos Rodriguez - High SCT',
      description: 'Carlos has the highest Solution Cycle Time at 20 days, 25% above team average.',
      recommendation: 'Review case complexity and provide additional training on efficient troubleshooting techniques.',
      member: 'Carlos R.'
    },
    {
      id: '2',
      type: 'success' as const,
      title: 'Maria Santos - Top Performer',
      description: 'Maria consistently delivers excellent results with 12-day SCT and 92% CSAT.',
      recommendation: 'Consider having Maria mentor team members with higher SCT.',
      member: 'Maria S.'
    },
    {
      id: '3',
      type: 'warning' as const,
      title: 'Case Handoff Issues Detected',
      description: 'Analysis shows 15% of cases have multiple handoffs, increasing resolution time.',
      recommendation: 'Implement better case routing and ownership protocols.'
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

  const getEntityTitle = () => {
    switch (selectedEntity) {
      case 'dpe':
        return 'DevOps Platform Engineer';
      case 'squad':
        return 'Squad';
      case 'team':
        return 'Team';
      default:
        return 'Entity';
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          DevOps KPI Insight Engine
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          AI-Powered Performance Analytics for DevOps Platform Engineers, Squads, and Teams
        </p>
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
        isLoading={isLoading}
      />

      {reportGenerated && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Solution Cycle Time"
              value={selectedEntity === 'dpe' ? 16 : 15.2}
              unit="days"
              trend="down"
              trendValue="12%"
              description="Average time to resolve cases"
              variant="success"
              icon={<Clock className="h-5 w-5" />}
            />
            <KPICard
              title="Customer Satisfaction"
              value={selectedEntity === 'dpe' ? 87 : 86}
              unit="%"
              trend="up"
              trendValue="5%"
              description="CSAT rating 4-5 stars"
              variant="success"
              icon={<ThumbsUp className="h-5 w-5" />}
            />
            <KPICard
              title="Cases Handled"
              value={selectedEntity === 'dpe' ? 45 : 224}
              trend="up"
              trendValue="8%"
              description="Total cases this period"
              variant="default"
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <KPICard
              title="Dissatisfaction Rate"
              value={6}
              unit="%"
              trend="down"
              trendValue="3%"
              description="DSAT rating 1-2 stars"
              variant="warning"
              icon={<AlertCircle className="h-5 w-5" />}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedEntity !== 'dpe' && (
              <TeamPerformanceChart
                data={sampleTeamData}
                title={`${getEntityTitle()} Performance Breakdown`}
              />
            )}
            <SurveyAnalysisChart
              data={sampleSurveyData}
              title="Customer Satisfaction Distribution"
              totalSurveys={200}
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
    </div>
  );
};

export default Index;
