import React from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FilterSectionProps {
  selectedEntity: string;
  selectedEntityValue: string;
  selectedTimeRange: { from: Date | undefined; to: Date | undefined };
  onEntityChange: (entity: string) => void;
  onEntityValueChange: (value: string) => void;
  onTimeRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onGenerateReport: () => void;
  isLoading?: boolean;
}

const entityData = {
  dpe: ['Juan Dela Cruz', 'Maria Santos', 'Carlos Rodriguez', 'Ana Garcia', 'Miguel Torres'],
  squad: ['Alpha Squad', 'Beta Squad', 'Gamma Squad', 'Delta Squad', 'Echo Squad'],
  team: ['Platform Engineering', 'DevOps Infrastructure', 'Cloud Operations', 'Security Engineering', 'Site Reliability']
};

const FilterSection: React.FC<FilterSectionProps> = ({
  selectedEntity,
  selectedEntityValue,
  selectedTimeRange,
  onEntityChange,
  onEntityValueChange,
  onTimeRangeChange,
  onGenerateReport,
  isLoading = false
}) => {
  return (
    <Card className="glass-card p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-6 items-end">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Entity Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Select Entity Type</label>
            <Select value={selectedEntity} onValueChange={onEntityChange}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Choose entity type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="dpe">DPE Name</SelectItem>
                <SelectItem value="squad">Squad Name</SelectItem>
                <SelectItem value="team">Team Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entity Value Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Select {selectedEntity.toUpperCase()}
            </label>
            <Select value={selectedEntityValue} onValueChange={onEntityValueChange}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder={`Choose ${selectedEntity}`} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {entityData[selectedEntity as keyof typeof entityData]?.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Time Range</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !selectedTimeRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedTimeRange.from ? (
                      format(selectedTimeRange.from, "MMM dd")
                    ) : (
                      <span>From</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedTimeRange.from}
                    onSelect={(date) => onTimeRangeChange({ ...selectedTimeRange, from: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !selectedTimeRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedTimeRange.to ? (
                      format(selectedTimeRange.to, "MMM dd")
                    ) : (
                      <span>To</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedTimeRange.to}
                    onSelect={(date) => onTimeRangeChange({ ...selectedTimeRange, to: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Generate Report Button */}
        <div className="flex gap-3">
          <Button
            onClick={onGenerateReport}
            disabled={isLoading || !selectedEntityValue || !selectedTimeRange.from || !selectedTimeRange.to}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Filter className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FilterSection;