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
      newRange.to = date;
      // Don't enforce validation here, let user pick freely
    }
    
    onChange(newRange);
  };

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const from = new Date();
    from.setDate(today.getDate() - days + 1); // +1 to include today
    from.setHours(0, 0, 0, 0); // Start of day
    
    onChange({ from, to: today });
    setIsOpen(false);
  };

  const quickRanges = [
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '3 months', days: 90 },
    { label: '6 months', days: 180 },
    { label: '1 year', days: 365 },
  ];

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal min-w-[200px] h-10 text-sm",
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
            <div className="border-r p-2 space-y-1 w-20">
              <h4 className="font-medium text-xs mb-1">Quick</h4>
              {quickRanges.map((range) => (
                <Button
                  key={range.days}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7 px-1"
                  onClick={() => handleQuickSelect(range.days)}
                >
                  {range.label}
                </Button>
              ))}
            </div>

            {/* Calendar Selection */}
            <div className="p-3 space-y-3">
              <div className="flex gap-4">
                {/* From Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">From</Label>
                  <Calendar
                    mode="single"
                    selected={value.from}
                    onSelect={(date) => handleDateSelect(date, 'from')}
                    className="rounded-md border"
                    numberOfMonths={1}
                    showOutsideDays={false}
                    disabled={(date) => {
                      // Only disable future dates beyond today
                      const today = new Date();
                      today.setHours(23, 59, 59, 999);
                      return date > today;
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
                    className="rounded-md border"
                    numberOfMonths={1}
                    showOutsideDays={false}
                    disabled={(date) => {
                      // Only disable future dates beyond today
                      const today = new Date();
                      today.setHours(23, 59, 59, 999);
                      return date > today;
                    }}
                  />
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 text-sm"
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