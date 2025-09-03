import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value: { from: Date | undefined; to: Date | undefined };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fromTime, setFromTime] = useState('00:00');
  const [toTime, setToTime] = useState('23:59');

  const formatDateTimeDisplay = (date: Date | undefined, time: string) => {
    if (!date) return null;
    return `${format(date, 'MMM dd, yyyy')} ${time}`;
  };

  const handleDateSelect = (date: Date | undefined, type: 'from' | 'to') => {
    if (type === 'from') {
      onChange({ ...value, from: date });
    } else {
      onChange({ ...value, to: date });
    }
  };

  const handleTimeChange = (time: string, type: 'from' | 'to') => {
    if (type === 'from') {
      setFromTime(time);
    } else {
      setToTime(time);
    }
  };

  const handleQuickSelect = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    
    onChange({ from, to });
    setIsOpen(false);
  };

  const validateTimeFormat = (time: string) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
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
                {formatDateTimeDisplay(value.from, fromTime)} -{' '}
                {formatDateTimeDisplay(value.to, toTime)}
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

            {/* Calendar and Time Selection */}
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
                  />
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Time</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <Input
                        type="time"
                        value={fromTime}
                        onChange={(e) => handleTimeChange(e.target.value, 'from')}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* To Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">To</Label>
                  <Calendar
                    mode="single"
                    selected={value.to}
                    onSelect={(date) => handleDateSelect(date, 'to')}
                    className="pointer-events-auto"
                  />
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Time</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <Input
                        type="time"
                        value={toTime}
                        onChange={(e) => handleTimeChange(e.target.value, 'to')}
                        className="text-xs"
                      />
                    </div>
                  </div>
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
                  disabled={!value.from || !value.to || !validateTimeFormat(fromTime) || !validateTimeFormat(toTime)}
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