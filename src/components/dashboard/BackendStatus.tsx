import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Database, Activity } from 'lucide-react';

interface BackendStatusProps {
  className?: string;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown' | 'checking';
  lastCheck: Date;
  details?: string;
  url?: string;
}

const BackendStatus: React.FC<BackendStatusProps> = ({ className }) => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'N8N Webhook',
      status: 'unknown',
      lastCheck: new Date(),
      url: 'http://localhost:5678/webhook-test/dpe-performance'
    },
    {
      name: 'MongoDB API',
      status: 'unknown', 
      lastCheck: new Date(),
      url: 'http://localhost:3001'
    },
    {
      name: 'Eureka API',
      status: 'unknown',
      lastCheck: new Date(),
      details: 'Performance data source'
    }
  ]);

  const [isChecking, setIsChecking] = useState(false);
  const [lastGlobalCheck, setLastGlobalCheck] = useState<Date>(new Date());

  const checkServiceHealth = async (service: ServiceStatus): Promise<ServiceStatus> => {
    if (!service.url) {
      return { ...service, status: 'unknown', lastCheck: new Date() };
    }

    try {
      const response = await fetch(service.url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      return {
        ...service,
        status: response.ok ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        details: response.ok ? 'OK' : `Error: ${response.status} ${response.statusText}`
      };
    } catch (error) {
      return {
        ...service,
        status: 'unhealthy',
        lastCheck: new Date(),
        details: error instanceof Error ? error.message : 'Connection failed'
      };
    }
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
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>;
      case 'checking':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Checking...</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy' : 
                      services.some(s => s.status === 'unhealthy') ? 'unhealthy' : 'unknown';

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle className="text-lg">Backend Status</CardTitle>
            {getStatusIcon(overallStatus)}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkAllServices}
            disabled={isChecking}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Last checked: {lastGlobalCheck.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {getStatusIcon(service.status)}
              <div>
                <div className="font-medium">{service.name}</div>
                {service.details && (
                  <div className="text-sm text-gray-500">{service.details}</div>
                )}
                {service.url && (
                  <div className="text-xs text-gray-400">{service.url}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(service.status)}
              <div className="text-xs text-gray-400">
                {service.lastCheck.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default BackendStatus;
