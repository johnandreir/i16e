import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, CheckCircle, Info, TrendingUp, Clock, ThumbsUp, ChevronDown, ChevronRight } from 'lucide-react';

interface Insight {
  id: string;
  type: 'improvement' | 'success' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  member?: string;
}

interface InsightsPanelProps {
  insights: Insight[];
  onAnalyzeSCT: () => void;
  onCXInsight: () => void;
  sctAnalyzed: boolean;
  cxAnalyzed: boolean;
  selectedEntity: string;
  selectedEntityValue: string;
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
  selectedEntityValue,
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

  // Generate sample SCT insights based on selected entity
  const getSCTInsights = () => {
    if (!sctAnalyzed) return [];
    
    const baseInsights = [
      {
        id: 'sct-1',
        type: 'improvement' as const,
        title: `${selectedEntityValue} - SCT Optimization Opportunity`,
        description: `Average Solution Cycle Time for ${selectedEntityValue} is 18.5 days, which is 15% above the target of 16 days.`,
        recommendation: `Focus on initial triage accuracy and implement automated diagnostic tools. Consider skill-based case routing to reduce escalation delays.`,
      },
      {
        id: 'sct-2',
        type: 'warning' as const,
        title: 'Complex Case Pattern Detected',
        description: `30% of cases in ${selectedEntityValue} require multiple touchpoints, increasing average SCT by 6 days.`,
        recommendation: 'Implement knowledge base enhancements and provide advanced training for complex scenarios.',
      }
    ];

    if (selectedEntity === 'dpe') {
      return [
        {
          id: 'sct-dpe-1',
          type: 'improvement' as const,
          title: `${selectedEntityValue} - Individual Performance Analysis`,
          description: `${selectedEntityValue} shows inconsistent SCT patterns with peaks during P1 incidents.`,
          recommendation: 'Provide incident management training and establish buddy system for P1 case handling.',
        }
      ];
    }

    return baseInsights;
  };

  // Generate sample CX insights based on selected entity
  const getCXInsights = () => {
    if (!cxAnalyzed) return [];
    
    const baseInsights = [
      {
        id: 'cx-1',
        type: 'success' as const,
        title: `${selectedEntityValue} - Strong Customer Satisfaction`,
        description: `Customer satisfaction for ${selectedEntityValue} is at 89%, exceeding the 85% target.`,
        recommendation: 'Maintain current service levels and document best practices for knowledge sharing.',
      },
      {
        id: 'cx-2',
        type: 'info' as const,
        title: 'Communication Pattern Analysis',
        description: `Analysis shows customers prefer detailed technical explanations for ${selectedEntityValue} cases.`,
        recommendation: 'Continue providing comprehensive technical documentation and maintain proactive communication.',
      }
    ];

    if (selectedEntity === 'squad') {
      return [
        ...baseInsights,
        {
          id: 'cx-squad-1',
          type: 'improvement' as const,
          title: 'Squad Consistency Opportunity',
          description: `Customer satisfaction varies by 12% across ${selectedEntityValue} members.`,
          recommendation: 'Implement peer review process and standardize customer interaction protocols.',
        }
      ];
    }

    return baseInsights;
  };

  const sctInsights = getSCTInsights();
  const cxInsights = getCXInsights();

  return (
    <div className="space-y-6">
      {/* Analysis Actions */}
      <Card className="glass-card p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance Analysis Tools
          </CardTitle>
        </CardHeader>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={onAnalyzeSCT}
            disabled={isLoading || !isAnalysisEnabled}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Analyze SCT
          </Button>
          <Button 
            onClick={onCXInsight}
            disabled={isLoading || !isAnalysisEnabled}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ThumbsUp className="h-4 w-4" />
            CX Insight
          </Button>
        </div>
      </Card>

      {/* Insights and Recommendations */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Solution Cycle Time Group */}
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
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
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

          {/* Customer Satisfaction Group */}
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
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsPanel;