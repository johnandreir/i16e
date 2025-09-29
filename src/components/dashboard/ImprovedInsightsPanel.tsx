import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatRecommendation } from '@/lib/formatHelpers';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, CheckCircle, Info, TrendingUp, Clock, ThumbsUp, 
  ChevronDown, ChevronRight, Lightbulb, Mail, AlertCircle,
  BarChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { EMOJIS } from '@/components/EmojiIcons';

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
  surveyType?: string; // Added to store the type of survey (CSAT, DSAT, etc.)
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

// Define the CaseGroup interface above the organizedCxInsights function
interface CaseGroup {
  caseId: string;
  caseTitle?: string;
  surveyType?: string;
  emailInsights: Insight[];
  delayInsights: Insight[];
  otherInsights: Insight[];
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

// Function to determine the type of insight based on its category or title
function getInsightType(insight: Insight): string {
  if (insight.title.toLowerCase().includes('email communication')) {
    return 'email';
  }
  if (insight.title.toLowerCase().includes('delay analysis')) {
    return 'delay';
  }
  return 'other';
}

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
  const [activeSctTab, setActiveSctTab] = useState<string>('overview');
  const [activeCxTab, setActiveCxTab] = useState<string>('overview');

  // Helper function to format text with bullet points for better readability
  const formatTextWithBullets = (text: string, label: string = 'Recommendation') => {
    // Check if text contains 'Areas for improvement:' or 'Strengths:' patterns
    const hasAreasForImprovement = text.includes('Areas for improvement:');
    const hasStrengths = text.includes('Strengths:');
    
    // If we have these special sections, format them separately
    if (hasAreasForImprovement || hasStrengths) {
      const sections = [];
      
      // Handle Strengths first
      if (hasStrengths) {
        const strengthsMatch = text.match(/Strengths:(.*?)(?=Areas for improvement:|$)/s);
        if (strengthsMatch && strengthsMatch[1]) {
          const strengthItems = strengthsMatch[1]
            .trim()
            .split(/\.,\s*|\,\s+(?=[A-Z])/)
            .map(item => item.trim().replace(/^,\s*/, '').replace(/\.$/, ''))
            .filter(item => item.length > 0);
          sections.push(
            <div key="strengths" className="mb-3">
              <strong className="text-sm font-medium text-green-600 dark:text-green-400">{EMOJIS.MUSCLE} Strengths:</strong>
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
      
      // Handle Areas for improvement
      if (hasAreasForImprovement) {
        const areasMatch = text.match(/Areas for improvement:(.*?)(?=Strengths:|$)/s);
        if (areasMatch && areasMatch[1]) {
          const areaItems = areasMatch[1]
            .trim()
            .split(/\.,\s*|\,\s+(?=[A-Z])/)
            .map(item => item.trim().replace(/^,\s*/, '').replace(/\.$/, ''))
            .filter(item => item.length > 0);
          sections.push(
            <div key="areas" className="mt-2">
              <strong className="text-sm font-medium text-amber-600 dark:text-amber-400">{EMOJIS.TARGET} Areas for improvement:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                {areaItems.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    {item}{!item.endsWith('.') ? '.' : ''}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      }
      
      return <div className="text-sm text-foreground dark:text-foreground">{sections}</div>;
    }
    
    // Standard bullet point formatting for other cases
    // Split by newlines and filter out empty lines
    const lines = text.split('\n').filter(line => line.trim()).map(line => formatRecommendation(line));
    
    // If there's only one line or no splitting needed, return as single paragraph
    if (lines.length <= 1) {
      return (
        <p className="text-sm text-foreground">
          {label && <><strong>{label}:</strong> </>}{text}
        </p>
      );
    }
    
    // If multiple lines, format as bullet points
    return (
      <div className="text-sm text-foreground dark:text-foreground">
        {label && <strong>{label}s:</strong>}
        <ul className={`list-disc list-inside space-y-1 ml-2 ${label ? 'mt-2' : ''}`}>
          {lines.map((line, index) => (
            <li key={index} className="text-sm">
              {/* Remove bullet characters if they already exist at the start of the line */}
              {line.trim().replace(/^[•\-\*]\s+/, '')}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Helper function to format descriptions - handle strengths/areas format and bullet points
  const formatDescription = (description: string) => {
    // Check if description contains strengths and areas for improvement format
    const hasStrengthsFormat = (description.includes(`${EMOJIS.CHECK} Strengths identified:`) || description.includes(`${EMOJIS.MUSCLE} Strengths identified:`)) && description.includes(`${EMOJIS.TARGET} Areas for improvement:`);
    
    if (hasStrengthsFormat) {
      // Split the description into parts
      const parts = description.split(new RegExp(`(?=${EMOJIS.CHECK} Strengths identified:|${EMOJIS.TARGET} Areas for improvement:)`));
      const mainText = parts[0]?.trim();
      const strengthsPart = parts.find(p => p.includes(`${EMOJIS.CHECK} Strengths identified:`));
      const areasPart = parts.find(p => p.includes(`${EMOJIS.TARGET} Areas for improvement:`));
      
      return (
        <div className="space-y-3">
          {/* Main description */}
          {mainText && <p className="text-sm">{mainText}</p>}
          
          {/* Strengths section - displayed first */}
          {strengthsPart && (
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">{EMOJIS.MUSCLE} Strengths identified:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                {strengthsPart
                  .replace(`${EMOJIS.CHECK} Strengths identified:`, '')
                  .replace(`${EMOJIS.MUSCLE} Strengths identified:`, '')
                  .split(/•/)
                  .filter(item => item.trim().length > 0)
                  .map((item, idx) => (
                    <li key={idx} className="text-sm">
                      {item.trim().replace(/^\s*•\s*/, '')}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          
          {/* Areas for improvement section - displayed after strengths */}
          {areasPart && (
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">{EMOJIS.TARGET} Areas for improvement:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                {areasPart
                  .replace(`${EMOJIS.TARGET} Areas for improvement:`, '')
                  .split(/•/)
                  .filter(item => item.trim().length > 0)
                  .map((item, idx) => (
                    <li key={idx} className="text-sm">
                      {item.trim().replace(/^\s*•\s*/, '')}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
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
    const cases: CaseGroup[] = Object.entries(caseMap).map(([caseId, insights]) => {
      // Find the survey type from the first insight that has it
      const surveyType = insights.find(insight => insight.surveyType)?.surveyType || '';
      
      return {
        caseId,
        caseTitle: insights[0]?.caseTitle || '',
        surveyType,
        emailInsights: insights.filter(i => getInsightType(i) === 'email'),
        delayInsights: insights.filter(i => getInsightType(i) === 'delay'),
        otherInsights: insights.filter(i => !['email', 'delay'].includes(getInsightType(i)))
      };
    });
    
    return {
      summary: summaryInsights,
      cases
    };
  }, [sctInsights]);

  // Organize CX insights into summary and case-specific analysis
  const organizedCxInsights = useMemo(() => {
    // Filter for summary insights (overview, summary, etc.)
    const summaryInsights = cxInsights.filter(insight => 
      insight.title.toLowerCase().includes('summary') || 
      insight.title.toLowerCase().includes('overview') ||
      insight.title.toLowerCase().includes('dpe customer survey summary')
    );
    
    // Filter for case-specific insights
    const caseSpecificInsights = cxInsights.filter(insight => 
      (insight.category?.toLowerCase().includes('case-analysis') ||
       insight.title.toLowerCase().includes('case analysis'))
    );

    // Group case-specific insights by case ID
    const caseMap: Record<string, Insight[]> = {};
    
    caseSpecificInsights.forEach(insight => {
      const caseId = extractCaseId(insight) || 'unknown';
      if (!caseMap[caseId]) {
        caseMap[caseId] = [];
      }
      caseMap[caseId].push(insight);
    });

    // Create case groups with case titles and survey type
    const cases = Object.entries(caseMap).map(([caseId, insights]) => {
      // Find the survey type from the first insight that has it
      const surveyType = insights.find(insight => insight.surveyType)?.surveyType || '';
      
      return {
        caseId,
        caseTitle: insights[0]?.caseTitle || '',
        surveyType,
        insights
      };
    });

    return {
      summary: summaryInsights,
      cases,
      surveysAnalyzed: cxInsights.filter(insight => 
        insight.title.toLowerCase().includes('survey') ||
        insight.category?.toLowerCase().includes('survey')
      ).length
    };
  }, [cxInsights]);

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
                <p className="text-sm">Click on chart elements to open detailed views with analysis options</p>
                <div className="flex justify-center gap-2 text-xs">
                  <span className="bg-muted px-2 py-1 rounded">Analyze SCT</span>
                  <span>or</span>
                  <span className="bg-muted px-2 py-1 rounded">Analyze Survey</span>
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
                  <Tabs defaultValue="overview" className="w-full" value={activeSctTab} onValueChange={setActiveSctTab}>
                    <TabsList className="mb-4 flex justify-start">
                      <TabsTrigger value="overview">Performance Summary</TabsTrigger>
                      <TabsTrigger value="cases">
                        SCT Analysis
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Performance Summary Tab */}
                    <TabsContent value="overview" className="space-y-3">
                      {organizedSctInsights.summary.length > 0 ? (
                        <div>
                          <div className="mb-3 p-4 bg-background/50 dark:bg-background/80 rounded-lg shadow-sm border border-border/50">
                            <h3 className="font-medium mb-3 text-base flex items-center gap-2 pb-2 border-b border-muted-foreground/20">
                              <BarChart className="h-5 w-5 text-primary" />
                              Performance Summary
                            </h3>
                            {organizedSctInsights.summary.map((insight) => (
                              <div key={insight.id} className="border-l-4 border-l-primary pl-4 py-4 bg-background/50 dark:bg-background/80 rounded-r-lg mb-3 shadow-sm">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-foreground">{insight.title.replace('SCT Analysis Summary', 'Performance Overview')}</h4>
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
                            ))}
                          </div>
                          {organizedSctInsights.cases.length > 0 && (
                            <div className="p-3 bg-background/50 dark:bg-background/80 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                We've found {organizedSctInsights.cases.length} case{organizedSctInsights.cases.length > 1 ? 's' : ''} that need attention. 
                                <a onClick={() => setActiveSctTab('cases')} className="text-primary cursor-pointer ml-1 hover:underline">
                                  View detailed SCT analysis →
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
                                {/* Main Case Header */}
                                <div className="p-4 bg-muted/10 border-b border-border">
                                  <h3 className="font-medium text-base flex items-center gap-2">
                                    {EMOJIS.CASE} {caseGroup.caseId}{caseGroup.surveyType ? ` (${caseGroup.surveyType})` : ''}{caseGroup.caseTitle ? `: ${caseGroup.caseTitle}` : ''}
                                  </h3>
                                </div>
                                
                                {/* Case Content */}
                                <div className="p-4 space-y-3">
                                  {/* Email Communication Analysis */}
                                  {caseGroup.emailInsights.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="font-medium text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400 pb-1">
                                        {EMOJIS.EMAIL} Email Communication Analysis
                                      </h4>
                                      {caseGroup.emailInsights.map((insight) => (
                                        <div key={insight.id} className="border-l-4 border-l-amber-400 pl-4 py-3 bg-background/50 dark:bg-background/20 rounded-r-lg shadow-sm">
                                          <div className="space-y-4">
                                            {/* Analysis Section */}
                                            <div>
                                              <h6 className="text-sm font-medium mb-1 flex items-center gap-2 text-foreground dark:text-foreground">
                                                {EMOJIS.MAGNIFYING_GLASS} Analysis:
                                              </h6>
                                              <div className="text-sm text-foreground dark:text-foreground ml-6">
                                                <ul className="list-disc ml-4">
                                                  {formatDescription(insight.description)}
                                                </ul>
                                              </div>
                                            </div>
                                            
                                            {/* Recommendations Section */}
                                            {insight.recommendation && (
                                              <div>
                                                <h6 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                  <Lightbulb className="h-4 w-4 text-accent" />
                                                  Recommendations:
                                                </h6>
                                                <div className="text-sm text-foreground dark:text-foreground">
                                                  {formatTextWithBullets(insight.recommendation, '')}
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
                                    <div className="space-y-2">
                                      <h4 className="font-medium text-sm flex items-center gap-2 text-red-600 dark:text-red-400 pb-1">
                                        {EMOJIS.DELAY} Process Delay Analysis
                                      </h4>
                                      {caseGroup.delayInsights.map((insight) => (
                                        <div key={insight.id} className="border-l-4 border-l-amber-400 pl-4 py-2 bg-background/50 dark:bg-background/20 rounded-r-lg shadow-sm">
                                          <div className="space-y-2">
                                            {/* Analysis Section */}
                                            <div>
                                              <h6 className="text-sm font-medium mb-1 flex items-center gap-2 text-foreground dark:text-foreground">
                                                {EMOJIS.MAGNIFYING_GLASS} Analysis:
                                              </h6>
                                              <div className="text-sm text-foreground dark:text-foreground ml-6">
                                                <ul className="list-disc ml-4">
                                                  {formatDescription(insight.description)}
                                                </ul>
                                              </div>
                                            </div>
                                            
                                            {/* Recommendations Section */}
                                            {insight.recommendation && (
                                              <div>
                                                <h6 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                  <Lightbulb className="h-4 w-4 text-accent" />
                                                  Recommendations:
                                                </h6>
                                                <div className="text-sm text-foreground dark:text-foreground">
                                                  {formatTextWithBullets(insight.recommendation, '')}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Additional Insights */}
                                  {caseGroup.otherInsights.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="font-medium text-sm flex items-center gap-2 text-primary pb-1">
                                        {EMOJIS.INFO} Additional Insights
                                      </h4>
                                      {caseGroup.otherInsights.map((insight) => (
                                        <div key={insight.id} className="border-l-4 border-l-primary pl-4 py-2 bg-background/50 dark:bg-background/80 rounded-r-lg shadow-sm border border-border/50">
                                          <div className="space-y-2">
                                            {/* Analysis Section */}
                                            <div>
                                              <h6 className="text-sm font-medium mb-1 flex items-center gap-2 text-foreground dark:text-foreground">
                                                {EMOJIS.MAGNIFYING_GLASS} Analysis:
                                              </h6>
                                              <div className="text-sm text-foreground dark:text-foreground ml-6">
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
                                                <div className="text-sm text-foreground dark:text-foreground">
                                                  {formatTextWithBullets(insight.recommendation, '')}
                                                </div>
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
                  {organizedCxInsights.surveysAnalyzed > 0 && (
                    <Badge variant="secondary">{organizedCxInsights.surveysAnalyzed} survey{organizedCxInsights.surveysAnalyzed !== 1 ? 's' : ''}</Badge>
                  )}
                </div>
                {cxOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                {cxInsights.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Click "Analyze Survey" to generate Customer Satisfaction insights
                  </div>
                ) : (
                  <Tabs defaultValue="overview" className="w-full" value={activeCxTab} onValueChange={setActiveCxTab}>
                    <TabsList className="mb-4 flex justify-start">
                      <TabsTrigger value="overview">Customer Survey Summary</TabsTrigger>
                      <TabsTrigger value="cases">
                        Survey Analysis
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Customer Survey Summary Tab */}
                    <TabsContent value="overview" className="space-y-3">
                      {organizedCxInsights.summary.length > 0 ? (
                        <div>
                          <div className="mb-3 p-4 bg-background/50 dark:bg-background/80 rounded-lg shadow-sm border border-border/50">
                            <h3 className="font-medium mb-3 text-base flex items-center gap-2 pb-2 border-b border-muted-foreground/20">
                              {EMOJIS.SURVEY} {selectedEntity} {organizedCxInsights.summary[0]?.surveyType || ''} Survey Summary
                            </h3>
                            {organizedCxInsights.summary.map((insight) => (
                              <div key={insight.id} className="border-l-4 border-l-primary pl-4 py-4 bg-background/50 dark:bg-background/80 rounded-r-lg mb-3 shadow-sm">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-foreground">{insight.title}</h4>
                                    </div>
                                    <div className="bg-background/50 p-3 rounded-md border border-border/50">
                                      {formatDescription(insight.description)}
                                    </div>
                                    {insight.recommendation && !insight.recommendation.toLowerCase().includes('focus on:') && (
                                      <div className="bg-accent/5 border border-accent/20 rounded-md p-4 mt-3">
                                        {formatTextWithBullets(insight.recommendation, 'Action Item')}
                                      </div>
                                    )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {organizedCxInsights.cases.length > 0 && (
                            <div className="p-3 bg-background/50 dark:bg-background/80 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                We've found {organizedCxInsights.cases.length} case{organizedCxInsights.cases.length > 1 ? 's' : ''} that need attention. 
                                <a onClick={() => setActiveCxTab('cases')} className="text-primary cursor-pointer ml-1 hover:underline">
                                  View detailed Survey analysis →
                                </a>
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No survey summary available. Try analyzing more cases.
                        </div>
                      )}
                    </TabsContent>
                    
                    {/* Survey Analysis Tab */}
                    <TabsContent value="cases" className="space-y-4">
                      {organizedCxInsights.cases.length > 0 ? (
                        <Tabs defaultValue={organizedCxInsights.cases[0]?.caseId || 'case-1'} className="w-full">
                          <TabsList className="mb-4 flex justify-start flex-wrap w-full">
                            {organizedCxInsights.cases.map((caseGroup) => (
                              <TabsTrigger key={caseGroup.caseId} value={caseGroup.caseId} className="text-xs whitespace-nowrap flex-1 max-w-fit">
                                {caseGroup.caseId}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          
                          {organizedCxInsights.cases.map((caseGroup) => (
                            <TabsContent key={caseGroup.caseId} value={caseGroup.caseId} className="space-y-4">
                              <div className="border border-border rounded-lg overflow-hidden">
                                {/* Main Case Header */}
                                <div className="p-4 bg-muted/10 border-b border-border">
                                  <h3 className="font-medium text-base flex items-center gap-2">
                                    {EMOJIS.CASE} {caseGroup.caseId}{caseGroup.surveyType ? ` (${caseGroup.surveyType})` : ''}{caseGroup.caseTitle ? `: ${caseGroup.caseTitle}` : ''}
                                  </h3>
                                </div>
                                
                                {/* Case Content */}
                                <div className="p-4 space-y-6">
                                  {caseGroup.insights.map((insight) => (
                                    <div key={insight.id} className="border-l-4 border-l-primary pl-4 py-3 bg-background/50 dark:bg-background/80 rounded-r-lg shadow-sm border border-border/50">
                                      <div className="space-y-4">
                                          
                                          {/* Analysis Section */}
                                          <div>
                                            <h6 className="text-sm font-medium mb-1 flex items-center gap-2 text-foreground dark:text-foreground">
                                              {EMOJIS.MAGNIFYING_GLASS} Analysis:
                                            </h6>
                                            <div className="text-sm text-foreground dark:text-foreground ml-6">
                                              <ul className="list-disc ml-4">
                                                {formatDescription(insight.description)}
                                              </ul>
                                            </div>
                                          </div>
                                          
                                          {/* Recommendations Section */}
                                          {insight.recommendation && !insight.recommendation.toLowerCase().includes('focus on:') && (
                                            <div>
                                              <h6 className="text-sm font-medium mb-2 flex items-center gap-2">
                                                <Lightbulb className="h-4 w-4 text-accent" />
                                                Recommendations:
                                              </h6>
                                              <div className="text-sm text-foreground dark:text-foreground">
                                                {formatTextWithBullets(insight.recommendation, '')}
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No case-specific survey analysis available.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
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