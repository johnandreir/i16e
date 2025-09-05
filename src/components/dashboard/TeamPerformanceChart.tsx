import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
}

const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({ data, title, onBarClick }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 border shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="text-chart-primary">SCT:</span> {payload[0]?.value} days
            </p>
            <p className="text-sm">
              <span className="text-chart-secondary">Cases Close:</span> {payload[1]?.value}
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

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="sct" 
                name="Solution Cycle Time (Days)"
                fill="hsl(var(--chart-primary))" 
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data, index) => handleSCTBarClick(data, index)}
              />
              <Bar 
                dataKey="cases" 
                name="Cases Close"
                fill="hsl(var(--chart-secondary))" 
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data, index) => handleCasesBarClick(data, index)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceChart;