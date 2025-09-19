export interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  details?: string;
  responseTime?: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthStatus[];
  lastCheck: Date;
}

class HealthCheckService {
  private healthChecks: Map<string, HealthStatus> = new Map();

  async checkService(name: string, url: string, timeout: number = 5000): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const status: HealthStatus = {
        service: name,
        status: response.ok ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        details: response.ok ? OK () : Error ,
        responseTime
      };

      this.healthChecks.set(name, status);
      return status;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const status: HealthStatus = {
        service: name,
        status: 'unhealthy',
        lastCheck: new Date(),
        details: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      };

      this.healthChecks.set(name, status);
      return status;
    }
  }

  async checkWebhookService(): Promise<HealthStatus> {
    return this.checkService(
      'N8N Webhook',
      'http://localhost:5678/webhook-test/dpe-performance'
    );
  }

  async checkMongoAPI(): Promise<HealthStatus> {
    return this.checkService(
      'MongoDB API',
      'http://localhost:3001/health'
    );
  }

  async checkEurekaAPI(): Promise<HealthStatus> {
    return this.checkService(
      'Eureka API',
      'https://eureka-api.example.com/health'
    );
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const services = Array.from(this.healthChecks.values());
    
    let overall: SystemHealth['overall'] = 'healthy';
    
    if (services.some(s => s.status === 'unhealthy')) {
      overall = services.every(s => s.status === 'unhealthy') ? 'unhealthy' : 'degraded';
    }

    return {
      overall,
      services,
      lastCheck: new Date()
    };
  }

  getServiceStatus(serviceName: string): HealthStatus | undefined {
    return this.healthChecks.get(serviceName);
  }

  async checkAllServices(): Promise<SystemHealth> {
    await Promise.all([
      this.checkWebhookService(),
      this.checkMongoAPI(),
      this.checkEurekaAPI()
    ]);

    return this.getSystemHealth();
  }
}

export const healthCheckService = new HealthCheckService();
