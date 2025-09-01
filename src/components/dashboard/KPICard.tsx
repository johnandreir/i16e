import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit = '',
  trend,
  trendValue,
  description,
  variant = 'default',
  icon
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-accent" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'neutral':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-l-4 border-l-kpi-success';
      case 'warning':
        return 'border-l-4 border-l-kpi-warning';
      case 'danger':
        return 'border-l-4 border-l-kpi-danger';
      default:
        return 'border-l-4 border-l-primary';
    }
  };

  return (
    <Card className={cn('kpi-card', getVariantStyles())}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
          </div>

          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {trend && trendValue && (
          <div className="flex items-center gap-1 text-sm">
            {getTrendIcon()}
            <span
              className={cn(
                'font-medium',
                trend === 'up' && 'text-accent',
                trend === 'down' && 'text-destructive',
                trend === 'neutral' && 'text-muted-foreground'
              )}
            >
              {trendValue}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KPICard;