import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, CheckCircle, Info, TrendingUp, Clock, ThumbsUp, 
  ChevronDown, ChevronRight, Lightbulb, Mail, AlertCircle,
  BarChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'improvement' | 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  recommendation?: string;
  member?: string;
  category?: string;
  caseId?: string; // Added to track which case this insight belongs to
  caseTitle?: string; // Added to store the case title for display
}

interface InsightsPanelProps {
  insights: Insight[];
  onAnalyzeSCT: () => void;
  onCXInsight: () => void;
  sctAnalyzed: boolean;
  cxAnalyzed: boolean;
  selectedEntity: string;
  generatedEntity?: string;
  generatedEntityValue?: string;
  isLoading?: boolean;
  isAnalysisEnabled?: boolean;
}

// Function to extract case ID from insight title if present
const extractCaseId = (insight: Insight): string | null => {
  // If we have a caseId property, use that first (this should be the primary source)
  if (insight.caseId) {
    return insight.caseId;
  }
  
  // Look for case ID in title (e.g., "Email Communication Analysis: Case TM-03653642" or "Case 12345")
  const caseMatch = insight.title.match(/Case ([A-Z]{2}-\d{8}|[A-Z]+-\d+|\d+)/i);
  if (caseMatch && caseMatch[1]) {
    return caseMatch[1];
  }
  
  return null;
};

// Function to get insight type based on category
const getInsightType = (insight: Insight): 'email' | 'delay' | 'summary' | 'other' => {
  if (insight.title.toLowerCase().includes('email communication')) {
    return 'email';
  }
  if (insight.title.toLowerCase().includes('delay analysis')) {
    return 'delay';
  }
  if (insight.title.toLowerCase().includes('summary')) {
    return 'summary';
  }
  return 'other';
};

