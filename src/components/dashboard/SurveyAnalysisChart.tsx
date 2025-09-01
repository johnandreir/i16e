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
}

const SurveyAnalysisChart: React.FC<SurveyAnalysisChartProps> = ({ 
  data, 
  title, 
  totalSurveys 
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

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <Card className="chart-container">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">Total Surveys: {totalSurveys}</p>
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