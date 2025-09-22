import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Database, Activity, Zap, Server, Workflow } from 'lucide-react';

interface BackendStatusProps {
  className?: string;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown' | 'checking';
  lastCheck: Date;
  details?: string;
  url?: string;
  category: 'database' | 'api' | 'workflow' | 'external';
  priority: 'high' | 'medium' | 'low';
}

interface DetailedHealth {
  mongodb: {
    connected: boolean;
    ping?: string;
    connectionRetries?: number;
    lastPing?: string;
  };
  server: {
    uptime: number;
    memory: any;
    pid: number;
  };
}

const BackendStatus: React.FC<BackendStatusProps> = ({ className }) => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'MongoDB API Server',
      status: 'unknown',
      lastCheck: new Date(),
      details: 'Checking API server status...',
      url: 'http://localhost:3001/api/health',
      category: 'api',
      priority: 'high'
    },
    {
      name: 'MongoDB Database',
      status: 'unknown',
      lastCheck: new Date(),
      details: 'Checking database connection...',
      category: 'database',
      priority: 'high'
    },
    {
      name: 'n8n Workflow Status',
      status: 'unknown',
      lastCheck: new Date(),
      details: 'Checking workflow status...',
      url: 'http://localhost:3001/api/n8n/health',
      category: 'workflow',
      priority: 'high'
    },
    {
      name: 'n8n Webhook Status',
      status: 'unknown',
      lastCheck: new Date(),
      details: 'Checking webhook status...',
      url: 'http://localhost:3001/api/n8n/health',
      category: 'workflow',
      priority: 'medium'
    }
  ]);

  const [isChecking, setIsChecking] = useState(false);
  const [lastGlobalCheck, setLastGlobalCheck] = useState<Date>(new Date());
  const [detailedHealth, setDetailedHealth] = useState<DetailedHealth | null>(null);

  const checkMongoDBAPIHealth = async (): Promise<{ status: ServiceStatus['status'], details: string, health?: DetailedHealth }> => {
    try {
      const response = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return {
          status: 'unhealthy',
          details: `API Error: ${response.status} ${response.statusText}`
        };
      }

      const healthData = await response.json();

      return {
        status: healthData.mongodb?.connected ? 'healthy' : 'unhealthy',
        details: healthData.mongodb?.connected ?
          `API OK, DB Connected (${healthData.mongodb.ping})` :
          `API OK, DB Disconnected (retries: ${healthData.mongodb?.connectionRetries || 0})`,
        health: healthData
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  };

  const checkN8nHealth = async (): Promise<{ status: ServiceStatus['status'], details: string }> => {
    try {
      // Use backend API proxy to check N8N health (avoiding CORS)
      const response = await fetch('http://localhost:3001/api/n8n/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return {
          status: 'unhealthy',
          details: `Backend API error: ${response.status} ${response.statusText}`
        };
      }

      const healthData = await response.json();
      const workflowStatus = healthData.n8nHealth?.n8nWorkflowStatus;

      if (workflowStatus?.reachable) {
        return {
          status: 'healthy',
          details: workflowStatus.message || 'Workflows accessible'
        };
      } else {
        return {
          status: 'unhealthy',
          details: workflowStatus?.message || 'Workflow status unavailable'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Workflow status check failed'
      };
    }
  };

  const checkWebhookHealth = async (): Promise<{ status: ServiceStatus['status'], details: string }> => {
    try {
      // Use backend API proxy to check webhook health (avoiding CORS)
      const response = await fetch('http://localhost:3001/api/n8n/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return {
          status: 'unhealthy',
          details: `Backend API error: ${response.status} ${response.statusText}`
        };
      }

      const healthData = await response.json();
      const webhookStatus = healthData.n8nHealth?.n8nWebhookStatus;
      
      const getCasesHealthy = webhookStatus?.getCases?.reachable;
      const metricsHealthy = webhookStatus?.calculateMetrics?.reachable;
      
      if (getCasesHealthy && metricsHealthy) {
        return {
          status: 'healthy',
          details: 'All webhook endpoints listening'
        };
      } else if (getCasesHealthy || metricsHealthy) {
        return {
          status: 'unhealthy',
          details: 'Some webhook endpoints unavailable'
        };
      } else {
        return {
          status: 'unhealthy',
          details: 'All webhook endpoints unreachable'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error instanceof Error ? error.message : 'Webhook status check failed'
      };
    }
  };

  const checkServiceHealth = async (service: ServiceStatus): Promise<ServiceStatus> => {
    let result: { status: ServiceStatus['status'], details: string, health?: DetailedHealth };

    switch (service.name) {
      case 'MongoDB API Server':
        result = await checkMongoDBAPIHealth();
        if (result.health) {
          setDetailedHealth(result.health);
          // Also update MongoDB Database status based on API health
          setServices(prev => prev.map(s =>
            s.name === 'MongoDB Database'
              ? {
                ...s,
                status: result.health!.mongodb.connected ? 'healthy' : 'unhealthy',
                details: result.health!.mongodb.connected
                  ? `Connected (ping: ${result.health!.mongodb.ping})`
                  : `Disconnected (retries: ${result.health!.mongodb.connectionRetries || 0})`,
                lastCheck: new Date()
              }
              : s
          ));
        }
        break;
      case 'n8n Workflow Status':
        result = await checkN8nHealth();
        break;
      case 'n8n Webhook Status':
        result = await checkWebhookHealth();
        break;
      case 'MongoDB Database':
        // Check if this was recently updated by the API Server check (within last 10 seconds)
        const timeSinceLastCheck = Date.now() - service.lastCheck.getTime();
        if (timeSinceLastCheck < 10000 && service.details && service.details !== 'Checking database connection...') {
          // Recently updated by API check, return current service
          return service;
        }
        
        // Try to get database status directly if not recently updated
        try {
          const apiResult = await checkMongoDBAPIHealth();
          if (apiResult.health?.mongodb) {
            result = {
              status: apiResult.health.mongodb.connected ? 'healthy' : 'unhealthy',
              details: apiResult.health.mongodb.connected
                ? `Connected via API (ping: ${apiResult.health.mongodb.ping})`
                : `Disconnected (retries: ${apiResult.health.mongodb.connectionRetries || 0})`
            };
            
            // Update detailed health if we got it
            if (apiResult.health) {
              setDetailedHealth(apiResult.health);
            }
          } else {
            result = {
              status: 'unhealthy', 
              details: 'Cannot retrieve database status - API Server may be down'
            };
          }
        } catch (error) {
          result = {
            status: 'unhealthy',
            details: 'Database status check failed - API Server unreachable'
          };
        }
        break;
      default:
        result = { status: 'unknown', details: 'Service not implemented' };
    }

    return {
      ...service,
      status: result.status,
      lastCheck: new Date(),
      details: result.details
    };
  };

  const checkAllServices = async () => {
    setIsChecking(true);

    setServices(prev => prev.map(service => ({ ...service, status: 'checking' as const })));

    try {
      const updatedServices = await Promise.all(
        services.map(service => checkServiceHealth(service))
      );

      setServices(updatedServices);
      setLastGlobalCheck(new Date());
    } catch (error) {
      console.error('Failed to check services:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkAllServices();

    // Auto-refresh every 30 seconds
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400">Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryIcon = (category: ServiceStatus['category']) => {
    switch (category) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <Server className="h-4 w-4" />;
      case 'workflow':
        return <Workflow className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const overallHealth = services.every(s => s.status === 'healthy') ? 'healthy' :
    services.some(s => s.status === 'unhealthy') ? 'unhealthy' : 'unknown';

  const criticalServices = services.filter(s => s.priority === 'high' && s.status === 'unhealthy');

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">Backend Services Status</CardTitle>
            {getStatusIcon(overallHealth)}
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(overallHealth)}
            <Button
              onClick={checkAllServices}
              disabled={isChecking}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <CardDescription>
          Real-time monitoring of critical backend dependencies
          {criticalServices.length > 0 && (
            <span className="block text-destructive font-medium mt-1">
              ⚠️ {criticalServices.length} critical service(s) unavailable
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Service Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div
                key={service.name}
                className={`p-3 rounded-lg border ${service.status === 'healthy' ? 'border-green-500/20 bg-green-500/10' :
                    service.status === 'unhealthy' ? 'border-destructive/20 bg-destructive/10' :
                      'border-border bg-muted/50'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(service.category)}
                    <span className="font-medium text-sm text-foreground">{service.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {service.priority === 'high' && (
                      <span title="Critical Service">
                        <Zap className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      </span>
                    )}
                    {getStatusIcon(service.status)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {service.details || 'No details available'}
                </div>
                <div className="text-xs text-muted-foreground/80 mt-1">
                  Last checked: {service.lastCheck.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Health Information */}
          {detailedHealth && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center text-foreground">
                <Database className="h-4 w-4 mr-2" />
                MongoDB API Server Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Database Connection:</span>{' '}
                  {detailedHealth.mongodb.connected ? '✅ Connected' : '❌ Disconnected'}
                </div>
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Server Uptime:</span>{' '}
                  {Math.floor(detailedHealth.server.uptime / 60)} minutes
                </div>
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Memory Usage:</span>{' '}
                  {Math.round(detailedHealth.server.memory?.heapUsed / 1024 / 1024 || 0)} MB
                </div>
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">Process ID:</span>{' '}
                  {detailedHealth.server.pid}
                </div>
              </div>
            </div>
          )}

          {/* System Status Summary */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Last system check: {lastGlobalCheck.toLocaleTimeString()}
              </span>
              <span className={`font-medium ${overallHealth === 'healthy' ? 'text-green-600' :
                  overallHealth === 'unhealthy' ? 'text-destructive' :
                    'text-muted-foreground'
                }`}>
                System Status: {overallHealth.charAt(0).toUpperCase() + overallHealth.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackendStatus;
