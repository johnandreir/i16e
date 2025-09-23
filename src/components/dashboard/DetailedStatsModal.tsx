import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { X, Clock } from 'lucide-react';
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

  const renderTeamDetails = () => {
    // When type='team', we're actually showing case details for a squad within a team
    // The data structure is { member, metric, details } just like individual view
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground text-lg">{member.name} - SCT Analysis - Detailed Analysis</h3>
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
                <p className="font-bold text-2xl text-blue-600">{member.sct}</p>
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
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Case Owner</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Closed</TableHead>
                <TableHead>SCT (Days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((detail: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{detail.case_id || detail.caseId || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{detail.owner_full_name || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}</TableCell>
                  <TableCell>{detail.title || 'N/A'}</TableCell>
                  <TableCell>
                  <Badge variant={detail.priority === 'P1' ? "destructive" : detail.priority === 'P2' ? "warning" : "secondary"}>
                    {detail.priority || 'Medium'}
                  </Badge>
                  </TableCell>
                  <TableCell>{formatDate(detail.created_date || detail.createdDate)}</TableCell>
                  <TableCell>{formatDate(detail.closed_date || detail.closedDate)}</TableCell>
                  <TableCell>
                    <Badge variant={(detail.case_age_days || detail.sct) > 20 ? "destructive" : (detail.case_age_days || detail.sct) < 10 ? "success" : "secondary"}>
                      {detail.case_age_days || detail.sct || 0}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    
    if (metric === 'cases') {
      const p1Cases = details.filter(d => d.priority === 'P1').length;
      const p2Cases = details.filter(d => d.priority === 'P2').length;
      const p3Cases = details.filter(d => d.priority === 'P3').length;
      const p4Cases = details.filter(d => d.priority === 'P4').length;
      const closedCases = details.filter(d => d.status === 'Closed').length;
      const openCases = details.length - closedCases;
      
      return (
        <div className="space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold text-foreground mb-4 text-lg">{member.name} - Cases Analysis - Detailed Analysis</h3>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Total Cases</p>
                <p className="font-bold text-3xl text-blue-600">{member.cases}</p>
                <p className="text-xs text-muted-foreground">all cases</p>
              </div>
            </div>

            {/* Priority Breakdown */}
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
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Case Owner</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Closed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((detail: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{detail.case_id || detail.caseId || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{detail.owner_full_name || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}</TableCell>
                  <TableCell>{detail.title || 'N/A'}</TableCell>
                  <TableCell>
                  <Badge variant={detail.priority === 'P1' ? "destructive" : detail.priority === 'P2' ? "warning" : "secondary"}>
                    {detail.priority || 'Medium'}
                  </Badge>
                  </TableCell>
                  <TableCell>{formatDate(detail.created_date || detail.createdDate)}</TableCell>
                  <TableCell>{formatDate(detail.closed_date || detail.closedDate)}</TableCell>
                  <TableCell>
                    <Badge variant={detail.status === 'Closed' ? "success" : detail.status === 'In Progress' ? "warning" : "secondary"}>
                      {detail.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (metric === 'satisfaction') {
      return (
        <div className="space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold text-foreground mb-2">{member.name} - Customer Satisfaction Analysis</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Average Satisfaction</p>
                <p className="font-semibold text-lg">{member.satisfaction}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Responses</p>
                <p className="font-semibold text-lg">{details.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Highest Rating</p>
                <p className="font-semibold text-lg">{Math.max(...details.map(d => d.satisfaction || 0))}%</p>
              </div>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Case Owner</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Closed</TableHead>
                <TableHead>CSAT</TableHead>
                <TableHead>Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((detail: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{detail.case_id || detail.caseId || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{detail.owner_full_name || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}</TableCell>
                  <TableCell>
                  <Badge variant={detail.priority === 'P1' ? "destructive" : detail.priority === 'P2' ? "warning" : "secondary"}>
                    {detail.priority || 'Medium'}
                  </Badge>
                  </TableCell>
                  <TableCell>{formatDate(detail.created_date || detail.createdDate)}</TableCell>
                  <TableCell>{formatDate(detail.closed_date || detail.closedDate)}</TableCell>
                  <TableCell>
                    <Badge variant={detail.satisfaction > 80 ? "success" : detail.satisfaction < 60 ? "destructive" : "warning"}>
                      {detail.satisfaction || 0}%
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{detail.feedback || 'No feedback'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    // Default fallback
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground text-lg">{member.name} - SCT Analysis - Detailed Analysis</h3>
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
                <p className="font-bold text-2xl text-blue-600">{member.sct}</p>
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
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Closed</TableHead>
                <TableHead>SCT (Days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((detail: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{detail.case_id || detail.caseId || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}</TableCell>
                  <TableCell>{detail.title || 'N/A'}</TableCell>
                  <TableCell>
                  <Badge variant={detail.priority === 'P1' ? "destructive" : detail.priority === 'P2' ? "warning" : "secondary"}>
                    {detail.priority || 'Medium'}
                  </Badge>
                  </TableCell>
                  <TableCell>{formatDate(detail.created_date || detail.createdDate)}</TableCell>
                  <TableCell>{formatDate(detail.closed_date || detail.closedDate)}</TableCell>
                  <TableCell>
                    <Badge variant={(detail.case_age_days || detail.sct) > 20 ? "destructive" : (detail.case_age_days || detail.sct) < 10 ? "success" : "secondary"}>
                      {detail.case_age_days || detail.sct || 0}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    
    if (metric === 'cases') {
      const p1Cases = details.filter(d => d.priority === 'P1').length;
      const p2Cases = details.filter(d => d.priority === 'P2').length;
      const p3Cases = details.filter(d => d.priority === 'P3').length;
      const p4Cases = details.filter(d => d.priority === 'P4').length;
      const closedCases = details.filter(d => d.status === 'Closed').length;
      const openCases = details.length - closedCases;
      
      return (
        <div className="space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold text-foreground mb-4 text-lg">{member.name} - Cases Analysis - Detailed Analysis</h3>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-muted-foreground font-medium mb-1">Total Cases</p>
                <p className="font-bold text-3xl text-blue-600">{member.cases}</p>
                <p className="text-xs text-muted-foreground">all cases</p>
              </div>
            </div>

            {/* Priority Breakdown */}
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
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Closed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((detail: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{detail.case_id || detail.caseId || 'N/A'}</TableCell>
                  <TableCell className="text-sm">{detail.products ? (Array.isArray(detail.products) ? detail.products.join(', ') : detail.products) : 'N/A'}</TableCell>
                  <TableCell>{detail.title || 'N/A'}</TableCell>
                  <TableCell>
                  <Badge variant={detail.priority === 'P1' ? "destructive" : detail.priority === 'P2' ? "warning" : "secondary"}>
                    {detail.priority || 'Medium'}
                  </Badge>
                  </TableCell>
                  <TableCell>{formatDate(detail.created_date || detail.createdDate)}</TableCell>
                  <TableCell>{formatDate(detail.closed_date || detail.closedDate)}</TableCell>
                  <TableCell>
                    <Badge variant={detail.status === 'Closed' ? "success" : detail.status === 'In Progress' ? "warning" : "secondary"}>
                      {detail.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    
    if (metric === 'satisfaction') {
      return (
        <div className="space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold text-foreground mb-2">{member.name} - Customer Satisfaction</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Overall CSAT</p>
                <p className="font-semibold text-lg">{member.satisfaction}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Surveys</p>
                <p className="font-semibold text-lg">{details.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">5-Star Ratings</p>
                <p className="font-semibold text-lg">{details.filter(d => d.rating === 5).length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Rating</p>
                <p className="font-semibold text-lg">{(details.reduce((acc, d) => acc + d.rating, 0) / details.length).toFixed(1)}/5</p>
              </div>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survey ID</TableHead>
                <TableHead>Case ID</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((detail: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{detail.surveyId}</TableCell>
                  <TableCell className="font-mono text-sm">{detail.caseId}</TableCell>
                  <TableCell>
                    <Badge variant={detail.rating >= 4 ? "success" : detail.rating >= 3 ? "warning" : "destructive"}>
                      {detail.rating}/5
                    </Badge>
                  </TableCell>
                  <TableCell>{detail.category}</TableCell>
                  <TableCell className="max-w-xs truncate">{detail.comment}</TableCell>
                  <TableCell>{detail.submittedDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    
    return null;
  };
  const renderSurveyDetails = () => (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rating Category</TableHead>
            <TableHead>Count</TableHead>
            <TableHead>Percentage</TableHead>
            <TableHead>Trend (vs Last Month)</TableHead>
            <TableHead>Comments Sample</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((item: any, index: number) => (
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
          ))}
        </TableBody>
      </Table>

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title} - Detailed Analysis</DialogTitle>
        </DialogHeader>
        
        <div className="mt-6">
          {type === 'team' ? renderTeamDetails() : type === 'survey' ? renderSurveyDetails() : renderIndividualDetails()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailedStatsModal;