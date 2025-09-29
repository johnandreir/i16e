import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImprovedInsightsPanel from '@/components/dashboard/ImprovedInsightsPanel';

interface Insight {
  id: string;
  type: 'improvement' | 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  recommendation?: string;
  member?: string;
  category?: string;
  caseId?: string;
  caseTitle?: string;
}

// Sample insights data for demonstration
const sampleInsights: Insight[] = [
  {
    id: 'summary-1',
    type: 'info',
    title: 'SCT Analysis Summary',
    description: 'Average Solution Cycle Time (SCT) is 15.3 days, which is higher than the team average of 12.1 days. Most cases show email communication issues and process delays that could be addressed to improve overall performance.',
    recommendation: 'Areas for improvement: Reduce engineer response intervals exceeding 3 days during customer or backend waiting periods., Enhance upfront verification of customer submissions to avoid repeated data requests., Strengthen proactive communication strategies during extended investigations or third-party delays.\nStrengths: Consistent professional and empathetic communication across examined cases., Effective use of alternative methods to overcome tool access and installation issues., Demonstrated ability to handle straightforward cases swiftly and conclusively.',
    category: 'process'
  },
  {
    id: 'email-1',
    type: 'warning',
    title: 'Email Communication Analysis: Case TM-02403208',
    description: 'Case took 7 days for initial customer response. Customer sent 3 follow-up emails before receiving a response. The initial troubleshooting questions were incomplete, requiring additional back-and-forth communication that extended the resolution time.',
    recommendation: 'Implement 24-hour SLA for initial customer response\nUse template for comprehensive initial troubleshooting questions\nSet up automatic acknowledgment emails',
    category: 'communication',
    caseId: 'TM-03653642',
    caseTitle: '[PCT-72561] Hosts remain in "Unmanaged endpoints" status'
  },
  {
    id: 'delay-1',
    type: 'error',
    title: 'Process Delay Analysis: Case TM-02403208',
    description: 'Case was reassigned 3 times between support tiers, adding 5 days to the resolution time. Each handoff required re-explanation of the issue. The final engineer spent 2 days waiting for environment access before starting troubleshooting.',
    recommendation: 'Improve case handoff documentation\nImplement "buddy system" for warm handoffs between support tiers\nEstablish proactive access management for support engineers',
    category: 'process',
    caseId: 'TM-03653642',
    caseTitle: '[PCT-72561] Hosts remain in "Unmanaged endpoints" status'
  },
  {
    id: 'email-2',
    type: 'warning',
    title: 'Email Communication Analysis: Case TM-03737488',
    description: 'Technical jargon in emails confused the customer, resulting in misunderstanding of the required actions. Customer had to request clarification twice, adding 3 days to resolution time. Some instructions provided were for a different product version than what the customer was using.',
    recommendation: 'Use plain language in customer communications\nVerify product version before sending instructions\nCreate a glossary of technical terms for customer reference',
    category: 'communication',
    caseId: 'TM-03737488',
    caseTitle: 'Unable to uninstall Apex One agent'
  },
  {
    id: 'delay-2',
    type: 'error',
    title: 'Process Delay Analysis: Case TM-03737488',
    description: 'Escalation to engineering team took 4 days due to incomplete logs and system information. Once escalated, the engineering team took 3 days to begin work due to sprint commitments. Resolution was delayed by weekend coverage gaps.',
    recommendation: 'Create checklist for required information before escalation\nEstablish dedicated engineering resources for escalations\nImplement weekend coverage for high-priority cases',
    category: 'process',
    caseId: 'TM-03737488',
    caseTitle: 'Unable to uninstall Apex One agent'
  },
  {
    id: 'email-3',
    type: 'warning',
    title: 'Email Communication Analysis: Case TM-03678361',
    description: 'Multiple engineers responded to customer emails, causing confusion about who owned the case. Different engineers provided conflicting troubleshooting steps. Response times varied from 2 hours to 2 days between emails.',
    recommendation: 'Assign single point of contact for each case\nEstablish internal communication channel for engineers working on the same case\nImplement consistent email signature with case ownership information',
    category: 'communication',
    caseId: 'TM-03775559',
    caseTitle: 'Enable license management'
  },
  {
    id: 'delay-3',
    type: 'error',
    title: 'Process Delay Analysis: Case TM-03678361',
    description: 'Required security approval for customer environment access took 5 days. Support engineer couldn\'t proceed with troubleshooting during this time. Once access was granted, resolution was completed within 1 day.',
    recommendation: 'Implement expedited security approval process for support cases\nDevelop alternative troubleshooting approaches that don\'t require direct environment access\nBuild library of secure remote diagnostic tools',
    category: 'process',
    caseId: 'TM-03775559',
    caseTitle: 'Enable license management'
  },
  {
    id: 'cx-summary-1',
    type: 'info',
    title: 'Customer Satisfaction Summary',
    description: 'Overall satisfaction score is 4.2/5, which is slightly below target of 4.5/5. Response time and technical accuracy received the highest ratings, while communication clarity and case ownership received the lowest.',
    recommendation: 'Focus on improving communication clarity\nEnsure consistent case ownership throughout the resolution process\nProvide more proactive status updates to customers',
    category: 'satisfaction'
  },
  {
    id: 'cx-1',
    type: 'warning',
    title: 'Customer Feedback: CSAT Survey, Case 12345',
    description: 'Customer rated overall experience 3/5. Positive feedback for technical solution, but negative feedback for time to resolution and communication frequency. Customer commented: "Solution worked well but took too long to implement. Would appreciate more frequent updates."',
    recommendation: 'Implement regular status update cadence\nProvide estimated resolution timelines\nFollow up after case closure to ensure satisfaction',
    category: 'satisfaction'
  }
];

const SCTInsightsExample = () => {
  const [sctAnalyzed, setSctAnalyzed] = useState(false);
  const [cxAnalyzed, setCxAnalyzed] = useState(false);

  const handleAnalyzeSCT = () => {
    setSctAnalyzed(true);
  };

  const handleCXInsight = () => {
    setCxAnalyzed(true);
  };

  const getAllInsights = () => {
    return sampleInsights;
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">SCT Insights Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={handleAnalyzeSCT} disabled={sctAnalyzed}>
              {sctAnalyzed ? 'SCT Analyzed' : 'Analyze SCT'}
            </Button>
            <Button onClick={handleCXInsight} disabled={cxAnalyzed}>
              {cxAnalyzed ? 'CX Analyzed' : 'CX Insight'}
            </Button>
          </div>
          
          <ImprovedInsightsPanel
            insights={getAllInsights()}
            onAnalyzeSCT={handleAnalyzeSCT}
            onCXInsight={handleCXInsight}
            sctAnalyzed={sctAnalyzed}
            cxAnalyzed={cxAnalyzed}
            selectedEntity="Example Team"
            isAnalysisEnabled={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SCTInsightsExample;