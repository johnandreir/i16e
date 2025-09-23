import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number | null;
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
    if (!target || value === null || value === undefined) return null;
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // For SCT Score and DSAT Score, lower is better
    const isMetOrExceeded = (title.includes('SCT Score') || title.includes('DSAT Score'))
      ? numValue <= target  // For SCT and DSAT, lower is better
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
    <Card className={cn('kpi-card-compact', getVariantStyles())}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">
              {value === null || value === undefined ? 'N/A' : (typeof value === 'number' ? value.toLocaleString() : value)}
            </span>
            {unit && value !== null && value !== undefined && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>

          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {target && targetStatus && (
          <div className="flex flex-col items-end text-sm flex-shrink-0 ml-2">
            <span className="text-xs text-muted-foreground mb-1">Target</span>
            <span className={cn('font-medium', targetStatus.color)}>
              {target}{unit && ` ${unit}`}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KPICard;