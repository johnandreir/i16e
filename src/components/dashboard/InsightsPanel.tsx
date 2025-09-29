import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, CheckCircle, Info, TrendingUp, Clock, ThumbsUp, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';

interface Insight {
  id: string;
  type: 'improvement' | 'success' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  member?: string;
  category?: string;
  surveyType?: 'DSAT' | 'CSAT';
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
  const [sctOpen, setSctOpen] = useState(false);
  const [cxOpen, setCxOpen] = useState(false);

  // Helper function to format text with bullet points for better readability
  const formatTextWithBullets = (text: string, label: string = 'Recommendation') => {
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
          <div className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1 ml-2">
              {sentences.map((sentence, index) => (
                <li key={index} className="text-sm">
                  {sentence}
                </li>
              ))}
            </ul>
          </div>
        );
      }
    }
    
    // Return as normal paragraph if not suitable for bullet formatting
    return <p className="text-sm text-muted-foreground">{description}</p>;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement':
        return <AlertTriangle className="h-4 w-4 text-kpi-warning" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-kpi-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-kpi-danger" />;
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

  // Separate DSAT and CSAT insights
  const dsatInsights = cxInsights.filter(insight => 
    insight.surveyType === 'DSAT' || 
    insight.title.toLowerCase().includes('dsat') ||
    insight.type === 'warning'
  );
  
  const csatInsights = cxInsights.filter(insight => 
    insight.surveyType === 'CSAT' || 
    (insight.category?.toLowerCase().includes('case-analysis') && insight.surveyType !== 'DSAT') ||
    (insight.category?.toLowerCase().includes('summary') && !dsatInsights.some(d => d.id === insight.id))
  );
  
  const otherCxInsights = cxInsights.filter(insight => 
    !dsatInsights.some(d => d.id === insight.id) && 
    !csatInsights.some(c => c.id === insight.id)
  );

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
                  {sctInsights.length > 0 && (
                    <Badge variant="secondary">{sctInsights.length}</Badge>
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
                sctInsights.map((insight) => (
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
            <CollapsibleContent className="space-y-4 mt-3">
              {cxInsights.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Click "CX Insight" to generate Customer Satisfaction insights
                </div>
              ) : (
                <div className="space-y-4">
                  {/* DSAT Feedback Analysis */}
                  {dsatInsights.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <h5 className="font-medium text-sm text-red-700 dark:text-red-400">DSAT Feedback Analysis</h5>
                        <Badge variant="destructive" className="text-xs">{dsatInsights.length} customer{dsatInsights.length !== 1 ? 's' : ''}</Badge>
                      </div>
                      <div className="space-y-2">
                        {dsatInsights.map((insight) => (
                          <div key={insight.id} className="border-l-4 border-l-red-500 pl-4 py-3 bg-red-50 dark:bg-red-950/20 rounded-r-lg">
                            <div className="flex items-start gap-3">
                              {getInsightIcon(insight.type)}
                              <div className="flex-1 space-y-2 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground">{insight.title}</h4>
                                  <Badge variant="destructive">error</Badge>
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
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CSAT Feedback Analysis */}
                  {csatInsights.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <h5 className="font-medium text-sm text-green-700 dark:text-green-400">CSAT Feedback Analysis</h5>
                        <Badge variant="success" className="text-xs">{csatInsights.length} customer{csatInsights.length !== 1 ? 's' : ''}</Badge>
                      </div>
                      <div className="space-y-2">
                        {csatInsights.map((insight) => (
                          <div key={insight.id} className="border-l-4 border-l-green-500 pl-4 py-3 bg-green-50 dark:bg-green-950/20 rounded-r-lg">
                            <div className="flex items-start gap-3">
                              {getInsightIcon(insight.type)}
                              <div className="flex-1 space-y-2 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground">{insight.title}</h4>
                                  <Badge variant="success">success</Badge>
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
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other CX Insights (not DSAT/CSAT specific) */}
                  {otherCxInsights.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <h5 className="font-medium text-sm text-blue-700 dark:text-blue-400">General CX Insights</h5>
                        <Badge variant="secondary" className="text-xs">{otherCxInsights.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {otherCxInsights.map((insight) => (
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
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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