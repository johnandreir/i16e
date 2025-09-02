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
  type: 'team' | 'survey';
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
            <TableHead>Cases Handled</TableHead>
            <TableHead>CSAT %</TableHead>
            <TableHead>Avg Response Time</TableHead>
            <TableHead>Complexity Score</TableHead>
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
              <TableCell>
                <Badge variant={member.satisfaction > 90 ? "success" : member.satisfaction < 80 ? "destructive" : "secondary"}>
                  {member.satisfaction}%
                </Badge>
              </TableCell>
              <TableCell>{Math.floor(Math.random() * 3) + 2}h</TableCell>
              <TableCell>{(Math.random() * 2 + 7).toFixed(1)}/10</TableCell>
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
          {type === 'team' ? renderTeamDetails() : renderSurveyDetails()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailedStatsModal;