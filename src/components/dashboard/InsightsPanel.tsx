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
  const sctInsights = sctAnalyzed ? insights.filter(insight => 
    insight.category?.toLowerCase().includes('performance') || 
    insight.category?.toLowerCase().includes('process') ||
    insight.category?.toLowerCase().includes('trending') ||
    insight.category?.toLowerCase().includes('resource') ||
    insight.title.toLowerCase().includes('sct') ||
    insight.title.toLowerCase().includes('cycle time') ||
    insight.title.toLowerCase().includes('development') ||
    insight.title.toLowerCase().includes('testing') ||
    insight.title.toLowerCase().includes('analysis')
  ) : [];
  
  const cxInsights = cxAnalyzed ? insights.filter(insight => 
    insight.category?.toLowerCase().includes('satisfaction') ||
    insight.category?.toLowerCase().includes('feedback') ||
    insight.category?.toLowerCase().includes('customer') ||
    insight.category?.toLowerCase().includes('channel') ||
    insight.category?.toLowerCase().includes('efficiency') ||
    insight.category?.toLowerCase().includes('loyalty') ||
    insight.title.toLowerCase().includes('customer') ||
    insight.title.toLowerCase().includes('satisfaction') ||
    insight.title.toLowerCase().includes('csat') ||
    insight.title.toLowerCase().includes('dsat') ||
    insight.title.toLowerCase().includes('cx') ||
    insight.title.toLowerCase().includes('feedback')
  ) : [];

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
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        {insight.recommendation && (
                          <div className="bg-accent/10 border border-accent/20 rounded-md p-3 mt-2">
                            <p className="text-sm text-foreground">
                              <strong>Recommendation:</strong> {insight.recommendation}
                            </p>
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
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        {insight.recommendation && (
                          <div className="bg-accent/10 border border-accent/20 rounded-md p-3 mt-2">
                            <p className="text-sm text-foreground">
                              <strong>Recommendation:</strong> {insight.recommendation}
                            </p>
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