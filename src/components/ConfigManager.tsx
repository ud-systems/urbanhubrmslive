import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  Users,
  Building2,
  Clock,
  Target,
  MessageSquare,
  Settings,
  Search
} from "lucide-react";

interface ConfigManagerProps {
  title: string;
  items: { id: number; name: string }[];
  onAdd: (name: string) => Promise<void>;
  onEdit: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const ConfigManager = ({ title, items, onAdd, onEdit, onDelete }: ConfigManagerProps) => {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const getIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'lead status': return <Target className="w-5 h-5" />;
      case 'room grades': return <Building2 className="w-5 h-5" />;
      case 'stay durations': return <Clock className="w-5 h-5" />;
      case 'lead sources': return <Users className="w-5 h-5" />;
      case 'response categories': return <MessageSquare className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const getColor = (title: string) => {
    switch (title.toLowerCase()) {
      case 'lead status': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'room grades': return 'bg-green-50 border-green-200 text-green-700';
      case 'stay durations': return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'lead sources': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'response categories': return 'bg-pink-50 border-pink-200 text-pink-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await onAdd(newName.trim());
      setNewName("");
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: number) => {
    if (!editingName.trim()) return;
    setLoading(true);
    try {
      await onEdit(id, editingName.trim());
      setEditingId(null);
      setEditingName("");
    } catch (error) {
      console.error('Error editing item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setLoading(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getColor(title)}`}>
              {getIcon(title)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
              <p className="text-sm text-slate-500">
                {filteredItems.length} of {items.length} items
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
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Add New Item */}
        {isAdding ? (
          <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={`Enter new ${title.toLowerCase().slice(0, -1)} name`}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <Button 
              size="sm" 
              onClick={handleAdd} 
              disabled={loading || !newName.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "..." : <CheckCircle className="w-4 h-4" />}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => { setIsAdding(false); setNewName(""); }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setIsAdding(true)}
            className="w-full border-dashed border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New {title.slice(0, -1)}
          </Button>
        )}

        {/* Items List */}
        <div className="space-y-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchTerm ? `No ${title.toLowerCase()} found matching "${searchTerm}"` : `No ${title.toLowerCase()} configured yet`}
              </p>
              <p className="text-xs">
                {searchTerm ? 'Try a different search term' : 'Click "Add New" to get started'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all duration-200"
              >
                {editingId === item.id ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleEdit(item.id)}
                      autoFocus
                    />
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
                      onClick={() => { setEditingId(null); setEditingName(""); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      <span className="font-medium text-slate-900">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => { setEditingId(item.id); setEditingName(item.name); }}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDelete(item.id)} 
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {loading ? "..." : <Trash2 className="w-4 h-4" />}
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

export default ConfigManager; 