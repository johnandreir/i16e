import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import './charts.css';

interface TeamMember {
  name: string;
  sct: number;
  cases: number;
  satisfaction: number;
}

interface TeamPerformanceChartProps {
  data: TeamMember[];
  title: string;
  onBarClick?: (member: TeamMember, metric: 'sct' | 'cases' | 'satisfaction') => void;
  isLoading?: boolean;
}

const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({ data, title, onBarClick, isLoading = false }) => {
  const [hoveredBar, setHoveredBar] = useState<{ type: 'sct' | 'cases' | null; index: number | null }>({ type: null, index: null });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isNoPerformanceData = !hasPerformanceData;
      return (
        <div className="glass-card p-4 border shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="text-chart-primary">SCT Score:</span> {isNoPerformanceData ? 'N/A' : `${Number(payload[0]?.value).toFixed(2)} days`}
            </p>
            <p className="text-sm">
              <span className="text-chart-secondary">Closed Cases:</span> {isNoPerformanceData ? 'N/A' : payload[1]?.value}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleSCTBarClick = (data: any, index: number) => {
    if (data && onBarClick) {
      onBarClick(data, 'sct');
    }
  };

  const handleCasesBarClick = (data: any, index: number) => {
    if (data && onBarClick) {
      onBarClick(data, 'cases');
    }
  };

  // Always show chart, but use empty data when no valid data exists
  const hasValidData = data && data.length > 0;
  
  // Check if we have actual performance data or just structure with zero values
  const hasPerformanceData = hasValidData && data.some(item => item.sct > 0 || item.cases > 0);
  
  // Use empty placeholder data when no data is available to show chart structure
  const chartData = hasValidData ? data : [
    { name: 'N/A', sct: 0, cases: 0, satisfaction: 0 }
  ];

  // Calculate dynamic top margin based on title length
  const calculateTopMargin = () => {
    if (!title) return 50;
    const titleLength = title.length;
    // Base margin of 50px, add 3px per character over 10 characters
    const extraMargin = titleLength > 10 ? (titleLength - 10) * 3 : 0;
    return Math.min(50 + extraMargin, 120); // Cap at 120px max
  };

  const dynamicTopMargin = calculateTopMargin();

  return (
    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm chart-container">
      <CardHeader className="pb-4 card-header">
        <CardTitle className="text-lg font-semibold text-foreground tracking-tight">{title || 'No Entity Selected'}</CardTitle>
        <div className="h-5"></div> {/* Empty space to match the survey chart's potential total line */}
      </CardHeader>
      <CardContent className="card-content">
        {isLoading ? (
          <div className="flex items-center justify-center chart-wrapper text-muted-foreground">
            <div className="text-center pt-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-lg font-medium">Loading performance data...</div>
            </div>
          </div>
        ) : (!hasValidData || !hasPerformanceData) ? (
          <div className="flex items-center justify-center chart-wrapper text-muted-foreground">
            <div className="text-center pt-10"> {/* Added top padding for alignment */}
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium">No data available</div>
            </div>
          </div>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: dynamicTopMargin, right: 30, left: 20, bottom: 5 }}
              >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Legend />
              <Bar 
                dataKey="sct" 
                name="SCT Score (Days)"
                fill="hsl(var(--chart-primary))" 
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data, index) => handleSCTBarClick(data, index)}
                onMouseEnter={(data, index) => setHoveredBar({ type: 'sct', index })}
                onMouseLeave={() => setHoveredBar({ type: null, index: null })}
                fillOpacity={hoveredBar.type === 'sct' || hoveredBar.type === null ? 1 : 0.6}
                isAnimationActive={true}
                animationDuration={300}
                stroke="hsl(var(--chart-border))"
                strokeWidth={2}
              />
              <Bar 
                dataKey="cases" 
                name="Closed Cases"
                fill="hsl(var(--chart-secondary))" 
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data, index) => handleCasesBarClick(data, index)}
                onMouseEnter={(data, index) => setHoveredBar({ type: 'cases', index })}
                onMouseLeave={() => setHoveredBar({ type: null, index: null })}
                fillOpacity={hoveredBar.type === 'cases' || hoveredBar.type === null ? 1 : 0.6}
                isAnimationActive={true}
                animationDuration={300}
                stroke="hsl(var(--chart-border))"
                strokeWidth={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceChart;