import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, Users, TrendingUp } from 'lucide-react';

export interface CaseData {
  case_id: string;
  priority: string;
  owner_full_name: string;
  title: string;
  products: string[];
  status: string;
  created_date: string;
  closed_date?: string;
  case_age_days: number;
  structured_email_thread?: string;
}

export interface PerformanceData {
  owner: string;
  sct: number;
  totalCases: number;
  closedCases: number;
  openCases: number;
  cases: CaseData[];
}

interface PerformanceOverviewChartProps {
  data: PerformanceData[];
  title: string;
  onBarClick?: (owner: string, cases: CaseData[]) => void;
}

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: string;
  cases: CaseData[];
}

const DrillDownModal: React.FC<DrillDownModalProps> = ({ isOpen, onClose, owner, cases }) => {
  if (!isOpen) return null;

  const sortedCases = cases.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'closed': return 'bg-green-500';
      case 'resolved': return 'bg-blue-500';
      case 'in progress': return 'bg-yellow-500';
      case 'open': return 'bg-red-500';
      case 'pending': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{owner} - Case Breakdown</h2>
              <p className="text-muted-foreground">{cases.length} total cases</p>
            </div>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid gap-4">
            {sortedCases.map((caseItem) => (
              <Card key={caseItem.case_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{caseItem.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">Case ID: {caseItem.case_id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`${getPriorityColor(caseItem.priority)} text-white`}>
                        {caseItem.priority}
                      </Badge>
                      <Badge className={`${getStatusColor(caseItem.status)} text-white`}>
                        {caseItem.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Age: {caseItem.case_age_days} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Owner: {caseItem.owner_full_name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Created: </span>
                      {new Date(caseItem.created_date).toLocaleDateString()}
                    </div>
                    {caseItem.closed_date && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Closed: </span>
                        {new Date(caseItem.closed_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  {caseItem.products && caseItem.products.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-muted-foreground">Products: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {caseItem.products.map((product, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PerformanceOverviewChart: React.FC<PerformanceOverviewChartProps> = ({ 
  data, 
  title, 
  onBarClick 
}) => {
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [selectedCases, setSelectedCases] = useState<CaseData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transform data for the chart
  const chartData = data.map(item => ({
    name: item.owner,
    sct: item.sct,
    closed: item.closedCases,
    open: item.openCases,
    total: item.totalCases,
    cases: item.cases
  }));

  const handleBarClick = (data: any, index: number) => {
    const clickedData = chartData[index];
    if (clickedData) {
      setSelectedOwner(clickedData.name);
      setSelectedCases(clickedData.cases);
      setIsModalOpen(true);
      
      // Call external click handler if provided
      if (onBarClick) {
        onBarClick(clickedData.name, clickedData.cases);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOwner(null);
    setSelectedCases([]);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm">
            <span className="text-blue-500">● SCT: {data.sct} days</span>
          </p>
          <p className="text-sm">
            <span className="text-green-500">● Closed: {data.closed} cases</span>
          </p>
          <p className="text-sm">
            <span className="text-red-500">● Open: {data.open} cases</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-500">● Total: {data.total} cases</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
        </div>
      );
    }
    return null;
  };

  // Calculate summary statistics
  const totalCases = data.reduce((sum, item) => sum + item.totalCases, 0);
  const totalClosed = data.reduce((sum, item) => sum + item.closedCases, 0);
  const avgSCT = data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.sct, 0) / data.length) : 0;
  const closeRate = totalCases > 0 ? Math.round((totalClosed / totalCases) * 100) : 0;

  return (
    <>
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{avgSCT}</div>
              <div className="text-xs text-muted-foreground">Avg SCT (days)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalClosed}</div>
              <div className="text-xs text-muted-foreground">Closed Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{totalCases}</div>
              <div className="text-xs text-muted-foreground">Total Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{closeRate}%</div>
              <div className="text-xs text-muted-foreground">Close Rate</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
                fontSize={12}
              />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Bar 
                yAxisId="left"
                dataKey="sct" 
                name="SCT (days)" 
                fill="#3b82f6"
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              />
              <Bar 
                yAxisId="right"
                dataKey="closed" 
                name="Closed Cases" 
                fill="#10b981"
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              />
              <Bar 
                yAxisId="right"
                dataKey="open" 
                name="Open Cases" 
                fill="#ef4444"
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Click on any bar to view detailed case breakdown
          </div>
        </CardContent>
      </Card>

      {/* Drill-down Modal */}
      <DrillDownModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        owner={selectedOwner || ''}
        cases={selectedCases}
      />
    </>
  );
};

export default PerformanceOverviewChart;