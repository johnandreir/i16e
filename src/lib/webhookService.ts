export interface WebhookPayload {
  entityType: 'dpe' | 'squad' | 'team';
  entityName: string;
  ownerNames: string[];
  dateRange: {
    from: string;
    to: string;
  };
  eurekaDateRange: string;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: {
    cases?: any;
    performance?: any;
    ownerNames?: string[];
  };
}

export class WebhookService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = 'http://localhost:5678/webhook-test/dpe-performance';
  }

  private getOwnerNames(entityType: string, entityName: string, entityMappings: any): string[] {
    switch (entityType) {
      case 'dpe':
        return [entityName];
      case 'squad':
        const squadMembers = entityMappings?.squads?.[entityName];
        if (squadMembers && Array.isArray(squadMembers)) {
          return squadMembers;
        } else {
          console.warn('No squad mapping found for:', entityName);
          return [];
        }
      case 'team':
        const teamMembers = entityMappings?.teams?.[entityName];
        if (teamMembers && Array.isArray(teamMembers)) {
          return teamMembers;
        } else {
          console.warn('No team mapping found for:', entityName);
          return [];
        }
      default:
        console.error('Unknown entity type:', entityType);
        return [];
    }
  }

  async isWebhookAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.status === 200 || response.status === 405;
    } catch (error) {
      console.log('Webhook not available:', error);
      return false;
    }
  }

  async triggerWebhook(
    entityType: 'dpe' | 'squad' | 'team',
    entityName: string,
    dateRange: { from: Date; to: Date },
    entityMappings: any
  ): Promise<WebhookResponse> {
    try {
      const ownerNames = this.getOwnerNames(entityType, entityName, entityMappings);
      
      if (ownerNames.length === 0) {
        throw new Error(`No owner names found for ${entityType}: ${entityName}`);
      }

      const formattedDateRange = {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      };

      const eurekaDateRange = `${dateRange.from.toISOString().split('T')[0]}T00:00:00Z TO ${dateRange.to.toISOString().split('T')[0]}T23:59:59Z`;

      const payload: WebhookPayload = {
        entityType,
        entityName,
        ownerNames,
        dateRange: formattedDateRange,
        eurekaDateRange
      };

      console.log('Triggering webhook:', this.webhookUrl);

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();

      return {
        success: true,
        message: 'Webhook triggered successfully',
        data: responseData
      };

    } catch (error) {
      console.error('Webhook trigger failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown webhook error'
      };
    }
  }

  async checkWebhookStatus(): Promise<{ reachable: boolean; message: string }> {
    try {
      const isAvailable = await this.isWebhookAvailable();
      return {
        reachable: isAvailable,
        message: isAvailable ? 'Webhook is reachable' : 'Webhook is not reachable'
      };
    } catch (error) {
      return {
        reachable: false,
        message: error instanceof Error ? error.message : 'Failed to check webhook status'
      };
    }
  }

  async triggerCaseReportWorkflow(
    entityType: 'dpe' | 'squad' | 'team',
    entityName: string,
    timeRange: { from: Date; to: Date },
    entityMappings?: any
  ): Promise<{ success: boolean; message: string }> {
    return await this.triggerWebhook(entityType, entityName, timeRange, entityMappings);
  }
}

export const webhookService = new WebhookService();
