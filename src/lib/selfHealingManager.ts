import { healthCheckService, HealthStatus, SystemHealth } from './healthCheckService';

export interface SelfHealingConfig {
  enabled: boolean;
  checkInterval: number; // ms
  retryAttempts: number;
  retryDelay: number; // ms
  autoRestart: boolean;
}

export interface HealingAction {
  id: string;
  timestamp: Date;
  service: string;
  action: 'restart' | 'reconnect' | 'fallback' | 'alert';
  status: 'pending' | 'success' | 'failed';
  details: string;
}

class SelfHealingManager {
  private config: SelfHealingConfig = {
    enabled: true,
    checkInterval: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
    autoRestart: false, // Disabled for safety
  };

  private intervalId: NodeJS.Timeout | null = null;
  private healingActions: HealingAction[] = [];
  private isHealing = false;

  start() {
    if (!this.config.enabled || this.intervalId) {
      return;
    }

    console.log('Self-healing manager started');
    
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);

    // Initial check
    this.performHealthCheck();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Self-healing manager stopped');
    }
  }

  private async performHealthCheck() {
    if (this.isHealing) {
      return; // Avoid overlapping healing attempts
    }

    try {
      const systemHealth = await healthCheckService.checkAllServices();
      
      if (systemHealth.overall !== 'healthy') {
        await this.attemptHealing(systemHealth);
      }
    } catch (error) {
      console.error('Self-healing health check failed:', error);
    }
  }

  private async attemptHealing(systemHealth: SystemHealth) {
    this.isHealing = true;
    
    try {
      const unhealthyServices = systemHealth.services.filter(s => s.status === 'unhealthy');
      
      for (const service of unhealthyServices) {
        await this.healService(service);
      }
    } catch (error) {
      console.error('Self-healing attempt failed:', error);
    } finally {
      this.isHealing = false;
    }
  }

  private async healService(service: HealthStatus) {
    const actionId = heal__;
    
    const action: HealingAction = {
      id: actionId,
      timestamp: new Date(),
      service: service.service,
      action: 'reconnect', // Default action
      status: 'pending',
      details: Attempting to heal : 
    };

    this.healingActions.push(action);
    console.log(Self-healing: );

    try {
      // Determine healing strategy based on service
      switch (service.service) {
        case 'N8N Webhook':
          await this.healWebhookService(action);
          break;
        case 'MongoDB API':
          await this.healMongoService(action);
          break;
        case 'Eureka API':
          await this.healEurekaService(action);
          break;
        default:
          action.status = 'failed';
          action.details += ' - Unknown service type';
      }
    } catch (error) {
      action.status = 'failed';
      action.details +=  - ;
    }

    // Update action in the array
    const index = this.healingActions.findIndex(a => a.id === actionId);
    if (index >= 0) {
      this.healingActions[index] = action;
    }
  }

  private async healWebhookService(action: HealingAction) {
    // Try to reconnect to webhook service
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      action.details +=  - Attempt /;
      
      const status = await healthCheckService.checkWebhookService();
      
      if (status.status === 'healthy') {
        action.status = 'success';
        action.details += ' - Service restored';
        return;
      }
      
      if (attempt < this.config.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }
    
    action.status = 'failed';
    action.details += ' - All retry attempts failed';
  }

  private async healMongoService(action: HealingAction) {
    // Similar retry logic for MongoDB
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      action.details +=  - Attempt /;
      
      const status = await healthCheckService.checkMongoAPI();
      
      if (status.status === 'healthy') {
        action.status = 'success';
        action.details += ' - Service restored';
        return;
      }
      
      if (attempt < this.config.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }
    
    action.status = 'failed';
    action.details += ' - All retry attempts failed';
  }

  private async healEurekaService(action: HealingAction) {
    // Similar retry logic for Eureka API
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      action.details +=  - Attempt /;
      
      const status = await healthCheckService.checkEurekaAPI();
      
      if (status.status === 'healthy') {
        action.status = 'success';
        action.details += ' - Service restored';
        return;
      }
      
      if (attempt < this.config.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }
    
    action.status = 'failed';
    action.details += ' - All retry attempts failed';
  }

  getConfig(): SelfHealingConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SelfHealingConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.intervalId && newConfig.enabled === false) {
      this.stop();
    } else if (!this.intervalId && newConfig.enabled === true) {
      this.start();
    }
  }

  getHealingHistory(): HealingAction[] {
    return [...this.healingActions].reverse(); // Most recent first
  }

  clearHistory() {
    this.healingActions = [];
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

export const selfHealingManager = new SelfHealingManager();
