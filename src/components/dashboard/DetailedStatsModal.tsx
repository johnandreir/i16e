import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DetailedStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: 'team' | 'survey' | 'individual';
  title: string;
}

const DetailedStatsModal: React.FC<DetailedStatsModalProps> = ({
  isOpen,
  onClose,
  data,
  type,
  title
}) => {
  const renderTeamDetails = () => (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DPE Name</TableHead>
            <TableHead>SCT (Days)</TableHead>
            <TableHead>Cases Close</TableHead>
            <TableHead>Avg Response Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((member: any, index: number) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>
                <Badge variant={member.sct > 18 ? "destructive" : member.sct < 14 ? "success" : "secondary"}>
                  {member.sct}
                </Badge>
              </TableCell>
              <TableCell>{member.cases}</TableCell>
              <TableCell>{Math.floor(Math.random() * 3) + 2}h</TableCell>
              <TableCell>
                <Badge variant={member.satisfaction > 85 ? "success" : "warning"}>
                  {member.satisfaction > 85 ? "Excellent" : "Needs Improvement"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-card p-4 rounded-lg border">
          <h4 className="font-semibold text-sm text-muted-foreground">Top Performer</h4>
          <p className="text-lg font-bold text-foreground">Sofia Lopez</p>
          <p className="text-sm text-muted-foreground">11-day SCT, 94% CSAT</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <h4 className="font-semibold text-sm text-muted-foreground">Needs Attention</h4>
          <p className="text-lg font-bold text-foreground">Diego Martinez</p>
          <p className="text-sm text-muted-foreground">22-day SCT, 76% CSAT</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <h4 className="font-semibold text-sm text-muted-foreground">Team Average</h4>
          <p className="text-lg font-bold text-foreground">15.2 days SCT</p>
          <p className="text-sm text-muted-foreground">86% CSAT, 45 cases/month</p>
        </div>
      </div>
    </div>
  );

  const renderIndividualDetails = () => {
    const { member, metric, details } = data;
    
    if (metric === 'sct') {
      return (
        <div className="space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold text-foreground mb-2">{member.name} - Solution Cycle Time Analysis</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Average SCT</p>
                <p className="font-semibold text-lg">{member.sct} days</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cases Analyzed</p>
                <p className="font-semibold text-lg">{details.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fastest Resolution</p>
                <p className="font-semibold text-lg">{Math.min(...details.map(d => d.sct))} days</p>
              </div>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>SCT (Days)</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Closed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((detail: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{detail.caseId}</TableCell>
                  <TableCell>{detail.title}</TableCell>
                  <TableCell>
                    <Badge variant={detail.sct > 20 ? "destructive" : detail.sct < 10 ? "success" : "secondary"}>
                      {detail.sct}
                    </Badge>
                  </TableCell>
                  <TableCell>
                  <Badge variant={detail.priority === 'P1' ? "destructive" : detail.priority === 'P2' ? "warning" : "secondary"}>
                    {detail.priority}
                  </Badge>
                  </TableCell>
                  <TableCell>{detail.createdDate}</TableCell>
                  <TableCell>{detail.closedDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    
    if (metric === 'cases') {
      return (
        <div className="space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold text-foreground mb-2">{member.name} - Cases Close</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Cases</p>
                <p className="font-semibold text-lg">{member.cases}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Closed Cases</p>
                <p className="font-semibold text-lg">{details.filter(d => d.status === 'Closed').length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Response Time</p>
                <p className="font-semibold text-lg">4.2h</p>
              </div>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Customer Rating</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((detail: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{detail.caseId}</TableCell>
                  <TableCell>{detail.title}</TableCell>
                  <TableCell>
                    <Badge variant={detail.status === 'Closed' ? "success" : detail.status === 'In Progress' ? "warning" : "secondary"}>
                      {detail.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                  <Badge variant={detail.priority === 'P1' ? "destructive" : detail.priority === 'P2' ? "warning" : "secondary"}>
                    {detail.priority}
                  </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={detail.customerSat >= 4 ? "success" : detail.customerSat >= 3 ? "warning" : "destructive"}>
                      {detail.customerSat}/5
                    </Badge>
                  </TableCell>
                  <TableCell>{detail.responseTime}</TableCell>
                  <TableCell>{detail.createdDate}</TableCell>
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
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{title} - Detailed Analysis</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          {type === 'team' ? renderTeamDetails() : type === 'survey' ? renderSurveyDetails() : renderIndividualDetails()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailedStatsModal;