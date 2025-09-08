import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value: { from: Date | undefined; to: Date | undefined };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return null;
    return format(date, 'MMM dd, yyyy');
  };

  const handleDateSelect = (date: Date | undefined, type: 'from' | 'to') => {
    let newRange = { ...value };
    
    if (type === 'from') {
      newRange.from = date;
      // If from date is after to date, clear to date
      if (date && value.to && date > value.to) {
        newRange.to = undefined;
      }
    } else {
      // Don't allow to date before from date
      if (date && value.from && date < value.from) {
        return; // Don't update if invalid range
      }
      newRange.to = date;
    }
    
    onChange(newRange);
  };

  const handleQuickSelect = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    
    onChange({ from, to });
    setIsOpen(false);
  };

  const quickRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last year', days: 365 },
  ];

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal min-w-[280px]",
              !value.from && !value.to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.from && value.to ? (
              <>
                {formatDateDisplay(value.from)} - {formatDateDisplay(value.to)}
              </>
            ) : (
              <span>Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Quick Range Selection */}
            <div className="border-r p-4 space-y-2 min-w-[140px]">
              <h4 className="font-medium text-sm">Quick ranges</h4>
              {quickRanges.map((range) => (
                <Button
                  key={range.days}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handleQuickSelect(range.days)}
                >
                  {range.label}
                </Button>
              ))}
            </div>

            {/* Calendar Selection */}
            <div className="p-4 space-y-4">
              <div className="flex gap-4">
                {/* From Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">From</Label>
                  <Calendar
                    mode="single"
                    selected={value.from}
                    onSelect={(date) => handleDateSelect(date, 'from')}
                    className="pointer-events-auto"
                    disabled={(date) => {
                      // Disable dates after the selected 'to' date
                      return value.to ? date > value.to : false;
                    }}
                  />
                </div>

                {/* To Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">To</Label>
                  <Calendar
                    mode="single"
                    selected={value.to}
                    onSelect={(date) => handleDateSelect(date, 'to')}
                    className="pointer-events-auto"
                    disabled={(date) => {
                      // Disable dates before the selected 'from' date
                      return value.from ? date < value.from : false;
                    }}
                  />
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={!value.from || !value.to}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;