import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

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
  onPieClick?: (data: SurveyData, segment: string) => void;
}

const SurveyAnalysisChart: React.FC<SurveyAnalysisChartProps> = ({ 
  data, 
  title, 
  totalSurveys,
  onPieClick 
}) => {
  // Debug the data being passed to the chart
  console.log('🔍 SurveyAnalysisChart received:', {
    title,
    totalSurveys,
    data,
    dataLength: data?.length,
    dataStructure: data?.map(item => ({
      name: item?.name,
      value: item?.value,
      percentage: item?.percentage,
      color: item?.color
    }))
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isNoData = !hasValidData;
      return (
        <div className="glass-card p-4 border shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">Count: {isNoData ? 'N/A' : data.value}</p>
            <p className="text-sm">Percentage: {isNoData ? 'N/A' : `${Number(data.percentage).toFixed(2)}%`}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30; // Move labels further out
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Show labels for all segments that have data, including small DSAT percentages
    if (value === 0) return null;

    return (
      <g>
        <text
          x={x}
          y={y}
          fill="hsl(var(--foreground))"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={11}
          fontWeight="600"
          className="drop-shadow-sm"
        >
          <tspan x={x} dy="-0.4em">{`${(percent * 100).toFixed(2)}%`}</tspan>
          <tspan x={x} dy="1.2em">{`(${value})`}</tspan>
        </text>
        {/* Connection line */}
        <line
          x1={cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)}
          y1={cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)}
          x2={x - (x > cx ? 5 : -5)}
          y2={y}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1}
          opacity={0.6}
        />
      </g>
    );
  };

  // Always show chart, but use empty data when no valid data exists
  const hasValidData = data && data.length > 0 && data.some(item => item.value > 0) && totalSurveys > 0;
  
  console.log('🔍 SurveyAnalysisChart validation:', {
    dataExists: !!data,
    dataLength: data?.length,
    hasItemsWithValue: data?.some(item => item.value > 0),
    totalSurveysValue: totalSurveys,
    totalSurveysType: typeof totalSurveys,
    totalSurveysValid: totalSurveys > 0,
    finalHasValidData: hasValidData,
    actualDataValues: data?.map(item => ({ name: item?.name, value: item?.value }))
  });
  
  // Use empty placeholder data when no data is available to show chart structure
  const chartData = hasValidData ? data : [
    { name: 'CSAT (4-5)', value: 0, percentage: 0, color: '#10b981' },
    { name: 'Neutral (3)', value: 0, percentage: 0, color: '#f59e0b' },
    { name: 'DSAT (1-2)', value: 0, percentage: 0, color: '#ef4444' }
  ];

  const handleSegmentClick = (data: any, index: number) => {
    if (onPieClick && hasValidData) {
      const segmentName = data.name.includes('CSAT') ? 'csat' :
                         data.name.includes('Neutral') ? 'neutral' : 'dsat';
      onPieClick(data, segmentName);
    }
  };

  return (
    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">Total Surveys: {hasValidData ? (totalSurveys || 0) : 'N/A'}</p>
      </CardHeader>
      <CardContent>
        {!hasValidData ? (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <div className="text-center">
              <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium">No data available</div>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={hasValidData ? renderCustomLabel : false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onClick={handleSegmentClick}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={56}
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value, entry: any) => {
                  const displayName = value === 'CSAT (4-5)' ? 'CSAT' : 
                                    value === 'Neutral (3)' ? 'Neutral' : 
                                    value === 'DSAT (1-2)' ? 'DSAT' : value;
                  return (
                    <span style={{ color: entry.color, fontSize: '12px', fontWeight: '500' }}>
                      {displayName}
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SurveyAnalysisChart;