const InsightsPanel: React.FC<InsightsPanelProps> = ({ 
  insights, 
  onAnalyzeSCT, 
  onCXInsight,
  sctAnalyzed,
  cxAnalyzed,
  selectedEntity,
  generatedEntity = '',
  generatedEntityValue = '',
  isLoading = false,
  isAnalysisEnabled = false
}) => {
  const [sctOpen, setSctOpen] = useState(true); // Auto-expand SCT section by default
  const [cxOpen, setCxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Helper function to format text with bullet points for better readability
  const formatTextWithBullets = (text: string, label: string = 'Recommendation') => {
    // Check if text contains 'Areas for improvement:' or 'Strengths:' patterns
    const hasAreasForImprovement = text.includes('Areas for improvement:');
    const hasStrengths = text.includes('Strengths:');
    
    // If we have these special sections, format them separately
    if (hasAreasForImprovement || hasStrengths) {
      const sections = [];
      
      // Handle Areas for improvement
      if (hasAreasForImprovement) {
        const improvementMatch = text.match(/Areas for improvement:(.*?)(?=Strengths:|$)/s);
        if (improvementMatch && improvementMatch[1]) {
          const improvementItems = improvementMatch[1]
            .trim()
            .split(/\.,\s*|\,\s+(?=[A-Z])/)
            .map(item => item.trim().replace(/^,\s*/, '').replace(/\.$/, ''))
            .filter(item => item.length > 0);
          sections.push(
            <div key="improvements" className="mb-3">
              <strong className="text-sm text-foreground">Areas for improvement:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                {improvementItems.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    {item}{!item.endsWith('.') ? '.' : ''}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      }
      
      // Handle Strengths
      if (hasStrengths) {
        const strengthsMatch = text.match(/Strengths:(.*?)$/s);
        if (strengthsMatch && strengthsMatch[1]) {
          const strengthItems = strengthsMatch[1]
            .trim()
            .split(/\.,\s*|\,\s+(?=[A-Z])/)
            .map(item => item.trim().replace(/^,\s*/, '').replace(/\.$/, ''))
            .filter(item => item.length > 0);
          sections.push(
            <div key="strengths" className="mt-2">
              <strong className="text-sm text-foreground">Strengths:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                {strengthItems.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    {item}{!item.endsWith('.') ? '.' : ''}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      }
      
      return <div className="text-sm text-foreground">{sections}</div>;
    }
    
    // Standard bullet point formatting for other cases
    // Split by newlines and filter out empty lines
    const lines = text.split('\n').filter(line => line.trim());
    
    // If there's only one line or no splitting needed, return as single paragraph
    if (lines.length <= 1) {
      return (
        <p className="text-sm text-foreground">
          <strong>{label}:</strong> {text}
        </p>
      );
    }
    
    // If multiple lines, format as bullet points
    return (
      <div className="text-sm text-foreground">
        <strong>{label}s:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
          {lines.map((line, index) => (
            <li key={index} className="text-sm">
              {line.trim()}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Helper function to format descriptions - break long sentences into bullet points
  const formatDescription = (description: string) => {
    // Check if description is very long (over 200 characters) and contains sentence patterns
    if (description.length > 200 && (description.includes('. ') || description.includes(', '))) {
      // Split by sentences and major clause separators
      const sentences = description
        .split(/\.\s+|\,\s+(?=The|Although|However|During|In|Customer|Engineer|Support)/)
        .filter(sentence => sentence.trim().length > 10)
        .map(sentence => sentence.trim().replace(/\.$/, '') + (sentence.trim().endsWith('.') ? '' : '.'));
      
      // If we got multiple meaningful sentences, format as bullets
      if (sentences.length > 1) {
        return (
          <div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              {sentences.map((sentence, index) => (
                <li key={index}>
                  {sentence}
                </li>
              ))}
            </ul>
          </div>
        );
      }
    }
    
    // Return as normal paragraph if not suitable for bullet formatting
    return <p>{description}</p>;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement':
        return <ArrowUpRight className="h-4 w-4 text-kpi-warning" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-kpi-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-kpi-warning" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-kpi-danger" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getInsightBadgeVariant = (type: string) => {
    switch (type) {
      case 'improvement':
        return 'warning' as const;
      case 'success':
        return 'success' as const;
      case 'warning':
        return 'warning' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  // Filter insights by category from passed props - only show when analysis is performed
  const sctInsights = sctAnalyzed ? insights.filter(insight => {
    const isSctRelated = insight.category?.toLowerCase().includes('performance') || 
      insight.category?.toLowerCase().includes('process') ||
      insight.category?.toLowerCase().includes('communication') ||
      insight.category?.toLowerCase().includes('trending') ||
      insight.category?.toLowerCase().includes('resource') ||
      insight.title.toLowerCase().includes('sct') ||
      insight.title.toLowerCase().includes('cycle time') ||
      insight.title.toLowerCase().includes('development') ||
      insight.title.toLowerCase().includes('testing') ||
      insight.title.toLowerCase().includes('sct analysis') ||
      insight.title.toLowerCase().includes('email communication') ||
      insight.title.toLowerCase().includes('process delay') ||
      insight.title.toLowerCase().includes('email') ||
      insight.title.toLowerCase().includes('delay');
    
    // Exclude satisfaction-related insights that should go to CX section
    const isSatisfactionRelated = insight.category?.toLowerCase().includes('satisfaction') ||
      insight.title.toLowerCase().includes('satisfaction') ||
      insight.title.toLowerCase().includes('csat') ||
      insight.title.toLowerCase().includes('dsat');
    
    return isSctRelated && !isSatisfactionRelated;
  }) : [];
  
  const cxInsights = cxAnalyzed ? insights.filter(insight => 
    insight.category?.toLowerCase().includes('satisfaction') ||
    insight.category?.toLowerCase().includes('feedback') ||
    insight.category?.toLowerCase().includes('customer') ||
    insight.category?.toLowerCase().includes('channel') ||
    insight.category?.toLowerCase().includes('efficiency') ||
    insight.category?.toLowerCase().includes('loyalty') ||
    insight.category?.toLowerCase().includes('survey') ||
    insight.category?.toLowerCase().includes('case-analysis') ||
    insight.category?.toLowerCase().includes('summary') ||
    insight.title.toLowerCase().includes('customer') ||
    insight.title.toLowerCase().includes('satisfaction') ||
    insight.title.toLowerCase().includes('csat') ||
    insight.title.toLowerCase().includes('dsat') ||
    insight.title.toLowerCase().includes('cx') ||
    insight.title.toLowerCase().includes('feedback') ||
    insight.title.toLowerCase().includes('survey') ||
    insight.title.toLowerCase().includes('case analysis')
  ) : [];

  // Organize SCT insights by case ID
  const organizedSctInsights = useMemo(() => {
    const summaryInsights = sctInsights.filter(insight => 
      insight.title.toLowerCase().includes('summary') || 
      insight.title.toLowerCase().includes('overview')
    );
    
    const nonSummaryInsights = sctInsights.filter(insight => 
      !insight.title.toLowerCase().includes('summary') && 
      !insight.title.toLowerCase().includes('overview')
    );

    // Group insights by case ID
    const caseMap: Record<string, Insight[]> = {};
    
    nonSummaryInsights.forEach(insight => {
      const caseId = extractCaseId(insight) || 'unknown';
      if (!caseMap[caseId]) {
        caseMap[caseId] = [];
      }
      caseMap[caseId].push(insight);
    });

    // For each case, separate by type (email communication or delay analysis)
    const cases: Record<string, { 
      caseId: string, 
      caseTitle?: string,
      emailInsights: Insight[], 
      delayInsights: Insight[], 
      otherInsights: Insight[] 
    }> = {};
    
    Object.entries(caseMap).forEach(([caseId, caseInsights]) => {
      // Only use case title from insights data - no fallbacks
      const caseTitle = caseInsights.find(i => i.caseTitle)?.caseTitle;
      
      cases[caseId] = {
        caseId,
        caseTitle,
        emailInsights: caseInsights.filter(i => getInsightType(i) === 'email'),
        delayInsights: caseInsights.filter(i => getInsightType(i) === 'delay'),
        otherInsights: caseInsights.filter(i => !['email', 'delay'].includes(getInsightType(i)))
      };
    });
    
    return {
      summary: summaryInsights,
      cases: Object.values(cases)
    };
  }, [sctInsights]);

  return (
    <div className="space-y-6">
      {/* Insights and Recommendations */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show message when no analysis has been performed */}
          {!sctAnalyzed && !cxAnalyzed && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="space-y-2">
                <p className="text-sm">Click the analysis buttons above to generate insights and recommendations</p>
                <div className="flex justify-center gap-2 text-xs">
                  <span className="bg-muted px-2 py-1 rounded">Analyze SCT</span>
                  <span>or</span>
                  <span className="bg-muted px-2 py-1 rounded">CX Insight</span>
                </div>
              </div>
            </div>
          )}

          {/* Solution Cycle Time Group - Only show when analyzed */}
          {sctAnalyzed && (
            <Collapsible open={sctOpen} onOpenChange={setSctOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Solution Cycle Time</span>
                  {organizedSctInsights.cases.length > 0 && (
                    <Badge variant="secondary">{organizedSctInsights.cases.length}</Badge>
                  )}
                </div>
                {sctOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                {sctInsights.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Click "Analyze SCT" to generate Solution Cycle Time insights
                  </div>
                ) : (
                  <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4 flex justify-start">
                      <TabsTrigger value="overview">Performance Summary</TabsTrigger>
                      <TabsTrigger value="cases">
                        Case Analysis
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Performance Summary Tab */}
                    <TabsContent value="overview" className="space-y-3">
                      {organizedSctInsights.summary.length > 0 ? (
                        <div>
                          <div className="mb-3 p-4 bg-primary-foreground/30 rounded-lg shadow-sm">
                            <h3 className="font-medium mb-3 text-base flex items-center gap-2 pb-2 border-b border-primary/20">
                              <BarChart className="h-5 w-5 text-primary" />
                              Performance Summary
                            </h3>
                            {organizedSctInsights.summary.map((insight) => (
                              <div key={insight.id} className="border-l-4 border-l-primary pl-4 py-4 bg-muted/20 rounded-r-lg mb-3 shadow-sm">
                                <div className="flex items-start gap-3">
                                  {getInsightIcon(insight.type)}
                                  <div className="flex-1 space-y-3 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-foreground">{insight.title.replace('SCT Analysis Summary', 'Performance Overview')}</h4>
                                      <Badge variant={getInsightBadgeVariant(insight.type)}>
                                        {insight.type}
                                      </Badge>
                                    </div>
                                    <div className="bg-background/50 p-3 rounded-md border border-border/50">
                                      {formatDescription(insight.description)}
                                    </div>
                                    {insight.recommendation && (
                                      <div className="bg-accent/5 border border-accent/20 rounded-md p-4 mt-3">
                                        {formatTextWithBullets(insight.recommendation, 'Action Item')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {organizedSctInsights.cases.length > 0 && (
                            <div className="p-3 bg-muted/20 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                We've found {organizedSctInsights.cases.length} case{organizedSctInsights.cases.length > 1 ? 's' : ''} that need attention. 
                                <a onClick={() => setActiveTab('cases')} className="text-primary cursor-pointer ml-1 hover:underline">
                                  View detailed case analysis →
                                </a>
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No performance summary available. Try analyzing more cases.
                        </div>
                      )}
                    </TabsContent>
                    
                    {/* Case Analysis Tab */}
                    <TabsContent value="cases" className="space-y-4">
                      {organizedSctInsights.cases.length > 0 ? (
                        <Tabs defaultValue={organizedSctInsights.cases[0]?.caseId || 'case-1'} className="w-full">
                          <TabsList className="mb-4 flex justify-start flex-wrap w-full">
                            {organizedSctInsights.cases.map((caseGroup) => (
                              <TabsTrigger key={caseGroup.caseId} value={caseGroup.caseId} className="text-xs whitespace-nowrap flex-1 max-w-fit">
                                {caseGroup.caseId}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          
                          {organizedSctInsights.cases.map((caseGroup) => (
                            <TabsContent key={caseGroup.caseId} value={caseGroup.caseId} className="space-y-4">
                              <div className="border border-border rounded-lg overflow-hidden">
                                {/* Case Content */}
                                <div className="p-4 space-y-6">
                                  {/* Email Communication Analysis */}
                                  {caseGroup.emailInsights.length > 0 && (
                                    <div className="border-l-4 border-l-amber-400 pl-4 py-3 bg-amber-50/10 rounded-r-lg shadow-sm">
                                      <h4 className="font-medium text-base flex items-center gap-2 mb-4 pb-2 border-b border-dashed border-amber-200/30">
                                        <Mail className="h-5 w-5 text-amber-500" />
                                        {caseGroup.caseId}{caseGroup.caseTitle ? `: ${caseGroup.caseTitle}` : ''}
                                      </h4>
                                      <h5 className="font-medium text-sm flex items-center gap-2 mb-3 text-amber-700">
                                        Email Communication Analysis
                                      </h5>
                                      {caseGroup.emailInsights.map((insight) => (
                                        <div key={insight.id} className="mb-6">
                                          <div className="space-y-4">
                                            {/* Analysis Section */}
                                            <div>
                                              <h6 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                {getInsightIcon(insight.type)}
                                                Analysis:
                                              </h6>
                                              <div className="ml-6 text-sm text-foreground">
                                                {formatDescription(insight.description)}
                                              </div>
                                            </div>
                                            
                                            {/* Recommendations Section */}
                                            {insight.recommendation && (
                                              <div>
                                                <h6 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                  <Lightbulb className="h-4 w-4 text-accent" />
                                                  Recommendations:
                                                </h6>
                                                <div className="ml-6 text-sm text-foreground">
                                                  <ul className="list-disc list-inside space-y-1">
                                                    {insight.recommendation.split('\n').map((rec, idx) => (
                                                      <li key={idx}>{rec.trim()}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Process Delay Analysis */}
                                  {caseGroup.delayInsights.length > 0 && (
                                    <div className="border-l-4 border-l-red-400 pl-4 py-3 bg-red-50/10 rounded-r-lg shadow-sm">
                                      <h4 className="font-medium text-base flex items-center gap-2 mb-4 pb-2 border-b border-dashed border-red-200/30">
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                        {caseGroup.caseId}{caseGroup.caseTitle ? `: ${caseGroup.caseTitle}` : ''}
                                      </h4>
                                      <h5 className="font-medium text-sm flex items-center gap-2 mb-3 text-red-700">
                                        Process Delay Analysis
                                      </h5>
                                      {caseGroup.delayInsights.map((insight) => (
                                        <div key={insight.id} className="mb-6">
                                          <div className="space-y-4">
                                            {/* Analysis Section */}
                                            <div>
                                              <h6 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                {getInsightIcon(insight.type)}
                                                Analysis:
                                              </h6>
                                              <div className="ml-6 text-sm text-foreground">
                                                {formatDescription(insight.description)}
                                              </div>
                                            </div>
                                            
                                            {/* Recommendations Section */}
                                            {insight.recommendation && (
                                              <div>
                                                <h6 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                  <Lightbulb className="h-4 w-4 text-accent" />
                                                  Recommendations:
                                                </h6>
                                                <div className="ml-6 text-sm text-foreground">
                                                  <ul className="list-disc list-inside space-y-1">
                                                    {insight.recommendation.split('\n').map((rec, idx) => (
                                                      <li key={idx}>{rec.trim()}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Other Insights */}
                                  {caseGroup.otherInsights.length > 0 && (
                                    <div className="border-l-4 border-l-primary pl-4 py-3 bg-primary-foreground/10 rounded-r-lg shadow-sm">
                                      <h4 className="font-medium text-base flex items-center gap-2 mb-4 pb-2 border-b border-dashed border-primary/30">
                                        <Info className="h-5 w-5 text-primary" />
                                        Additional Insights
                                      </h4>
                                      {caseGroup.otherInsights.map((insight) => (
                                        <div key={insight.id} className="mb-4">
                                          <div className="flex-1 space-y-4 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                              <h5 className="text-sm text-foreground font-medium">{insight.title}</h5>
                                              <Badge variant={getInsightBadgeVariant(insight.type)}>
                                                {insight.type}
                                              </Badge>
                                            </div>
                                            <div className="bg-primary-foreground/10 rounded-md p-4">
                                              {formatDescription(insight.description)}
                                            </div>
                                            {insight.recommendation && (
                                              <div className="bg-accent/10 border-l-2 border-l-accent rounded-r-md p-4 mt-2 shadow-sm">
                                                <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                  <Lightbulb className="h-4 w-4 text-accent" />
                                                  Recommendations:
                                                </h5>
                                                <ul className="list-disc list-inside space-y-1 text-sm">
                                                  {insight.recommendation.split('\n').map((rec, idx) => (
                                                    <li key={idx}>{rec.trim()}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No case-specific insights available.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Customer Satisfaction Group - Only show when analyzed */}
          {cxAnalyzed && (
            <Collapsible open={cxOpen} onOpenChange={setCxOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-primary" />
                  <span className="font-medium">Customer Satisfaction</span>
                  {cxInsights.length > 0 && (
                    <Badge variant="secondary">{cxInsights.length}</Badge>
                  )}
                </div>
                {cxOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                {cxInsights.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Click "CX Insight" to generate Customer Satisfaction insights
                  </div>
                ) : (
                  cxInsights.map((insight) => (
                    <div key={insight.id} className="border-l-4 border-l-primary pl-4 py-3 bg-muted/20 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{insight.title}</h4>
                            <Badge variant={getInsightBadgeVariant(insight.type)}>
                              {insight.type}
                            </Badge>
                          </div>
                          {formatDescription(insight.description)}
                          {insight.recommendation && (
                            <div className="bg-accent/10 border border-accent/20 rounded-md p-3 mt-2">
                              {formatTextWithBullets(insight.recommendation, 'Recommendation')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsPanel;