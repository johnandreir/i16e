import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickEntityAddProps {
  createTeam: (name: string, description?: string) => Promise<boolean>;
  createSquad: (name: string, teamName: string, description?: string) => Promise<boolean>;
  createDPE: (name: string, squadName: string, description?: string) => Promise<boolean>;
  entityData: {
    teams: string[];
    squads: string[];
    dpes: string[];
  };
}

const QuickEntityAdd: React.FC<QuickEntityAddProps> = ({
  createTeam,
  createSquad,
  createDPE,
  entityData
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [entityType, setEntityType] = useState<'team' | 'squad' | 'dpe'>('dpe');
  const [name, setName] = useState('');
  const [parentEntity, setParentEntity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive"
      });
      return;
    }

    if ((entityType === 'squad' || entityType === 'dpe') && !parentEntity) {
      toast({
        title: "Error",
        description: `Please select a ${entityType === 'squad' ? 'team' : 'squad'}`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      let success = false;

      if (entityType === 'team') {
        success = await createTeam(name.trim());
      } else if (entityType === 'squad') {
        success = await createSquad(name.trim(), parentEntity);
      } else if (entityType === 'dpe') {
        success = await createDPE(name.trim(), parentEntity);
      }

      if (success) {
        toast({
          title: "Success",
          description: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} "${name}" added successfully`,
        });
        
        // Reset form
        setName('');
        setParentEntity('');
        setIsOpen(false);
      } else {
        toast({
          title: "Error",
          description: `Failed to add ${entityType}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding entity:', error);
      toast({
        title: "Error",
        description: `Failed to add ${entityType}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getParentOptions = () => {
    if (entityType === 'squad') {
      return entityData.teams.filter(team => !team.includes('Add New'));
    } else if (entityType === 'dpe') {
      return entityData.squads.filter(squad => !squad.includes('Add New'));
    }
    return [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Quick Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Entity</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="entityType" className="text-right">
              Type
            </Label>
            <Select value={entityType} onValueChange={(value: 'team' | 'squad' | 'dpe') => {
              setEntityType(value);
              setParentEntity('');
            }}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="squad">Squad</SelectItem>
                <SelectItem value="dpe">DPE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder={`Enter ${entityType} name`}
            />
          </div>

          {(entityType === 'squad' || entityType === 'dpe') && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent" className="text-right">
                {entityType === 'squad' ? 'Team' : 'Squad'}
              </Label>
              <Select value={parentEntity} onValueChange={setParentEntity}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={`Select ${entityType === 'squad' ? 'team' : 'squad'}`} />
                </SelectTrigger>
                <SelectContent>
                  {getParentOptions().map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAdd}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickEntityAdd;
