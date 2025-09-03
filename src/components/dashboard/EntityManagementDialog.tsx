import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EntityData {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}

interface EntityManagementDialogProps {
  entityType: 'dpe' | 'squad' | 'team';
  entities: string[];
  onEntitiesChange: (entities: string[]) => void;
}

const EntityManagementDialog: React.FC<EntityManagementDialogProps> = ({
  entityType,
  entities,
  onEntitiesChange
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [entityData, setEntityData] = useState<EntityData[]>(() =>
    entities.filter(e => !e.includes('Add New')).map((name, index) => ({
      id: `${entityType}-${index}`,
      name,
      description: `${entityType} description for ${name}`,
      status: 'active' as const
    }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const validateName = (name: string): boolean => {
    if (!name.trim()) return false;
    if (name.length < 2 || name.length > 50) return false;
    if (entityData.some(e => e.name.toLowerCase() === name.toLowerCase() && e.id !== editingId)) return false;
    return /^[a-zA-Z0-9\s\-\.]+$/.test(name);
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
      id: `${entityType}-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim() || `${entityType} description for ${newName}`,
      status: 'active'
    };

    const updatedData = [...entityData, newEntity];
    setEntityData(updatedData);
    onEntitiesChange([...updatedData.map(e => e.name), `Add New ${entityType.toUpperCase()}...`]);
    
    setNewName('');
    setNewDescription('');
    setIsAdding(false);
    
    toast({
      title: "Success",
      description: `${entityType.toUpperCase()} "${newName}" added successfully.`,
    });
  };

  const handleEdit = (id: string) => {
    const entity = entityData.find(e => e.id === id);
    if (entity) {
      setEditingId(id);
      setEditName(entity.name);
      setEditDescription(entity.description || '');
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

    const updatedData = entityData.map(e => 
      e.id === editingId 
        ? { ...e, name: editName.trim(), description: editDescription.trim() || e.description }
        : e
    );
    
    setEntityData(updatedData);
    onEntitiesChange([...updatedData.map(e => e.name), `Add New ${entityType.toUpperCase()}...`]);
    
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    
    toast({
      title: "Success",
      description: `${entityType.toUpperCase()} updated successfully.`,
    });
  };

  const handleDelete = (id: string) => {
    const updatedData = entityData.filter(e => e.id !== id);
    setEntityData(updatedData);
    onEntitiesChange([...updatedData.map(e => e.name), `Add New ${entityType.toUpperCase()}...`]);
    
    toast({
      title: "Success",
      description: `${entityType.toUpperCase()} deleted successfully.`,
    });
  };

  const handleToggleStatus = (id: string) => {
    const updatedData = entityData.map(e => 
      e.id === id 
        ? { ...e, status: e.status === 'active' ? 'inactive' as const : 'active' as const }
        : e
    );
    
    setEntityData(updatedData);
    onEntitiesChange([...updatedData.filter(e => e.status === 'active').map(e => e.name), `Add New ${entityType.toUpperCase()}...`]);
  };

  const getEntityLabel = () => {
    switch (entityType) {
      case 'dpe': return 'DevOps Platform Engineers';
      case 'squad': return 'Squads';
      case 'team': return 'Teams';
      default: return 'Entities';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Manage {getEntityLabel()}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage {getEntityLabel()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Entity */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Add New {entityType.toUpperCase()}</h3>
            {!isAdding ? (
              <Button onClick={() => setIsAdding(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add New {entityType.toUpperCase()}
              </Button>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newName">Name *</Label>
                  <Input
                    id="newName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={`Enter ${entityType} name`}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="newDescription">Description</Label>
                  <Input
                    id="newDescription"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional description"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 md:col-span-2">
                  <Button onClick={handleAdd} size="sm">
                    <Check className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                  <Button onClick={() => {
                    setIsAdding(false);
                    setNewName('');
                    setNewDescription('');
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
                  <TableHead>Description</TableHead>
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
                    <TableCell>
                      {editingId === entity.id ? (
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="min-w-[200px]"
                        />
                      ) : (
                        <span className="text-muted-foreground">{entity.description}</span>
                      )}
                    </TableCell>
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
                                setEditDescription('');
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