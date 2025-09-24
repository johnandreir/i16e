import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { X, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DetailedStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: 'team' | 'survey' | 'individual';
  title: string;
  onAnalyzeSCT?: () => void;
}

const DetailedStatsModal: React.FC<DetailedStatsModalProps> = ({
  isOpen,
  onClose,
  data,
  type,
  title,
  onAnalyzeSCT
}) => {
  // State for sorting only - removed pagination
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Helper function to handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper function to sort data
  const sortData = (data: any[], field: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];
      
      // Handle different data types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Helper function to render sort icons
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ChevronUp className="w-4 h-4 opacity-50" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  // Helper function to format dates to YYYY-MM-DD format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Helper function to generate proper modal title
  const getModalTitle = () => {
    if (!data || !data.member || !data.metric) return `${title} - Detailed Analysis`;
    
    const { member, metric } = data;
    const memberName = member.name || title;
    
    if (metric === 'sct') {
      return `${memberName} - SCT Score Detailed Breakdown`;
    } else if (metric === 'cases') {
      return `${memberName} - Closed Cases Detailed Breakdown`;
    }
    
    return `${memberName} - Detailed Analysis`;
  };

  const renderTeamDetails = () => {
    if (!data) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }

    const { member, metric, details } = data;
    
    if (metric === 'sct') {
      const validSctValues = details
        .map(d => d.sct || d.case_age_days)
        .filter(val => val != null && !isNaN(val) && val > 0);
      const fastestResolution = validSctValues.length > 0 ? Math.min(...validSctValues) : 'N/A';
      const slowestResolution = validSctValues.length > 0 ? Math.max(...validSctValues) : 'N/A';
      
      return (
        <div className="space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex justify-end items-center mb-4">
              {onAnalyzeSCT && (
                <Button 
                  onClick={onAnalyzeSCT}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Analyze SCT
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Average SCT</p>
                <p className="font-bold text-2xl text-blue-600">{parseFloat(member.sct).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Cases Analyzed</p>
                <p className="font-bold text-2xl text-green-600">{details.length}</p>
                <p className="text-xs text-muted-foreground">total cases</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Fastest Resolution</p>
                <p className="font-bold text-2xl text-emerald-600">{fastestResolution}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Slowest Resolution</p>
                <p className="font-bold text-2xl text-orange-600">{slowestResolution}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 border rounded-lg">
            <div className="flex-1 overflow-auto min-h-0" style={{ maxHeight: 'calc(80vh - 300px)' }}>
              <div className="min-w-full">
                <Table style={{ tableLayout: 'fixed', width: '100%' }}>
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('case_id')}>
                        <div className="flex items-center gap-1">
                          Case ID
                          {renderSortIcon('case_id')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '150px', maxWidth: '150px' }} onClick={() => handleSort('owner_full_name')}>
                        <div className="flex items-center gap-1">
                          Case Owner
                          {renderSortIcon('owner_full_name')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '130px', maxWidth: '130px' }} onClick={() => handleSort('products')}>
                        <div className="flex items-center gap-1">
                          Product
                          {renderSortIcon('products')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '250px', maxWidth: '250px' }} onClick={() => handleSort('title')}>
                        <div className="flex items-center gap-1">
                          Title
                          {renderSortIcon('title')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '90px', maxWidth: '90px' }} onClick={() => handleSort('priority')}>
                        <div className="flex items-center gap-1">
                          Priority
                          {renderSortIcon('priority')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('created_date')}>
                        <div className="flex items-center gap-1">
                          Created
                          {renderSortIcon('created_date')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('closed_date')}>
                        <div className="flex items-center gap-1">
                          Closed
                          {renderSortIcon('closed_date')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '100px', maxWidth: '100px' }} onClick={() => handleSort('sct')}>
                        <div className="flex items-center gap-1">
                          SCT (Days)
                          {renderSortIcon('sct')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const sortedData = sortField ? sortData(details, sortField, sortDirection) : details;
                      
                      return sortedData.map((detail: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell 
                            title={detail.case_id || detail.caseId || 'N/A'}
                            className="font-mono text-sm truncate" 
                            style={{ width: '120px', maxWidth: '120px' }}
                          >
                            {detail.case_id || detail.caseId || 'N/A'}
                          </TableCell>
                          <TableCell 
                            title={detail.owner_full_name || 'N/A'}
                            className="text-sm truncate" 
                            style={{ width: '150px', maxWidth: '150px' }}
                          >
                            {detail.owner_full_name || 'N/A'}
                          </TableCell>
                          <TableCell 
                            title={detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}
                            className="text-sm truncate" 
                            style={{ width: '130px', maxWidth: '130px' }}
                          >
                            {detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}
                          </TableCell>
                          <TableCell 
                            title={detail.title || 'N/A'}
                            className="truncate" 
                            style={{ width: '250px', maxWidth: '250px' }}
                          >
                            {detail.title || 'N/A'}
                          </TableCell>
                          <TableCell style={{ width: '90px', maxWidth: '90px' }}>
                            <Badge variant={detail.priority === 'P1' ? "destructive" : detail.priority === 'P2' ? "warning" : "secondary"}>
                              {detail.priority || 'Medium'}
                            </Badge>
                          </TableCell>
                          <TableCell 
                            style={{ width: '120px', maxWidth: '120px' }}
                            className="truncate"
                          >
                            {formatDate(detail.created_date || detail.createdDate)}
                          </TableCell>
                          <TableCell 
                            style={{ width: '120px', maxWidth: '120px' }}
                            className="truncate"
                          >
                            {formatDate(detail.closed_date || detail.closedDate)}
                          </TableCell>
                          <TableCell style={{ width: '100px', maxWidth: '100px' }}>
                            <Badge variant={(detail.case_age_days || detail.sct) > 20 ? "destructive" : (detail.case_age_days || detail.sct) < 10 ? "success" : "secondary"}>
                              {detail.case_age_days || detail.sct || 0}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (metric === 'cases') {
      const p1Cases = details.filter(d => d.priority === 'P1').length;
      const p2Cases = details.filter(d => d.priority === 'P2').length;
      const p3Cases = details.filter(d => d.priority === 'P3').length;
      const p4Cases = details.filter(d => d.priority === 'P4').length;
      
      return (
        <div className="space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Total Cases</p>
                <p className="font-bold text-3xl text-blue-600">{member.cases}</p>
                <p className="text-xs text-muted-foreground">all cases</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Priority Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-300 font-medium mb-1">P1 - Critical</p>
                  <p className="font-bold text-2xl text-red-600">{p1Cases}</p>
                  <p className="text-xs text-red-600/70">urgent cases</p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-orange-700 dark:text-orange-300 font-medium mb-1">P2 - High</p>
                  <p className="font-bold text-2xl text-orange-600">{p2Cases}</p>
                  <p className="text-xs text-orange-600/70">high priority</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-yellow-700 dark:text-yellow-300 font-medium mb-1">P3 - Medium</p>
                  <p className="font-bold text-2xl text-yellow-600">{p3Cases}</p>
                  <p className="text-xs text-yellow-600/70">medium priority</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">P4 - Low</p>
                  <p className="font-bold text-2xl text-blue-600">{p4Cases}</p>
                  <p className="text-xs text-blue-600/70">low priority</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 border rounded-lg">
            <div className="flex-1 overflow-auto min-h-0" style={{ maxHeight: 'calc(80vh - 300px)' }}>
              <div className="min-w-full">
                <Table style={{ tableLayout: 'fixed', width: '100%' }}>
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('case_id')}>
                        <div className="flex items-center gap-1">
                          Case ID
                          {renderSortIcon('case_id')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '150px', maxWidth: '150px' }} onClick={() => handleSort('owner_full_name')}>
                        <div className="flex items-center gap-1">
                          Case Owner
                          {renderSortIcon('owner_full_name')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '130px', maxWidth: '130px' }} onClick={() => handleSort('products')}>
                        <div className="flex items-center gap-1">
                          Product
                          {renderSortIcon('products')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '250px', maxWidth: '250px' }} onClick={() => handleSort('title')}>
                        <div className="flex items-center gap-1">
                          Title
                          {renderSortIcon('title')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '90px', maxWidth: '90px' }} onClick={() => handleSort('priority')}>
                        <div className="flex items-center gap-1">
                          Priority
                          {renderSortIcon('priority')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('created_date')}>
                        <div className="flex items-center gap-1">
                          Created
                          {renderSortIcon('created_date')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('closed_date')}>
                        <div className="flex items-center gap-1">
                          Closed
                          {renderSortIcon('closed_date')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '100px', maxWidth: '100px' }} onClick={() => handleSort('status')}>
                        <div className="flex items-center gap-1">
                          Status
                          {renderSortIcon('status')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const sortedData = sortField ? sortData(details, sortField, sortDirection) : details;
                      
                      return sortedData.map((detail: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm overflow-hidden" style={{ width: '120px', maxWidth: '120px' }}>
                            <div className="truncate" title={detail.case_id || detail.caseId || 'N/A'}>
                              {detail.case_id || detail.caseId || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm overflow-hidden" style={{ width: '150px', maxWidth: '150px' }}>
                            <div className="truncate" title={detail.owner_full_name || 'N/A'}>
                              {detail.owner_full_name || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm overflow-hidden" style={{ width: '130px', maxWidth: '130px' }}>
                            <div className="truncate" title={detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}>
                              {detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="overflow-hidden" style={{ width: '250px', maxWidth: '250px' }}>
                            <div className="truncate" title={detail.title || 'N/A'}>
                              {detail.title || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="overflow-hidden" style={{ width: '90px', maxWidth: '90px' }}>
                            <Badge variant={detail.priority === 'P1' ? "destructive" : detail.priority === 'P2' ? "warning" : "secondary"}>
                              {detail.priority || 'Medium'}
                            </Badge>
                          </TableCell>
                          <TableCell className="overflow-hidden" style={{ width: '120px', maxWidth: '120px' }}>
                            <div className="truncate">
                              {formatDate(detail.created_date || detail.createdDate)}
                            </div>
                          </TableCell>
                          <TableCell className="overflow-hidden" style={{ width: '120px', maxWidth: '120px' }}>
                            <div className="truncate">
                              {formatDate(detail.closed_date || detail.closedDate)}
                            </div>
                          </TableCell>
                          <TableCell className="overflow-hidden" style={{ width: '100px', maxWidth: '100px' }}>
                            <Badge variant={detail.status === 'Closed' ? "success" : detail.status === 'In Progress' ? "warning" : "secondary"}>
                              {detail.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No details available for this metric</p>
      </div>
    );
  };

  const renderIndividualDetails = () => {
    if (!data) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }

    const { member, metric, details } = data;
    
    if (metric === 'sct') {
      const validSctValues = details
        .map(d => d.sct || d.case_age_days)
        .filter(val => val != null && !isNaN(val) && val > 0);
      const fastestResolution = validSctValues.length > 0 ? Math.min(...validSctValues) : 'N/A';
      const slowestResolution = validSctValues.length > 0 ? Math.max(...validSctValues) : 'N/A';
      
      return (
        <div className="space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex justify-end items-center mb-4">
              {onAnalyzeSCT && (
                <Button 
                  onClick={onAnalyzeSCT}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Analyze SCT
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Average SCT</p>
                <p className="font-bold text-2xl text-blue-600">{parseFloat(member.sct).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Cases Analyzed</p>
                <p className="font-bold text-2xl text-green-600">{details.length}</p>
                <p className="text-xs text-muted-foreground">total cases</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Fastest Resolution</p>
                <p className="font-bold text-2xl text-emerald-600">{fastestResolution}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Slowest Resolution</p>
                <p className="font-bold text-2xl text-orange-600">{slowestResolution}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 border rounded-lg">
            <div className="flex-1 overflow-auto min-h-0" style={{ maxHeight: 'calc(80vh - 300px)' }}>
              <div className="min-w-full">
                <Table style={{ tableLayout: 'fixed', width: '100%' }}>
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('case_id')}>
                        <div className="flex items-center gap-1">
                          Case ID
                          {renderSortIcon('case_id')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '130px', maxWidth: '130px' }} onClick={() => handleSort('products')}>
                        <div className="flex items-center gap-1">
                          Product
                          {renderSortIcon('products')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '250px', maxWidth: '250px' }} onClick={() => handleSort('title')}>
                        <div className="flex items-center gap-1">
                          Title
                          {renderSortIcon('title')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '90px', maxWidth: '90px' }} onClick={() => handleSort('priority')}>
                        <div className="flex items-center gap-1">
                          Priority
                          {renderSortIcon('priority')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('created_date')}>
                        <div className="flex items-center gap-1">
                          Created
                          {renderSortIcon('created_date')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('closed_date')}>
                        <div className="flex items-center gap-1">
                          Closed
                          {renderSortIcon('closed_date')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '100px', maxWidth: '100px' }} onClick={() => handleSort('sct')}>
                        <div className="flex items-center gap-1">
                          SCT (Days)
                          {renderSortIcon('sct')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const sortedData = sortField ? sortData(details, sortField, sortDirection) : details;
                      
                      return sortedData.map((detail: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell 
                            title={detail.case_id || detail.caseId || 'N/A'}
                            className="font-mono text-sm truncate" 
                            style={{ width: '120px', maxWidth: '120px' }}
                          >
                            {detail.case_id || detail.caseId || 'N/A'}
                          </TableCell>
                          <TableCell 
                            title={detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}
                            className="text-sm truncate" 
                            style={{ width: '130px', maxWidth: '130px' }}
                          >
                            {detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}
                          </TableCell>
                          <TableCell 
                            title={detail.title || 'N/A'}
                            className="truncate" 
                            style={{ width: '250px', maxWidth: '250px' }}
                          >
                            {detail.title || 'N/A'}
                          </TableCell>
                          <TableCell style={{ width: '90px', maxWidth: '90px' }}>
                            <Badge variant={detail.priority === 'P1' ? "destructive" : detail.priority === 'P2' ? "warning" : "secondary"}>
                              {detail.priority || 'Medium'}
                            </Badge>
                          </TableCell>
                          <TableCell 
                            style={{ width: '120px', maxWidth: '120px' }}
                            className="truncate"
                          >
                            {formatDate(detail.created_date || detail.createdDate)}
                          </TableCell>
                          <TableCell 
                            style={{ width: '120px', maxWidth: '120px' }}
                            className="truncate"
                          >
                            {formatDate(detail.closed_date || detail.closedDate)}
                          </TableCell>
                          <TableCell style={{ width: '100px', maxWidth: '100px' }}>
                            <Badge variant={(detail.case_age_days || detail.sct) > 20 ? "destructive" : (detail.case_age_days || detail.sct) < 10 ? "success" : "secondary"}>
                              {detail.case_age_days || detail.sct || 0}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (metric === 'cases') {
      const p1Cases = details.filter(d => d.priority === 'P1').length;
      const p2Cases = details.filter(d => d.priority === 'P2').length;
      const p3Cases = details.filter(d => d.priority === 'P3').length;
      const p4Cases = details.filter(d => d.priority === 'P4').length;
      
      return (
        <div className="space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Total Cases</p>
                <p className="font-bold text-3xl text-blue-600">{member.cases}</p>
                <p className="text-xs text-muted-foreground">all cases</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Priority Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-300 font-medium mb-1">P1 - Critical</p>
                  <p className="font-bold text-2xl text-red-600">{p1Cases}</p>
                  <p className="text-xs text-red-600/70">urgent cases</p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="text-orange-700 dark:text-orange-300 font-medium mb-1">P2 - High</p>
                  <p className="font-bold text-2xl text-orange-600">{p2Cases}</p>
                  <p className="text-xs text-orange-600/70">high priority</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-yellow-700 dark:text-yellow-300 font-medium mb-1">P3 - Medium</p>
                  <p className="font-bold text-2xl text-yellow-600">{p3Cases}</p>
                  <p className="text-xs text-yellow-600/70">medium priority</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">P4 - Low</p>
                  <p className="font-bold text-2xl text-blue-600">{p4Cases}</p>
                  <p className="text-xs text-blue-600/70">low priority</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 border rounded-lg">
            <div className="flex-1 overflow-auto min-h-0" style={{ maxHeight: 'calc(80vh - 300px)' }}>
              <div className="min-w-full">
                <Table style={{ tableLayout: 'fixed', width: '100%' }}>
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('case_id')}>
                        <div className="flex items-center gap-1">
                          Case ID
                          {renderSortIcon('case_id')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '130px', maxWidth: '130px' }} onClick={() => handleSort('products')}>
                        <div className="flex items-center gap-1">
                          Product
                          {renderSortIcon('products')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '250px', maxWidth: '250px' }} onClick={() => handleSort('title')}>
                        <div className="flex items-center gap-1">
                          Title
                          {renderSortIcon('title')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '90px', maxWidth: '90px' }} onClick={() => handleSort('priority')}>
                        <div className="flex items-center gap-1">
                          Priority
                          {renderSortIcon('priority')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('created_date')}>
                        <div className="flex items-center gap-1">
                          Created
                          {renderSortIcon('created_date')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '120px', maxWidth: '120px' }} onClick={() => handleSort('closed_date')}>
                        <div className="flex items-center gap-1">
                          Closed
                          {renderSortIcon('closed_date')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" style={{ width: '100px', maxWidth: '100px' }} onClick={() => handleSort('status')}>
                        <div className="flex items-center gap-1">
                          Status
                          {renderSortIcon('status')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const sortedData = sortField ? sortData(details, sortField, sortDirection) : details;
                      
                      return sortedData.map((detail: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell 
                            title={detail.case_id || detail.caseId || 'N/A'}
                            className="font-mono text-sm truncate" 
                            style={{ width: '120px', maxWidth: '120px' }}
                          >
                            {detail.case_id || detail.caseId || 'N/A'}
                          </TableCell>
                          <TableCell 
                            title={detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}
                            className="text-sm truncate" 
                            style={{ width: '130px', maxWidth: '130px' }}
                          >
                            {detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}
                          </TableCell>
                          <TableCell 
                            title={detail.title || 'N/A'}
                            className="truncate" 
                            style={{ width: '250px', maxWidth: '250px' }}
                          >
                            {detail.title || 'N/A'}
                          </TableCell>
                          <TableCell style={{ width: '90px', maxWidth: '90px' }}>
                            <Badge variant={detail.priority === 'P1' ? "destructive" : detail.priority === 'P2' ? "warning" : "secondary"}>
                              {detail.priority || 'Medium'}
                            </Badge>
                          </TableCell>
                          <TableCell 
                            style={{ width: '120px', maxWidth: '120px' }}
                            className="truncate"
                          >
                            {formatDate(detail.created_date || detail.createdDate)}
                          </TableCell>
                          <TableCell 
                            style={{ width: '120px', maxWidth: '120px' }}
                            className="truncate"
                          >
                            {formatDate(detail.closed_date || detail.closedDate)}
                          </TableCell>
                          <TableCell style={{ width: '100px', maxWidth: '100px' }}>
                            <Badge variant={detail.status === 'Closed' ? "success" : detail.status === 'In Progress' ? "warning" : "secondary"}>
                              {detail.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderSurveyDetails = () => (
    <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  Rating Category
                  {renderSortIcon('name')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('value')}>
                <div className="flex items-center gap-1">
                  Count
                  {renderSortIcon('value')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('percentage')}>
                <div className="flex items-center gap-1">
                  Percentage
                  {renderSortIcon('percentage')}
                </div>
              </TableHead>
              <TableHead>Trend (vs Last Month)</TableHead>
              <TableHead>Comments Sample</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              if (!data) return null;
              const sortedData = sortField ? sortData(data, sortField, sortDirection) : data;
              
              return sortedData.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.value}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.percentage > 50 ? "success" : item.percentage < 20 ? "destructive" : "secondary"}>
                      {item.percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={index === 0 ? "success" : index === 2 ? "destructive" : "secondary"}>
                      {index === 0 ? "+3%" : index === 2 ? "-1%" : "+0.5%"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {index === 0 && "Excellent support, very helpful"}
                    {index === 1 && "Response was okay, could be faster"}
                    {index === 2 && "Took too long to resolve issue"}
                  </TableCell>
                </TableRow>
              ));
            })()}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-card p-4 rounded-lg border">
          <h4 className="font-semibold text-sm text-muted-foreground">Key Insights</h4>
          <ul className="text-sm text-foreground space-y-1 mt-2">
            <li>• 78% customers highly satisfied (4-5 rating)</li>
            <li>• 6% dissatisfaction rate (lowest in 6 months)</li>
            <li>• Response time main factor in ratings</li>
            <li>• Technical expertise highly appreciated</li>
          </ul>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <h4 className="font-semibold text-sm text-muted-foreground">Action Items</h4>
          <ul className="text-sm text-foreground space-y-1 mt-2">
            <li>• Reduce average response time by 20%</li>
            <li>• Implement proactive communication</li>
            <li>• Focus on first-contact resolution</li>
            <li>• Enhanced follow-up procedures</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] h-[80vh] max-w-none flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold">{getModalTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {type === 'team' ? renderTeamDetails() : type === 'survey' ? renderSurveyDetails() : renderIndividualDetails()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailedStatsModal;