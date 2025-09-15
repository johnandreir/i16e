import React from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import DateRangePicker from './DateRangePicker';
import { Filter, RefreshCcw } from 'lucide-react';

interface FilterSectionProps {
  selectedEntity: string;
  selectedEntityValue: string;
  selectedTimeRange: { from: Date | undefined; to: Date | undefined };
  onEntityChange: (entity: string) => void;
  onEntityValueChange: (value: string) => void;
  onTimeRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onGenerateReport: () => void;
  entityData: Record<string, string[]>;
  isLoading?: boolean;
  reportGenerated?: boolean;
  entityChanged?: boolean;
}


const FilterSection: React.FC<FilterSectionProps> = ({
  selectedEntity,
  selectedEntityValue,
  selectedTimeRange,
  onEntityChange,
  onEntityValueChange,
  onTimeRangeChange,
  onGenerateReport,
  entityData,
  isLoading = false,
  reportGenerated = false,
  entityChanged = false
}) => {
  const getCurrentEntityOptions = () => {
    const entities = entityData[selectedEntity as keyof typeof entityData] || [];
    return entities
      .filter(entity => !entity.includes('Add New'))
      .sort((a, b) => a.localeCompare(b))
      .map(entity => ({ value: entity, label: entity }));
  };
  return (
    <Card className="glass-card p-4 mb-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
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

          {/* Entity Value Selection with Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Select {selectedEntity.toUpperCase()}
            </label>
            <Combobox
              options={getCurrentEntityOptions()}
              value={selectedEntityValue}
              onValueChange={onEntityValueChange}
              placeholder={`Choose ${selectedEntity}`}
              searchPlaceholder={`Search ${selectedEntity}s...`}
              emptyText={`No ${selectedEntity} found.`}
              className="bg-card border-border w-full h-10"
            />
          </div>

          {/* Date Range Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Time Range</label>
            <DateRangePicker
              value={selectedTimeRange}
              onChange={onTimeRangeChange}
              className="w-full"
            />
          </div>
        </div>

        {/* Generate Report Button */}
        <div className="flex gap-3 items-end lg:self-end">
            <Button
            onClick={onGenerateReport}
            disabled={isLoading || !selectedEntity || !selectedEntityValue || !selectedTimeRange.from || !selectedTimeRange.to}
            className="min-w-[140px] h-10"
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