import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  // Helper function to format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Helper function to format products array
  const formatProducts = (products: any) => {
    if (!products) return 'N/A';
    
    try {
      // If it's a string, try to parse it as JSON
      if (typeof products === 'string') {
        const parsed = JSON.parse(products);
        if (Array.isArray(parsed)) {
          return parsed.length > 0 ? parsed.join(', ') : 'N/A';
        }
        return products;
      }
      
      // If it's already an array
      if (Array.isArray(products)) {
        return products.length > 0 ? products.join(', ') : 'N/A';
      }
      
      // Fallback to string conversion
      return String(products);
    } catch (error) {
      // If JSON parsing fails, return the original string
      return typeof products === 'string' ? products : 'N/A';
    }
  };

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Case ID</TableHead>
                <TableHead className="w-32">Product</TableHead>
                <TableHead className="min-w-48">Title</TableHead>
                <TableHead className="w-20">Priority</TableHead>
                <TableHead className="w-24">Created</TableHead>
                <TableHead className="w-24">Closed</TableHead>
                <TableHead className="w-24">SCT (Days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCases.length > 0 ? (
                sortedCases.map((caseItem, index) => (
                  <TableRow key={caseItem.case_id}>
                    <TableCell className="font-medium text-xs">{caseItem.case_id || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{formatProducts(caseItem.products)}</TableCell>
                    <TableCell className="text-xs" title={caseItem.title}>
                      <div className="max-w-48 truncate">{caseItem.title || 'N/A'}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge 
                        variant={
                          caseItem.priority?.includes('P1') || caseItem.priority === 'High' ? 'destructive' : 
                          caseItem.priority?.includes('P4') || caseItem.priority === 'Low' ? 'secondary' : 
                          'default'
                        }
                        className="text-xs px-1 py-0"
                      >
                        {caseItem.priority || 'Medium'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(caseItem.created_date)}</TableCell>
                    <TableCell className="text-xs">{formatDate(caseItem.closed_date)}</TableCell>
                    <TableCell className="font-bold text-xs">{Number(caseItem.case_age_days || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No case data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
            <span className="text-blue-500">● SCT: {Number(data.sct).toFixed(2)} days</span>
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
  const avgSCT = data.length > 0 ? Math.round((data.reduce((sum, item) => sum + item.sct, 0) / data.length) * 100) / 100 : 0;
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
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