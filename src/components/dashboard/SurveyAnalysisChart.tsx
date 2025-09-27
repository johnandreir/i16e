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
          <p className="font-semibold text-foreground text-sm">{data.name}</p>
          <div className="space-y-1 mt-2">
            <p className="text-xs">Count: {isNoData ? 'N/A' : <span className="font-medium">{data.value}</span>}</p>
            <p className="text-xs">Percentage: {isNoData ? 'N/A' : <span className="font-medium">{Number(data.percentage).toFixed(2)}%</span>}</p>
            {isSmallSegment && (
              <p className="text-[10px] mt-1 font-medium text-foreground/80">
                This segment has been enlarged for visibility.
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    
    // For very small percentages, use a special callout style
    // More aggressive threshold to capture truly small segments
    const isVerySmallSegment = percent < 0.15;
    const isSmallSegment = percent < 0.3 && !isVerySmallSegment;
    
    // Determine whether to place label inside the pie segment
    // Calculate size of segment to determine if label can fit inside
    const arcSize = (outerRadius - innerRadius) * percent * Math.PI * 2;
    // Prefer inside placement whenever possible (make it easier to fit inside)
    const shouldPlaceInside = arcSize > 40 && percent > 0.08; // Lower thresholds to fit more labels inside
    
    // Override angle for very small segments to position them consistently on sides
    let adjustedMidAngle = midAngle;
    let radius;
    
    if (isVerySmallSegment) {
      const segmentName = name || '';
      // Force small segments to specific positions
      if (segmentName.includes('DSAT')) {
        // Always position DSAT to the right (0 degrees)
        adjustedMidAngle = 0;
        radius = outerRadius + 60;
      } else if (segmentName.includes('Neutral')) {
        // Position Neutral to the left (180 degrees)
        adjustedMidAngle = 180;
        radius = outerRadius + 60;
      } else if (segmentName.includes('CSAT')) {
        // If CSAT is small (rare), position to the left
        adjustedMidAngle = 180;
        radius = outerRadius + 55;
      } else {
        radius = outerRadius + 40;
      }
    } else if (isSmallSegment && !shouldPlaceInside) {
      radius = outerRadius + 35; // Medium distance for small segments that don't fit inside
    } else {
      // For labels that fit inside or larger segments
      radius = shouldPlaceInside ? innerRadius + (outerRadius - innerRadius) * 0.5 : outerRadius + 25;
    }
    
    // Calculate position using the potentially adjusted angle
    const x = cx + radius * Math.cos(-adjustedMidAngle * RADIAN);
    const y = cy + radius * Math.sin(-adjustedMidAngle * RADIAN);

    // Skip rendering labels for zero-value segments
    if (value === 0) return null;

    // Choose colors based on placement and segment type
    let bgColor = "rgba(17, 24, 39, 0.85)";
    // Use white text for both inside and outside labels, but with shadow for inside labels
    let textColor = "white";
    let borderColor = "white";
    
    // For inside labels, no background needed
    // For outside labels, add appropriate background colors
    if (!shouldPlaceInside) {
      if (isVerySmallSegment && name?.includes('DSAT')) {
        bgColor = "rgba(239, 68, 68, 0.9)"; // Red for DSAT
        borderColor = "#fecaca";
      } else if (isVerySmallSegment && name?.includes('Neutral')) {
        bgColor = "rgba(245, 158, 11, 0.9)"; // Amber for Neutral
        borderColor = "#fef3c7";
      } else if (isVerySmallSegment && name?.includes('CSAT')) {
        bgColor = "rgba(16, 185, 129, 0.9)"; // Green for CSAT
        borderColor = "#d1fae5";
      }
    }

    return (
      <g>
        {/* Enhanced callout for small percentages */}
        {!shouldPlaceInside && (isSmallSegment || isVerySmallSegment) && (
          <>
            {/* Label background - adjusted for consistent alignment */}
            <rect
              x={x - (x > cx ? -5 : 75)} 
              y={y - 14}
              width={70}
              height={28}
              fill={bgColor}
              stroke={borderColor}
              strokeWidth={isVerySmallSegment ? 1 : 0}
              rx={4}
              opacity={1}
            />
            
            {/* Visual indicator showing what the label refers to */}
            {isVerySmallSegment && (
              <>
                {/* Color indicator circle */}
                <circle
                  cx={x - (x > cx ? -5 : 60)}
                  cy={y}
                  r={6}
                  fill={name?.includes('DSAT') ? "#ef4444" : (name?.includes('Neutral') ? "#f59e0b" : "#10b981")}
                  stroke="white"
                  strokeWidth={0.5}
                />
                
                {/* Simple arrow indicator pointing to the segment */}
                {x > cx && (
                  <polygon
                    points={`${x-25},${y} ${x-35},${y-4} ${x-35},${y+4}`}
                    fill={name?.includes('DSAT') ? "#ef4444" : (name?.includes('Neutral') ? "#f59e0b" : "#10b981")}
                    stroke="none"
                  />
                )}
                {x <= cx && (
                  <polygon
                    points={`${x+25},${y} ${x+35},${y-4} ${x+35},${y+4}`}
                    fill={name?.includes('DSAT') ? "#ef4444" : (name?.includes('Neutral') ? "#f59e0b" : "#10b981")}
                    stroke="none"
                  />
                )}
              </>
            )}
          </>
        )}
        
        {/* Text label with enhanced visibility but consistent styling */}
        <text
          x={shouldPlaceInside ? x : (isVerySmallSegment ? (x - (x > cx ? -35 : 35)) : x)}
          y={y}
          fill={textColor}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={shouldPlaceInside ? 11 : 9.5}
          fontWeight="600"
          className={shouldPlaceInside ? "drop-shadow" : "drop-shadow-sm"}
          style={shouldPlaceInside ? {textShadow: "0px 0px 3px rgba(0,0,0,0.7)"} : {}}
        >
          <tspan x={shouldPlaceInside ? x : (isVerySmallSegment ? (x - (x > cx ? -35 : 35)) : x)} dy="-0.5em">{`${(percent * 100).toFixed(1)}%`}</tspan>
          <tspan x={shouldPlaceInside ? x : (isVerySmallSegment ? (x - (x > cx ? -35 : 35)) : x)} dy="1.4em">{`(${value})`}</tspan>
        </text>
        
        {/* Connection line - only show for outside labels */}
        {!shouldPlaceInside && (
          <line
            x1={cx + outerRadius * Math.cos(-adjustedMidAngle * RADIAN)}
            y1={cy + outerRadius * Math.sin(-adjustedMidAngle * RADIAN)}
            x2={isVerySmallSegment ? (x - (x > cx ? 35 : -35)) : (x - (x > cx ? 10 : -10))}
            y2={y}
            stroke={isVerySmallSegment ? (name?.includes('DSAT') ? "#ff5252" : "#aaaaaa") : "hsl(var(--muted-foreground))"}
            strokeWidth={1}
            opacity={0.8}
            strokeDasharray={isVerySmallSegment ? "none" : ""}
          />
        )}
      </g>
    );
  };

  // Always show chart, but use empty data when no valid data exists
  const hasValidData = data && data.length > 0 && data.some(item => item.value > 0) && totalSurveys > 0;
  
  // Use empty placeholder data when no data is available to show chart structure
  const chartData = hasValidData ? 
    data.filter(item => item.value > 0) : // Filter out segments with 0 values for cleaner pie chart
    [
      { name: 'CSAT (4-5)', value: 0, percentage: 0, color: '#10b981' },
      { name: 'Neutral (3)', value: 0, percentage: 0, color: '#f59e0b' },
      { name: 'DSAT (1-2)', value: 0, percentage: 0, color: '#ff5252' } // Enhanced red color for DSAT
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
              <PieChart margin={{ top: 10, right: 50, bottom: 5, left: 50 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={hasValidData ? renderCustomLabel : false}
                innerRadius={40}
                outerRadius={85}
                startAngle={90} // Start from top for better visual alignment
                endAngle={450} // Full circle for proper rendering
                stroke="hsl(var(--chart-border))" // Always show outer border
                strokeWidth={1.5} // Consistent border width
                minAngle={3} // Minimum size for small segments
                paddingAngle={0.5} // Slightly reduced padding for better proportions
                fill="#8884d8"
                dataKey="value"
                onClick={handleSegmentClick}
              >
                {chartData.map((entry, index) => {
                  // Make small segments visually more distinct
                  const isVerySmallSegment = entry.percentage < 15 && entry.value > 0;
                  const isSmallSegment = entry.percentage < 30 && entry.percentage >= 15 && entry.value > 0;
                  
                  // Special styling for small segments
                  const strokeWidth = isVerySmallSegment ? 2 : 1;
                  const strokeColor = isVerySmallSegment ? 'white' : 'hsl(var(--chart-border))';
                  
                  // Brighten the DSAT color for better visibility if it's small
                  let fillColor = entry.color;
                  if (entry.name.includes('DSAT') && isVerySmallSegment) {
                    fillColor = '#ff5252'; // Brighter red
                  }

                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth} 
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value, entry: any) => {
                  const displayName = value === 'CSAT (4-5)' ? 'CSAT' : 
                                    value === 'Neutral (3)' ? 'Neutral' : 
                                    value === 'DSAT (1-2)' ? 'DSAT' : value;
                  return (
                    <span style={{ color: entry.color, fontSize: '11px', fontWeight: '600' }}>
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
