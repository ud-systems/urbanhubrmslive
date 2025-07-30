import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Building2, 
  Eye, 
  Users,
  Grid,
  List,
  Edit,
  Trash2,
  UserCheck,
  HelpCircle
} from "lucide-react";
import { getStudios, createStudio, updateStudio, deleteStudio } from "@/lib/supabaseCrud";
import { useToast } from "@/hooks/use-toast";
import BulkEditStudioModal from "@/components/BulkEditStudioModal";
import { TableRowSkeleton } from "@/components/LoadingSpinner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Studio } from "@/types";

interface StudioManagementProps {
  studios: Studio[];
  students: any[];
  tourists: any[];
  onUpdateStudio: (studio: Studio) => void;
  onDeleteStudio: (studioId: string) => void;
  onAddStudio: (studioData: Studio) => void;
  studioStats: {
    total: number;
    occupied: number;
    vacant: number;
    roomGradeStats: any[];
  };
  roomGrades: any[];
  studioViews: any[];
}

const StudioManagement = ({ studios, students, tourists, studioStats, onUpdateStudio, onDeleteStudio, onAddStudio, roomGrades, studioViews }: StudioManagementProps) => {
  // Add safety check for studioViews
  const safeStudioViews = studioViews || [];
  console.log('StudioManagement - studioViews:', safeStudioViews);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [floorFilter, setFloorFilter] = useState("all");
  const [occupancyFilter, setOccupancyFilter] = useState("all");
  const [roomGradeFilter, setRoomGradeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isAddStudioModalOpen, setIsAddStudioModalOpen] = useState(false);
  const [isEditStudioModalOpen, setIsEditStudioModalOpen] = useState(false);
  const [isViewStudioModalOpen, setIsViewStudioModalOpen] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);
  const [newStudio, setNewStudio] = useState({
    id: "",
    name: "",
    view: "",
    floor: 1,
    roomGrade: ""
  });
    const [selectedStudios, setSelectedStudios] = useState<string[]>([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  // Debug logging to see when studios prop changes
  // Studios prop updated

  const filteredStudios = (studios || []).filter(studio => {
    const matchesSearch = (studio.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (studio.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (studio.view?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFloor = floorFilter === "all" || (studio.floor && studio.floor.toString() === floorFilter);
    const matchesOccupancy = occupancyFilter === "all" || 
                           (occupancyFilter === "occupied" && studio.occupied) ||
                           (occupancyFilter === "vacant" && !studio.occupied);
    const matchesRoomGrade = roomGradeFilter === "all" || (studio.roomGrade && studio.roomGrade === roomGradeFilter);
    
    return matchesSearch && matchesFloor && matchesOccupancy && matchesRoomGrade;
  });

  const uniqueFloors = [...new Set((studios || []).map(s => s.floor).filter(floor => floor !== null && floor !== undefined))].sort((a, b) => {
    // Sort so that 0 (Ground Floor) comes first, then other floors numerically
    if (a === 0) return -1;
    if (b === 0) return 1;
    return a - b;
  });
  const uniqueRoomGrades = [...new Set((studios || []).map(s => s.roomGrade).filter(Boolean))].sort();

  const handleAddStudio = async () => {
    try {
      // Convert "none" to empty string for database
      const studioData = {
        ...newStudio,
        view: newStudio.view === "none" ? "" : newStudio.view
      };
      const created = await createStudio(studioData);
      setIsAddStudioModalOpen(false);
      setNewStudio({
        id: "",
        name: "",
        view: "",
        floor: 1,
        roomGrade: ""
      });
      onAddStudio(created);
      toast({ title: 'Studio created', description: 'Studio added successfully.' });
    } catch (e: any) {
      toast({ title: 'Create failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const handleEditStudio = (studio: Studio) => {
    setEditingStudio(studio);
    setIsEditStudioModalOpen(true);
  };

  const handleUpdateStudio = async () => {
    if (editingStudio) {
      try {
        // Convert "none" to empty string for database
        const studioData = {
          ...editingStudio,
          view: editingStudio.view === "none" ? "" : editingStudio.view
        };
        const updated = await updateStudio(editingStudio.id, studioData);
        setIsEditStudioModalOpen(false);
        setEditingStudio(null);
        onUpdateStudio(updated);
        toast({ title: 'Studio updated', description: 'Studio updated successfully.' });
      } catch (e: any) {
        toast({ title: 'Update failed', description: e.message || String(e), variant: 'destructive' });
      }
    }
  };

  const handleViewStudio = (studio: Studio) => {
    setSelectedStudio(studio);
    setIsViewStudioModalOpen(true);
  };

  const handleDeleteStudio = async (studioId: string) => {
    try {
      await deleteStudio(studioId);
      onDeleteStudio(studioId);
      toast({ title: 'Studio deleted', description: 'Studio deleted successfully.' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const getOccupancyColor = (occupied: boolean) => {
    return occupied ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
  };

  // Bulk select handlers
  const handleSelectStudio = (studioId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudios(prev => [...prev, studioId]);
    } else {
      setSelectedStudios(prev => prev.filter(id => id !== studioId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudios(filteredStudios.map(studio => studio.id));
    } else {
      setSelectedStudios([]);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedStudios.map(id => deleteStudio(id)));
      setSelectedStudios([]);
      toast({ title: 'Studios deleted', description: 'Bulk delete successful.' });
    } catch (e: any) {
      toast({ title: 'Bulk delete failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  // Bulk edit
  const handleBulkEdit = async (updates: Partial<Studio>) => {
    try {
      await Promise.all(selectedStudios.map(id => updateStudio(id, updates)));
      setSelectedStudios([]);
      setIsBulkEditModalOpen(false);
      toast({ title: 'Studios updated', description: 'Bulk edit successful.' });
    } catch (e: any) {
      toast({ title: 'Bulk edit failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  // Calculate room grade occupancy stats
  const roomGradeStats = (roomGrades || []).map(grade => {
    const studiosOfGrade = (studios || []).filter(studio => studio.roomGrade && studio.roomGrade === grade.name);
    const occupiedStudios = studiosOfGrade.filter(studio => studio.occupied);
    const stock = grade.stock || 0;
    const occupancyRate = stock > 0 ? (occupiedStudios.length / stock) * 100 : 0;
    
    return {
      name: grade.name,
      total: stock,
      occupied: occupiedStudios.length,
      vacant: stock - occupiedStudios.length,
      occupancyRate: Math.round(occupancyRate)
    };
  });

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading studios..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Studio Management</h2>
          <p className="text-slate-600 mt-1">Manage studio inventory and occupancy</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-blue-600 text-white" : ""}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-blue-600 text-white" : ""}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all duration-200 hover:scale-105">
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm p-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">Dynamic Room Grade Availability</h4>
                  <p className="text-sm text-slate-600">
                    Room grade availability is automatically calculated based on the actual studios in your system. 
                    This ensures accurate mapping between available studios and student bookings.
                  </p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>• <strong>Total:</strong> Number of studios with this room grade</p>
                    <p>• <strong>Occupied:</strong> Studios currently assigned to students</p>
                    <p>• <strong>Vacant:</strong> Studios available for new bookings</p>
                    <p>• <strong>Dynamic Count:</strong> Shows when actual count differs from original setting</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Dialog open={isAddStudioModalOpen} onOpenChange={setIsAddStudioModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Studio
              </Button>
            </DialogTrigger>
            <DialogContent>
                      <DialogHeader>
          <DialogTitle>Add New Studio</DialogTitle>
          <DialogDescription>
            Create a new studio with its details including name, view, floor, and room grade.
          </DialogDescription>
        </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Studio ID</Label>
                  <Input
                    value={newStudio.id}
                    onChange={(e) => setNewStudio({...newStudio, id: e.target.value})}
                    placeholder="e.g., STD001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Studio Name</Label>
                  <Input
                    value={newStudio.name}
                    onChange={(e) => setNewStudio({...newStudio, name: e.target.value})}
                    placeholder="e.g., Platinum Studio A1"
                  />
                </div>
                                <div className="space-y-2">
                  <Label>View</Label>
                  <Select value={newStudio.view || "none"} onValueChange={(value) => setNewStudio({...newStudio, view: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                                      <SelectContent>
                    <SelectItem value="none">Not chosen</SelectItem>
                    {safeStudioViews.map(view => (
                      <SelectItem key={view.id} value={view.name}>{view.name}</SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Floor Number</Label>
                  <Input
                    type="number"
                    value={newStudio.floor}
                    onChange={(e) => setNewStudio({...newStudio, floor: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Room Grade</Label>
                  <Select value={newStudio.roomGrade} onValueChange={value => setNewStudio(s => ({ ...s, roomGrade: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomGrades.map(grade => (
                        <SelectItem key={grade.id} value={grade.name}>{grade.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddStudioModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudio} className="bg-gradient-to-r from-blue-600 to-blue-700">
                  Add Studio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overall Studio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Studios</p>
                <p className="text-2xl font-bold">{studioStats.total}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Vacant</p>
                <p className="text-2xl font-bold">{studioStats.vacant}</p>
              </div>
              <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                <span className="text-green-800 font-bold text-sm">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Occupied</p>
                <p className="text-2xl font-bold">{studioStats.occupied}</p>
              </div>
              <UserCheck className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Room Grade Stats Cards */}
      <div className="flex flex-wrap gap-4">
        {studioStats.roomGradeStats.map((stat) => (
          <Card key={stat.name} className="flex-1 min-w-64 border-0 shadow-lg bg-white/80 backdrop-blur-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">{stat.name}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {stat.total > 0 ? Math.round((stat.occupied / stat.total) * 100) : 0}%
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Occupied:</span>
                  <span className="font-medium text-slate-900">{stat.occupied}/{stat.total}</span>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      (stat.total > 0 ? (stat.occupied / stat.total) * 100 : 0) >= 90 ? 'bg-red-500' :
                      (stat.total > 0 ? (stat.occupied / stat.total) * 100 : 0) >= 75 ? 'bg-orange-500' :
                      (stat.total > 0 ? (stat.occupied / stat.total) * 100 : 0) >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(stat.total > 0 ? (stat.occupied / stat.total) * 100 : 0, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Vacant: {stat.vacant}</span>
                  <span>{stat.total > 0 ? Math.round((stat.occupied / stat.total) * 100) : 0}% full</span>
                </div>
                
                {/* Show if dynamic count differs from original stock setting */}
                {stat.originalStock > 0 && stat.total !== stat.originalStock && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-700">Dynamic Count:</span>
                      <span className="font-medium text-blue-900">{stat.total} studios</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-blue-600">Original Setting:</span>
                      <span className="text-blue-800">{stat.originalStock} studios</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search studios by name, ID, or view..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {uniqueFloors.map(floor => (
                  <SelectItem key={floor} value={floor?.toString() || ''}>
                    {floor === 0 ? 'Ground Floor' : `Floor ${floor}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={occupancyFilter} onValueChange={setOccupancyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by occupancy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Studios</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roomGradeFilter} onValueChange={setRoomGradeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by room grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Room Grades</SelectItem>
                {uniqueRoomGrades.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List View */}
      {viewMode === "list" && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="font-semibold w-12">
                    <input
                      type="checkbox"
                      checked={selectedStudios.length === filteredStudios.length && filteredStudios.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Studio</TableHead>
                  <TableHead className="font-semibold">Floor</TableHead>
                  <TableHead className="font-semibold">Room Grade</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Duration</TableHead>
                  <TableHead className="font-semibold">Occupant</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudios.map((studio) => (
                  <TableRow key={studio.id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedStudios.includes(studio.id)}
                        onChange={(e) => handleSelectStudio(studio.id, e.target.checked)}
                        className="rounded border-slate-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{studio.name}</p>
                          <p className="text-sm text-slate-500">ID: {studio.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700">
                        {studio.floor === 0 ? 'Ground Floor' : `Floor ${studio.floor || 'N/A'}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-700">{studio.roomGrade || "Not set"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getOccupancyColor(studio.occupied)}>
                        {studio.occupied ? "Occupied" : "Vacant"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {studio.occupied && studio.occupiedby ? (
                        (() => {
                          const student = students.find(s => s.id === studio.occupiedby);
                          const tourist = tourists.find(t => t.id === studio.occupiedby);
                          const occupant = student || tourist;
                          return occupant?.duration ? (
                            <span className="text-slate-700 font-medium">{occupant.duration}</span>
                          ) : (
                            <span className="text-slate-400 text-sm">Not set</span>
                          );
                        })()
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {studio.occupied ? (
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">
                            {(() => {
                              const student = students.find(s => s.id === studio.occupiedby);
                              const tourist = tourists.find(t => t.id === studio.occupiedby);
                              const occupant = student || tourist;
                              const type = student ? 'Student' : tourist ? 'Tourist' : 'Occupant';
                              return `${type} #${studio.occupiedby ? studio.occupiedby.toString().padStart(4, '0') : 'N/A'}`;
                            })()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewStudio(studio)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditStudio(studio)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteStudio(studio.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStudios.map((studio) => (
            <Card key={studio.id} className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
              studio.occupied 
                ? "bg-gradient-to-br from-white to-red-50/30" 
                : "bg-gradient-to-br from-white to-green-50/30"
            } ${selectedStudios.includes(studio.id) ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <input
                    type="checkbox"
                    checked={selectedStudios.includes(studio.id)}
                    onChange={(e) => handleSelectStudio(studio.id, e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      studio.occupied 
                        ? "bg-gradient-to-br from-red-600 to-red-700" 
                        : "bg-gradient-to-br from-green-600 to-green-700"
                    }`}>
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{studio.name}</CardTitle>
                      <p className="text-sm text-slate-500">{studio.id}</p>
                    </div>
                    <Badge className={getOccupancyColor(studio.occupied)}>
                      {studio.occupied ? "Occupied" : "Vacant"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Floor</p>
                    <p className="font-medium text-slate-900">
                      {studio.floor === 0 ? 'Ground Floor' : `Floor ${studio.floor}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Room Grade</p>
                    <p className="font-medium text-slate-900">{studio.roomGrade || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Duration</p>
                    <p className="font-medium text-slate-900">
                      {studio.occupied && studio.occupiedby ? (
                        (() => {
                          const student = students.find(s => s.id === studio.occupiedby);
                          const tourist = tourists.find(t => t.id === studio.occupiedby);
                          const occupant = student || tourist;
                          return occupant?.duration || "Not set";
                        })()
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                </div>

                {studio.occupied && studio.occupiedby && (
                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-900">
                        Occupied by Student #{studio.occupiedby.toString().padStart(4, '0')}
                      </span>
                    </div>
                  </div>
                )}

                {!studio.occupied && (
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        Available for booking
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewStudio(studio)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditStudio(studio)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredStudios.length === 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Studios Found</h3>
            <p className="text-slate-500">
              {searchTerm || floorFilter !== "all" || occupancyFilter !== "all"
                ? "No studios match your search criteria." 
                : "No studios have been added yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Studio Modal */}
      <Dialog open={isEditStudioModalOpen} onOpenChange={setIsEditStudioModalOpen}>
        <DialogContent>
                  <DialogHeader>
          <DialogTitle>Edit Studio</DialogTitle>
          <DialogDescription>
            Update the studio details including name, view, floor, and room grade.
          </DialogDescription>
        </DialogHeader>
          {editingStudio && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Studio Name</Label>
                <Input
                  value={editingStudio.name}
                  onChange={(e) => setEditingStudio({...editingStudio, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>View</Label>
                <Select value={editingStudio.view || "none"} onValueChange={(value) => setEditingStudio({...editingStudio, view: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not chosen</SelectItem>
                    {safeStudioViews.map(view => (
                      <SelectItem key={view.id} value={view.name}>{view.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Floor Number</Label>
                <Input
                  type="number"
                  value={editingStudio.floor}
                  onChange={(e) => setEditingStudio({...editingStudio, floor: parseInt(e.target.value) || 1})}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Room Grade</Label>
                <Select value={editingStudio.roomGrade} onValueChange={value => setEditingStudio({...editingStudio, roomGrade: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomGrades.map(grade => (
                      <SelectItem key={grade.id} value={grade.name}>{grade.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          )}
          <div className="flex space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditStudioModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStudio} className="bg-gradient-to-r from-blue-600 to-blue-700">
              Update Studio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Studio Modal */}
      <Dialog open={isViewStudioModalOpen} onOpenChange={setIsViewStudioModalOpen}>
        <DialogContent>
                  <DialogHeader>
          <DialogTitle>Studio Details</DialogTitle>
          <DialogDescription>
            View detailed information about the selected studio.
          </DialogDescription>
        </DialogHeader>
          {selectedStudio && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Studio ID</Label>
                  <p className="font-medium">{selectedStudio.id}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Name</Label>
                  <p className="font-medium">{selectedStudio.name}</p>
                </div>
                <div>
                  <Label className="text-slate-500">View</Label>
                  <p className="font-medium">{selectedStudio.view}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Floor</Label>
                  <p className="font-medium">
                    {selectedStudio.floor === 0 ? 'Ground Floor' : `Floor ${selectedStudio.floor}`}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500">Status</Label>
                  <Badge className={getOccupancyColor(selectedStudio.occupied)}>
                    {selectedStudio.occupied ? "Occupied" : "Vacant"}
                  </Badge>
                </div>
                {selectedStudio.occupied && (
                  <div>
                    <Label className="text-slate-500">Occupant</Label>
                    <p className="font-medium">Student #{selectedStudio.occupiedby?.toString().padStart(4, '0')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewStudioModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Modal */}
      <BulkEditStudioModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedStudios={studios.filter(s => selectedStudios.includes(s.id))}
        onBulkUpdate={handleBulkEdit}
        floorOptions={uniqueFloors}
        roomGrades={roomGrades}
        studioViews={studioViews}
      />

      {/* Bulk Action Buttons */}
      {selectedStudios.length > 0 && (
        <div className="flex gap-2 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mr-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {selectedStudios.length} selected
            </Badge>
          </div>
          <Button 
            onClick={() => setIsBulkEditModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Bulk Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleBulkDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Bulk Delete
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSelectedStudios([])}
            className="ml-auto"
          >
            Clear Selection
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudioManagement;
