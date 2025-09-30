import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import './charts.css';

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
  isLoading?: boolean;
}

const SurveyAnalysisChart: React.FC<SurveyAnalysisChartProps> = ({ 
  data, 
  title, 
  totalSurveys,
  onPieClick,
  isLoading = false
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isNoData = !hasValidData;
      const isSmallSegment = data.percentage < 15;
      
      // Determine background color based on the segment
      let bgClass = "glass-card";
      if (data.name.includes("CSAT")) bgClass = "bg-emerald-50 dark:bg-emerald-950/30";
      else if (data.name.includes("DSAT")) bgClass = "bg-red-50 dark:bg-red-950/30";
      else if (data.name.includes("Neutral")) bgClass = "bg-amber-50 dark:bg-amber-950/30";
      
      // Highlight small segments
      const highlightClass = isSmallSegment ? "ring-2" : "";
      const borderColor = 
        data.name.includes("CSAT") ? "ring-emerald-500/50" : 
        data.name.includes("DSAT") ? "ring-red-500/50" :
        "ring-amber-500/50";
      
      return (
        <div className={`p-4 border shadow-lg rounded-md ${bgClass} ${highlightClass} ${borderColor}`}>
          <p className="font-semibold text-foreground text-sm tracking-wide">{data.name}</p>
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Count:</span>
              <span className="text-xs font-semibold text-foreground">{isNoData ? 'N/A' : data.value}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Percentage:</span>
              <span className="text-xs font-bold text-foreground">{isNoData ? 'N/A' : `${Number(data.percentage).toFixed(1)}%`}</span>
            </div>

            {/* Small segment label removed as requested */}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, index, name }: any) => {
    // Return null to remove all labels (highlighted in yellow in the image)
    return null;
  };

  // Check if we have valid data to display
  const hasValidData = data && data.length > 0 && data.some(item => item.value > 0) && totalSurveys > 0;
  
  // Only use actual data, no dummy data when no data is available
  const chartData = hasValidData ? data.filter(item => item.value > 0) : [];

  const handleSegmentClick = (data: any, index: number) => {
    if (onPieClick && hasValidData) {
      const segmentName = data.name.includes('CSAT') ? 'csat' :
                         data.name.includes('Neutral') ? 'neutral' : 'dsat';
      onPieClick(data, segmentName);
    }
  };

  return (
    <Card className="rounded-lg border bg-card text-card-foreground shadow-sm chart-container">
      <CardHeader className="pb-4 card-header">
        <CardTitle className="text-lg font-semibold text-foreground tracking-tight">{title || 'No Entity Selected'}</CardTitle>
        {hasValidData ? (
          <p className="text-xs text-muted-foreground mt-1">
            Total Surveys: <span className="font-medium">{totalSurveys || 0}</span>
          </p>
        ) : (
          <div className="h-5"></div>
        )}
      </CardHeader>
      <CardContent className="card-content">
        {isLoading ? (
          <div className="flex items-center justify-center chart-wrapper text-muted-foreground">
            <div className="text-center pt-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-lg font-medium">Loading satisfaction data...</div>
            </div>
          </div>
        ) : !hasValidData ? (
          <div className="flex items-center justify-center chart-wrapper text-muted-foreground">
            <div className="text-center pt-10"> {/* Added top padding for alignment */}
              <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium">No data available</div>
            </div>
          </div>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 15, right: 55, bottom: 10, left: 55 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={hasValidData ? renderCustomLabel : false}
                innerRadius={50}
                outerRadius={105}
                startAngle={90} // Start from top for better visual alignment
                endAngle={450} // Full circle for proper rendering
                stroke="hsl(var(--chart-border))" // Always show outer border
                strokeWidth={2} // Consistent border width for all segments
                minAngle={3} // Minimum size for small segments
                paddingAngle={0.5} // Slightly reduced padding for better proportions
                fill="#8884d8"
                dataKey="value"
                onClick={handleSegmentClick}
                onMouseEnter={(data, index) => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
                animationBegin={0}
                animationDuration={600}
                isAnimationActive={true}
              >
                {chartData.map((entry, index) => {
                  // Make small segments visually more distinct
                  const isVerySmallSegment = entry.percentage < 15 && entry.value > 0;
                  const isHovered = hoveredSegment === index;
                  
                  // Consistent stroke for all segments to ensure outlines are visible
                  const strokeWidth = isVerySmallSegment ? 2.5 : 2;
                  const strokeColor = 'hsl(var(--chart-border))'; // Consistent border color for all segments
                  
                  // Brighten the DSAT color for better visibility if it's small
                  let fillColor = entry.color;
                  if (entry.name.includes('DSAT') && isVerySmallSegment) {
                    fillColor = '#ff5252'; // Brighter red
                  }
                  
                  // Enhance color when hovered
                  if (isHovered) {
                    // Brighten the color when hovered
                    if (fillColor.startsWith('#')) {
                      const rgb = fillColor.slice(1).match(/.{2}/g);
                      if (rgb) {
                        const [r, g, b] = rgb.map(x => parseInt(x, 16));
                        fillColor = `rgb(${Math.min(255, Math.round(r * 1.2))}, ${Math.min(255, Math.round(g * 1.2))}, ${Math.min(255, Math.round(b * 1.2))})`;
                      }
                    }
                  }

                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      className="pie-segment"
                      style={{
                        filter: isHovered ? 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.3))' : 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.1))',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={40}
                wrapperStyle={{ 
                  paddingTop: '16px',
                  fontSize: '12px',
                  fontFamily: 'inherit'
                }}
                formatter={(value, entry: any) => {
                  const displayName = value === 'CSAT (4-5)' ? 'CSAT' : 
                                    value === 'Neutral (3)' ? 'Neutral' : 
                                    value === 'DSAT (1-2)' ? 'DSAT' : value;
                  return (
                    <span style={{ 
                      color: 'hsl(var(--foreground))', 
                      fontSize: '12px', 
                      fontWeight: '500',
                      fontFamily: 'inherit',
                      letterSpacing: '0.025em'
                    }}>
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
