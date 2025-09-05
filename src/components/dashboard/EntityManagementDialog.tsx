import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EntityData {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  mappedTo?: string;
}

interface EntityMappings {
  dpeToSquad: Record<string, string>;
  squadToTeam: Record<string, string>;
}

interface EntityManagementDialogProps {
  allEntityData: Record<string, string[]>;
  entityMappings: EntityMappings;
  onEntityDataChange: (entityType: string, data: string[]) => void;
  onMappingsChange: (mappings: EntityMappings) => void;
}

const EntityManagementDialog: React.FC<EntityManagementDialogProps> = ({
  allEntityData,
  entityMappings,
  onEntityDataChange,
  onMappingsChange
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dpe' | 'squad' | 'team'>('dpe');
  
  const initializeEntityData = (entityType: 'dpe' | 'squad' | 'team') => {
    const entities = allEntityData[entityType] || [];
    return entities.filter(e => !e.includes('Add New')).map((name, index) => ({
      id: `${entityType}-${index}`,
      name,
      status: 'active' as const,
      mappedTo: entityType === 'dpe' ? entityMappings.dpeToSquad[name] : 
                entityType === 'squad' ? entityMappings.squadToTeam[name] : undefined
    }));
  };
  
  const [dpeData, setDpeData] = useState<EntityData[]>(() => initializeEntityData('dpe'));
  const [squadData, setSquadData] = useState<EntityData[]>(() => initializeEntityData('squad'));
  const [teamData, setTeamData] = useState<EntityData[]>(() => initializeEntityData('team'));
  
  const getCurrentEntityData = () => {
    switch (activeTab) {
      case 'dpe': return dpeData;
      case 'squad': return squadData;
      case 'team': return teamData;
      default: return [];
    }
  };
  
  const setCurrentEntityData = (data: EntityData[]) => {
    switch (activeTab) {
      case 'dpe': setDpeData(data); break;
      case 'squad': setSquadData(data); break;
      case 'team': setTeamData(data); break;
    }
  };
  
  const entityData = getCurrentEntityData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMapping, setEditMapping] = useState('');
  const [newName, setNewName] = useState('');
  const [newMapping, setNewMapping] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const validateName = (name: string): boolean => {
    if (!name.trim()) return false;
    if (name.length < 2 || name.length > 50) return false;
    if (entityData.some(e => e.name.toLowerCase() === name.toLowerCase() && e.id !== editingId)) return false;
    return /^[a-zA-Z0-9\s\-\.]+$/.test(name);
  };

  const getTargetEntityOptions = () => {
    if (activeTab === 'dpe') {
      return allEntityData.squad?.filter(s => !s.includes('Add New')) || [];
    } else if (activeTab === 'squad') {
      return allEntityData.team?.filter(t => !t.includes('Add New')) || [];
    }
    return [];
  };

  const getTargetEntityLabel = () => {
    if (activeTab === 'dpe') return 'Squad';
    if (activeTab === 'squad') return 'Team';
    return '';
  };

  const handleAdd = () => {
    if (!validateName(newName)) {
      toast({
        title: "Invalid Name",
        description: "Name must be 2-50 characters, unique, and contain only letters, numbers, spaces, hyphens, and periods.",
        variant: "destructive"
      });
      return;
    }

    const newEntity: EntityData = {
      id: `${activeTab}-${Date.now()}`,
      name: newName.trim(),
      status: 'active',
      mappedTo: newMapping || undefined
    };

    const updatedData = [...entityData, newEntity];
    setCurrentEntityData(updatedData);
    onEntityDataChange(activeTab, [...updatedData.map(e => e.name), `Add New ${activeTab.toUpperCase()}...`]);
    
    // Update mappings
    if (newMapping) {
      const updatedMappings = { ...entityMappings };
      if (activeTab === 'dpe') {
        updatedMappings.dpeToSquad[newName.trim()] = newMapping;
      } else if (activeTab === 'squad') {
        updatedMappings.squadToTeam[newName.trim()] = newMapping;
      }
      onMappingsChange(updatedMappings);
    }
    
    setNewName('');
    setNewMapping('');
    setIsAdding(false);
    
    toast({
      title: "Success",
      description: `${activeTab.toUpperCase()} "${newName}" added successfully.`,
    });
  };

  const handleEdit = (id: string) => {
    const entity = entityData.find(e => e.id === id);
    if (entity) {
      setEditingId(id);
      setEditName(entity.name);
      setEditMapping(entity.mappedTo || '');
    }
  };

  const handleSaveEdit = () => {
    if (!validateName(editName)) {
      toast({
        title: "Invalid Name",
        description: "Name must be 2-50 characters, unique, and contain only letters, numbers, spaces, hyphens, and periods.",
        variant: "destructive"
      });
      return;
    }

    const oldEntity = entityData.find(e => e.id === editingId);
    const updatedData = entityData.map(e => 
      e.id === editingId 
        ? { ...e, name: editName.trim(), mappedTo: editMapping || undefined }
        : e
    );
    
    setCurrentEntityData(updatedData);
    onEntityDataChange(activeTab, [...updatedData.map(e => e.name), `Add New ${activeTab.toUpperCase()}...`]);
    
    // Update mappings
    if (oldEntity) {
      const updatedMappings = { ...entityMappings };
      if (activeTab === 'dpe') {
        delete updatedMappings.dpeToSquad[oldEntity.name];
        if (editMapping) {
          updatedMappings.dpeToSquad[editName.trim()] = editMapping;
        }
      } else if (activeTab === 'squad') {
        delete updatedMappings.squadToTeam[oldEntity.name];
        if (editMapping) {
          updatedMappings.squadToTeam[editName.trim()] = editMapping;
        }
      }
      onMappingsChange(updatedMappings);
    }
    
    setEditingId(null);
    setEditName('');
    setEditMapping('');
    
    toast({
      title: "Success",
      description: `${activeTab.toUpperCase()} updated successfully.`,
    });
  };

  const handleDelete = (id: string) => {
    const entityToDelete = entityData.find(e => e.id === id);
    const updatedData = entityData.filter(e => e.id !== id);
    setCurrentEntityData(updatedData);
    onEntityDataChange(activeTab, [...updatedData.map(e => e.name), `Add New ${activeTab.toUpperCase()}...`]);
    
    // Remove from mappings
    if (entityToDelete) {
      const updatedMappings = { ...entityMappings };
      if (activeTab === 'dpe') {
        delete updatedMappings.dpeToSquad[entityToDelete.name];
      } else if (activeTab === 'squad') {
        delete updatedMappings.squadToTeam[entityToDelete.name];
      }
      onMappingsChange(updatedMappings);
    }
    
    toast({
      title: "Success",
      description: `${activeTab.toUpperCase()} deleted successfully.`,
    });
  };

  const handleToggleStatus = (id: string) => {
    const updatedData = entityData.map(e => 
      e.id === id 
        ? { ...e, status: e.status === 'active' ? 'inactive' as const : 'active' as const }
        : e
    );
    
    setCurrentEntityData(updatedData);
    onEntityDataChange(activeTab, [...updatedData.filter(e => e.status === 'active').map(e => e.name), `Add New ${activeTab.toUpperCase()}...`]);
  };

  const getEntityLabel = () => {
    switch (activeTab) {
      case 'dpe': return 'DevOps Platform Engineers';
      case 'squad': return 'Squads';
      case 'team': return 'Teams';
      default: return 'Entities';
    }
  };

  const targetEntityOptions = getTargetEntityOptions();
  const targetEntityLabel = getTargetEntityLabel();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Entity Management</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-4 border-b">
            {(['dpe', 'squad', 'team'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'dpe' ? 'DPE Management' : tab === 'squad' ? 'Squad Management' : 'Team Management'}
              </button>
            ))}
          </div>

          {/* Add New Entity */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Add New {activeTab.toUpperCase()}</h3>
            {!isAdding ? (
              <Button onClick={() => setIsAdding(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add New {activeTab.toUpperCase()}
              </Button>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newName">Name *</Label>
                  <Input
                    id="newName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={`Enter ${activeTab} name`}
                    className="mt-1"
                  />
                </div>
                {targetEntityOptions.length > 0 && (
                  <div>
                    <Label htmlFor="newMapping">Map to {targetEntityLabel}</Label>
                    <Select value={newMapping} onValueChange={setNewMapping}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={`Select ${targetEntityLabel}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {targetEntityOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex gap-2 md:col-span-2">
                  <Button onClick={handleAdd} size="sm">
                    <Check className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                  <Button onClick={() => {
                    setIsAdding(false);
                    setNewName('');
                    setNewMapping('');
                  }} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Entity List */}
          <div>
            <h3 className="font-semibold mb-4">Current {getEntityLabel()}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {targetEntityLabel && <TableHead>Mapped to {targetEntityLabel}</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entityData.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell>
                      {editingId === entity.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="min-w-[150px]"
                        />
                      ) : (
                        <span className="font-medium">{entity.name}</span>
                      )}
                    </TableCell>
                    {targetEntityLabel && (
                      <TableCell>
                        {editingId === entity.id ? (
                          <Select value={editMapping} onValueChange={setEditMapping}>
                            <SelectTrigger className="min-w-[150px]">
                              <SelectValue placeholder={`Select ${targetEntityLabel}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {targetEntityOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">
                            {entity.mappedTo || 'Not mapped'}
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge 
                        variant={entity.status === 'active' ? 'success' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleToggleStatus(entity.id)}
                      >
                        {entity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === entity.id ? (
                          <>
                            <Button onClick={handleSaveEdit} size="sm" variant="outline">
                              <Check className="h-4 w-4" />
                            </Button>
                  <Button 
                            onClick={() => {
                              setEditingId(null);
                              setEditName('');
                              setEditMapping('');
                            }} 
                            size="sm" 
                            variant="outline"
                          >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={() => handleEdit(entity.id)} size="sm" variant="outline">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              onClick={() => handleDelete(entity.id)} 
                              size="sm" 
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntityManagementDialog;