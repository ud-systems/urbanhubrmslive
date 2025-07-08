import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  Building2,
  Search,
  Package
} from "lucide-react";

interface RoomGrade {
  id: number;
  name: string;
  stock?: number;
}

interface RoomGradeManagerProps {
  items: RoomGrade[];
  onAdd: (name: string, stock: number) => Promise<void>;
  onEdit: (id: number, name: string, stock: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const RoomGradeManager = ({ items, onAdd, onEdit, onDelete }: RoomGradeManagerProps) => {
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState<number>(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingStock, setEditingStock] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await onAdd(newName.trim(), newStock);
      setNewName("");
      setNewStock(0);
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding room grade:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: number) => {
    if (!editingName.trim()) return;
    setLoading(true);
    try {
      await onEdit(id, editingName.trim(), editingStock);
      setEditingId(null);
      setEditingName("");
      setEditingStock(0);
    } catch (error) {
      console.error('Error editing room grade:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this room grade?')) return;
    setLoading(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Error deleting room grade:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (item: RoomGrade) => {
    setEditingId(item.id);
    setEditingName(item.name);
    setEditingStock(item.stock || 0);
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-50 border-green-200 text-green-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Room Grades</CardTitle>
              <p className="text-sm text-slate-500">
                {filteredItems.length} of {items.length} room grades
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
            {items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search room grades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Add New Room Grade */}
        {isAdding ? (
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-name" className="text-sm font-medium text-slate-700">Name</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Enter room grade name"
                  onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="new-stock" className="text-sm font-medium text-slate-700">Stock</Label>
                                 <Input
                   id="new-stock"
                   type="number"
                   min="0"
                   value={newStock || ''}
                   onChange={e => setNewStock(parseInt(e.target.value) || 0)}
                   placeholder="Available units"
                   onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                 />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                onClick={handleAdd} 
                disabled={loading || !newName.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "..." : <CheckCircle className="w-4 h-4" />}
                Add Room Grade
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => { setIsAdding(false); setNewName(""); setNewStock(0); }}
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setIsAdding(true)}
            className="w-full border-dashed border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Room Grade
          </Button>
        )}

        {/* Room Grades List */}
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchTerm ? `No room grades found matching "${searchTerm}"` : 'No room grades configured yet'}
              </p>
              <p className="text-xs">
                {searchTerm ? 'Try a different search term' : 'Click "Add New Room Grade" to get started'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all duration-200"
              >
                {editingId === item.id ? (
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-1">
                      <Label htmlFor={`edit-name-${item.id}`} className="text-sm font-medium text-slate-700">Name</Label>
                      <Input
                        id={`edit-name-${item.id}`}
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleEdit(item.id)}
                        autoFocus
                      />
                    </div>
                    <div className="w-24">
                      <Label htmlFor={`edit-stock-${item.id}`} className="text-sm font-medium text-slate-700">Stock</Label>
                                             <Input
                         id={`edit-stock-${item.id}`}
                         type="number"
                         min="0"
                         value={editingStock || ''}
                         onChange={e => setEditingStock(parseInt(e.target.value) || 0)}
                         onKeyPress={(e) => e.key === 'Enter' && handleEdit(item.id)}
                       />
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleEdit(item.id)} 
                      disabled={loading || !editingName.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? "..." : <Save className="w-4 h-4" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => { setEditingId(null); setEditingName(""); setEditingStock(0); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium text-slate-900">{item.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Package className="w-4 h-4 text-slate-400" />
                                                   <span className="text-sm text-slate-600">
                           {item.stock || 0} unit{(item.stock || 0) !== 1 ? 's' : ''} available
                         </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => startEditing(item)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomGradeManager; 