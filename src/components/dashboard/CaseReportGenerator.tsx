import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, TrendingUp, Users, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { webhookService } from '@/lib/webhookService';
import { n8nWorkflowService, CaseReportParams, CaseData, SCTReport } from '@/lib/n8nWorkflowService';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CaseReportGeneratorProps {
  selectedEntity: string;
  selectedEntityType: string;
  selectedTimeRange: { from: Date | undefined; to: Date | undefined };
  entityMappings: any;
}

const CaseReportGenerator: React.FC<CaseReportGeneratorProps> = ({
  selectedEntity,
  selectedEntityType,
  selectedTimeRange,
  entityMappings
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<{
    cases: CaseData[];
    sctReport: SCTReport[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<{ isActive: boolean; lastExecution?: string }>({ isActive: false });
  const [webhookStatus, setWebhookStatus] = useState<{ reachable: boolean; message: string } | null>(null);

  useEffect(() => {
    checkWorkflowStatus();
    checkWebhookStatus();
    
    // Check status every 2 minutes to avoid spamming webhook checks
    const interval = setInterval(() => {
      checkWorkflowStatus();
      checkWebhookStatus();
    }, 120000); // 2 minutes instead of 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const checkWorkflowStatus = async () => {
    try {
      const status = await n8nWorkflowService.getWorkflowStatus();
      setWorkflowStatus(status);
    } catch (error) {
      console.error('Failed to check workflow status:', error);
    }
  };

  const checkWebhookStatus = async () => {
    try {
      const status = await webhookService.checkWebhookStatus();
      setWebhookStatus(status);
    } catch (error) {
      console.error('Failed to check webhook status:', error);
      setWebhookStatus({ reachable: false, message: 'Failed to check webhook' });
    }
  };

  const canGenerateReport = () => {
    return selectedEntity && 
           selectedEntityType && 
           selectedTimeRange.from && 
           selectedTimeRange.to;
  };

  const generateReport = async () => {
    console.log('🚀 GENERATE REPORT BUTTON CLICKED!');
    console.log('Selected Entity:', selectedEntity);
    console.log('Selected Entity Type:', selectedEntityType);
    console.log('Selected Time Range:', selectedTimeRange);
    console.log('Can Generate Report:', canGenerateReport());
    
    if (!canGenerateReport()) {
      console.log('❌ Cannot generate report - validation failed');
      setError('Please select an entity and date range');
      toast({
        title: "Invalid Selection",
        description: "Please select an entity and date range before generating the report.",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Validation passed, starting report generation...');
    setIsGenerating(true);
    setError(null);

    try {
      console.log('📞 About to call webhookService.triggerCaseReportWorkflow...');
      console.log('Parameters:', {
        entityType: selectedEntityType,
        entityName: selectedEntity,
        dateRange: {
          from: selectedTimeRange.from,
          to: selectedTimeRange.to
        },
        entityMappings: entityMappings
      });
      
      // Use webhook service to trigger n8n workflow
      const result = await webhookService.triggerCaseReportWorkflow(
        selectedEntityType as 'dpe' | 'squad' | 'team',
        selectedEntity,
        {
          from: selectedTimeRange.from!,
          to: selectedTimeRange.to!
        },
        entityMappings
      );

      if (result.success) {
        toast({
          title: "Report Generation Started",
          description: result.message,
        });
        
        // For now, we'll show a message that the workflow is running
        // In a real implementation, you might want to poll for results
        setReportData({
          cases: [],
          sctReport: []
        });
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      setError(errorMessage);
      
      toast({
        title: "Report Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getTotalCases = () => reportData?.cases.length || 0;
  const getAverageSCT = () => {
    if (!reportData?.sctReport.length) return 0;
    const totalSct = reportData.sctReport.reduce((sum, item) => sum + item.sct, 0);
    return Math.round((totalSct / reportData.sctReport.length) * 100) / 100;
  };

  const getStatusDistribution = () => {
    if (!reportData?.cases) return {};
    return reportData.cases.reduce((acc, case_) => {
      acc[case_.status] = (acc[case_.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getPriorityDistribution = () => {
    if (!reportData?.cases) return {};
    return reportData.cases.reduce((acc, case_) => {
      acc[case_.priority] = (acc[case_.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  return (
    <div className="space-y-4">
      {/* Report Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Case Report Generator
          </CardTitle>
          <CardDescription>
            Generate detailed case reports using n8n workflow integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Selection Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selected Entity</label>
                <div className="p-2 bg-muted rounded-md">
                  {selectedEntity ? (
                    <span className="font-medium">
                      {selectedEntityType?.toUpperCase()}: {selectedEntity}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No entity selected</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <div className="p-2 bg-muted rounded-md">
                  {selectedTimeRange.from && selectedTimeRange.to ? (
                    <span className="text-sm">
                      {format(selectedTimeRange.from, 'MMM dd, yyyy')} - {format(selectedTimeRange.to, 'MMM dd, yyyy')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">No date range selected</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">N8n Workflow Status</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={checkWorkflowStatus}
                    className="h-6 px-2 text-xs"
                  >
                    <Loader2 className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {workflowStatus.isActive ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Webhook Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Webhook Connection</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkWebhookStatus}
                  className="h-6 px-2 text-xs"
                >
                  Check
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {webhookStatus?.reachable ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
                {webhookStatus?.message && (
                  <span className="text-xs text-muted-foreground">
                    {webhookStatus.message}
                  </span>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <div className="flex gap-2">
              <Button 
                onClick={generateReport} 
                disabled={!canGenerateReport() || isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={checkWorkflowStatus}>
                Check N8n Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Case Report Results</CardTitle>
            <CardDescription>
              Report generated for {selectedEntityType?.toUpperCase()}: {selectedEntity}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sct">SCT Analysis</TabsTrigger>
                <TabsTrigger value="cases">Case Details</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Cases</p>
                          <p className="text-2xl font-bold">{getTotalCases()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Avg SCT</p>
                          <p className="text-2xl font-bold">{getAverageSCT()} days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Engineers</p>
                          <p className="text-2xl font-bold">{reportData.sctReport.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Resolution Rate</p>
                          <p className="text-2xl font-bold">100%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Status and Priority Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(getStatusDistribution()).map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center">
                            <Badge variant="outline">{status}</Badge>
                            <span className="font-medium">{count} cases</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Priority Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(getPriorityDistribution()).map(([priority, count]) => (
                          <div key={priority} className="flex justify-between items-center">
                            <Badge 
                              variant={priority === 'High' ? 'destructive' : priority === 'Medium' ? 'default' : 'secondary'}
                            >
                              {priority}
                            </Badge>
                            <span className="font-medium">{count} cases</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* SCT Analysis Tab */}
              <TabsContent value="sct" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Solution Cycle Time (SCT) by Engineer</CardTitle>
                    <CardDescription>
                      Average case resolution time for each engineer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Engineer</TableHead>
                          <TableHead>SCT (Days)</TableHead>
                          <TableHead>Cases Handled</TableHead>
                          <TableHead>Performance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.sctReport.map((engineer) => (
                          <TableRow key={engineer.owner_full_name}>
                            <TableCell className="font-medium">{engineer.owner_full_name}</TableCell>
                            <TableCell>{engineer.sct}</TableCell>
                            <TableCell>{engineer.case_count}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={engineer.sct <= 5 ? 'default' : engineer.sct <= 10 ? 'secondary' : 'destructive'}
                              >
                                {engineer.sct <= 5 ? 'Excellent' : engineer.sct <= 10 ? 'Good' : 'Needs Improvement'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Case Details Tab */}
              <TabsContent value="cases" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Case Details</CardTitle>
                    <CardDescription>
                      Individual case information and resolution times
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Case ID</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Closed</TableHead>
                          <TableHead>Age (Days)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.cases.map((case_) => (
                          <TableRow key={case_.case_id}>
                            <TableCell className="font-medium">{case_.case_id}</TableCell>
                            <TableCell>{case_.owner_full_name}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={case_.priority === 'High' ? 'destructive' : case_.priority === 'Medium' ? 'default' : 'secondary'}
                              >
                                {case_.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{case_.status}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(case_.created_date)}</TableCell>
                            <TableCell>{formatDate(case_.closed_date)}</TableCell>
                            <TableCell>{case_.case_age_days}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Powered Insights</CardTitle>
                    <CardDescription>
                      Analysis and recommendations based on case data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Performance Summary:</strong> The selected {selectedEntityType} has an average SCT of {getAverageSCT()} days across {getTotalCases()} cases.
                        </AlertDescription>
                      </Alert>

                      <Alert>
                        <Users className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Team Insights:</strong> {reportData.sctReport.length} engineer(s) handled cases during this period. 
                          Consider workload distribution for optimal performance.
                        </AlertDescription>
                      </Alert>

                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Recommendation:</strong> For detailed sentiment analysis and case hand-off insights, 
                          use the AI Agent chat feature with the generated case data.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CaseReportGenerator;