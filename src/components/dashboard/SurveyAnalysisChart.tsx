import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SurveyData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface SurveyAnalysisChartProps {
  data: SurveyData[];
  title: string;
  totalSurveys: number;
  onPieClick?: (data: SurveyData[]) => void;
}

const SurveyAnalysisChart: React.FC<SurveyAnalysisChartProps> = ({ 
  data, 
  title, 
  totalSurveys,
  onPieClick 
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-4 border shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">Count: {data.value}</p>
            <p className="text-sm">Percentage: {data.percentage}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Adjust positioning to prevent overlaps
    const offsetX = Math.cos(-midAngle * RADIAN) * 20;
    const offsetY = Math.sin(-midAngle * RADIAN) * 20;
    const labelX = x + offsetX;
    const labelY = y + offsetY;

    // Only show labels for segments with meaningful percentages
    if (percent < 0.05) return null;

    return (
      <g>
        <text
          x={labelX}
          y={labelY}
          fill="hsl(var(--foreground))"
          textAnchor={labelX > cx ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={12}
          fontWeight="600"
          className="drop-shadow-sm"
        >
          <tspan x={labelX} dy="-0.3em">{`${(percent * 100).toFixed(0)}%`}</tspan>
          <tspan x={labelX} dy="1.2em">{`(${value})`}</tspan>
        </text>
        {/* Connection line */}
        <line
          x1={x}
          y1={y}
          x2={labelX - (labelX > cx ? 5 : -5)}
          y2={labelY}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1}
          opacity={0.6}
        />
      </g>
    );
  };

  return (
    <Card className="chart-container cursor-pointer" onClick={() => onPieClick?.(data)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Total Surveys: {totalSurveys}</p>
          <p className="text-sm text-muted-foreground">Click to view detailed breakdown</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onClick={() => onPieClick?.(data)}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SurveyAnalysisChart;