import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  target?: number;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit = '',
  target,
  description,
  variant = 'default',
  icon
}) => {
  const getTargetStatus = () => {
    if (!target) return null;
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const isMetOrExceeded = title.includes('Dissatisfaction') 
      ? numValue <= target  // For dissatisfaction, lower is better
      : numValue >= target; // For others, higher is better
    
    return {
      isGood: isMetOrExceeded,
      color: isMetOrExceeded ? 'text-green-600' : 'text-red-600'
    };
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

  const targetStatus = getTargetStatus();

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

        {target && targetStatus && (
          <div className="flex flex-col items-end text-sm">
            <span className="text-xs text-muted-foreground mb-1">Target</span>
            <span className={cn('font-medium', targetStatus.color)}>
              {target}{unit}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KPICard;