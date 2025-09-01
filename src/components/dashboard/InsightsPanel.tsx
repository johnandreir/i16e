import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, TrendingUp, Mail, FileText } from 'lucide-react';

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
  onScrubCases: () => void;
  onAnalyzeEmails: () => void;
  isLoading?: boolean;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ 
  insights, 
  onScrubCases, 
  onAnalyzeEmails,
  isLoading = false 
}) => {
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
            onClick={onScrubCases}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Scrub D365 Cases
          </Button>
          <Button 
            onClick={onAnalyzeEmails}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Analyze Email Threads
          </Button>
        </div>
      </Card>

      {/* Insights and Recommendations */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            AI-Generated Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Generate a report to see AI-powered insights and recommendations
              </p>
            </div>
          ) : (
            insights.map((insight) => (
              <div key={insight.id} className="border-l-4 border-l-primary pl-4 py-3 bg-muted/30 rounded-r-lg">
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-foreground">{insight.title}</h4>
                      <Badge variant={getInsightBadgeVariant(insight.type)}>
                        {insight.type}
                      </Badge>
                      {insight.member && (
                        <Badge variant="outline">{insight.member}</Badge>
                      )}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsPanel;