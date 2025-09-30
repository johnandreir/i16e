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
  workflows?: Array<{
    id: string;
    name: string;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
  }>;
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

  const checkN8nHealth = async (): Promise<{ status: ServiceStatus['status'], details: string, workflows?: Array<any> }> => {
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
        const activeCount = workflowStatus.activeCount || 0;
        const totalCount = workflowStatus.totalCount || 0;
        const workflows = workflowStatus.workflows || [];
        const activeWorkflows = workflows.filter((w: any) => w.active);
        
        // Create detailed status message
        const activeWorkflowNames = activeWorkflows.map((w: any) => w.name).join(', ');
        const detailsMessage = activeCount > 0 
          ? `${activeCount} active: ${activeWorkflowNames}` 
          : `${totalCount} workflows found, none active`;
        
        return {
          status: activeCount > 0 ? 'healthy' : 'unhealthy',
          details: detailsMessage,
          workflows: workflows
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

  const checkServiceHealth = async (service: ServiceStatus): Promise<ServiceStatus> => {
    let result: { status: ServiceStatus['status'], details: string, health?: DetailedHealth, workflows?: Array<any> };

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
      details: result.details,
      workflows: result.workflows
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                
                {/* Show workflow details for n8n service */}
                {service.name === 'n8n Workflow Status' && service.workflows && service.workflows.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Workflows:</div>
                    {service.workflows.map((workflow: any) => (
                      <div
                        key={workflow.id}
                        className={`flex items-center justify-between text-xs p-1 rounded ${
                          workflow.active 
                            ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                            : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span className="truncate max-w-[120px]" title={workflow.name}>
                          {workflow.name}
                        </span>
                        <span className={`px-1 rounded text-xs ${
                          workflow.active 
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                            : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                        }`}>
                          {workflow.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground/80 mt-1">
                  Last checked: {service.lastCheck.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

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
