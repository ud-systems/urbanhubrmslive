import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Search, 
  Plus, 
  Users, 
  Building2, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail,
  Calendar,
  Clock,
  DollarSign,
  Shield,
  AlertTriangle
} from "lucide-react";
import { getTourists, updateTourist, deleteTourist, createTourist, updateStudio, bulkDeleteTourists, createTouristInvoice } from "@/lib/supabaseCrud";
import { useToast } from "@/hooks/use-toast";
import { TableRowSkeleton } from "@/components/LoadingSpinner";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Tourist {
  id: number;
  name: string;
  phone: string;
  email: string;
  room: string;
  checkin: string;
  checkout: string;
  duration: string;
  revenue: number;
  assignedto?: string; // Studio ID
  notes?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

import { Studio } from "@/types";

interface TouristManagementProps {
  tourists: Tourist[];
  studios: Studio[];
  roomGrades: any[];
  onUpdateTourist: (updatedTourist: Tourist) => void;
  onDeleteTourist: (touristId: number) => void;
  onAddTourist: (newTourist: Tourist) => void;
}

const TouristManagement = ({ tourists, studios, roomGrades, onUpdateTourist, onDeleteTourist, onAddTourist }: TouristManagementProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isEditTouristModalOpen, setIsEditTouristModalOpen] = useState(false);
  const [selectedTourist, setSelectedTourist] = useState<Tourist | null>(null);
  const [editingTourist, setEditingTourist] = useState<Tourist | null>(null);
  const [selectedTourists, setSelectedTourists] = useState<number[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isAddTouristModalOpen, setIsAddTouristModalOpen] = useState(false);
  const [newTourist, setNewTourist] = useState<Partial<Tourist>>({
    name: "",
    phone: "",
    email: "",
    room: "",
    checkin: "",
    checkout: "",
    duration: "",
    revenue: 0,
    assignedto: "",
  });
  const [dailyRate, setDailyRate] = useState(45);
  const [studioSearchTerm, setStudioSearchTerm] = useState("");

  const vacantStudios = studios.filter(studio => !studio.occupied);

  const calculateRevenue = () => {
    if (newTourist.checkin && newTourist.checkout) {
      const days = Math.ceil((new Date(newTourist.checkout).getTime() - new Date(newTourist.checkin).getTime()) / (1000 * 60 * 60 * 24));
      setNewTourist(prev => ({ ...prev, revenue: days * dailyRate, duration: `${days} days` }));
    }
  };

  const handleEditTourist = (tourist: Tourist) => {
    setEditingTourist(tourist);
    setIsEditTouristModalOpen(true);
  };

  const handleUpdateTourist = async () => {
    if (editingTourist) {
      try {
        // Get the original tourist to compare studio assignment
        const originalTourist = tourists.find(t => t.id === editingTourist.id);
        
        const updated = await updateTourist(editingTourist.id, editingTourist);
        
        // Handle studio assignment changes
        if (originalTourist) {
          // If studio assignment changed, update studio occupancy
          if (originalTourist.assignedto !== editingTourist.assignedto) {
            // Clear previous studio assignment
            if (originalTourist.assignedto) {
              await updateStudio(originalTourist.assignedto, { 
                occupied: false, 
                occupiedby: null 
              });
            }
            
            // Set new studio assignment
            if (editingTourist.assignedto) {
              await updateStudio(editingTourist.assignedto, { 
                occupied: true, 
                occupiedby: editingTourist.id 
              });
            }
          }
        }
        
        setIsEditTouristModalOpen(false);
        setEditingTourist(null);
        onUpdateTourist(updated);
        toast({ title: 'Tourist updated', description: 'Tourist updated successfully.' });
      } catch (e: any) {
        toast({ title: 'Update failed', description: e.message || String(e), variant: 'destructive' });
      }
    }
  };

  const handleDeleteTourist = async (touristId: number) => {
    try {
      // Get the tourist to check if they have a studio assignment
      const tourist = tourists.find(t => t.id === touristId);
      
      // Clear studio assignment if tourist was assigned to a studio
      if (tourist?.assignedto) {
        try {
          await updateStudio(tourist.assignedto, { 
            occupied: false, 
            occupiedby: null 
          });
        } catch (studioError) {
          console.warn('Failed to update studio occupancy:', studioError);
        }
      }
      
      // Delete the tourist
      await deleteTourist(touristId);
      
      // Call the parent callback to update the main state
      onDeleteTourist(touristId);
      
      toast({ title: 'Tourist deleted', description: 'Tourist deleted successfully.' });
    } catch (e: any) {
      console.error('Delete tourist error:', e);
      toast({ title: 'Delete failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const handleAddTourist = async () => {
    try {
      // Calculate duration and revenue
      const checkinDate = new Date(newTourist.checkin || '');
      const checkoutDate = new Date(newTourist.checkout || '');
      const days = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const touristData = {
        ...newTourist,
        duration: `${days} days`,
        revenue: days * dailyRate
      };

      const created = await createTourist(touristData);
      
      // Update studio occupancy if studio is assigned
      if (newTourist.assignedto) {
        await updateStudio(newTourist.assignedto, { 
          occupied: true, 
          occupiedby: created.id 
        });
      }

      // Automatically create invoice for the tourist
      try {
        await createTouristInvoice(created);
        console.log('Invoice created automatically for tourist:', created.name);
      } catch (invoiceError) {
        console.warn('Failed to create automatic invoice:', invoiceError);
        // Don't fail the tourist creation if invoice fails
      }
      
      onAddTourist(created);
      setIsAddTouristModalOpen(false);
      
      // Reset form
      setNewTourist({
        name: "",
        phone: "",
        email: "",
        room: "",
        checkin: "",
        checkout: "",
        duration: "",
        revenue: 0,
        assignedto: "",
      });
      setDailyRate(45);
      setStudioSearchTerm("");
      
      toast({ title: 'Tourist created', description: 'Tourist added successfully.' });
    } catch (e: any) {
      toast({ title: 'Create failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const filteredTourists = tourists.filter(tourist => {
    const matchesSearch = (tourist.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (tourist.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (tourist.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (tourist.room?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRoom = roomFilter === "all" || tourist.room === roomFilter;
    
    // Status filtering
    const checkinDate = new Date(tourist.checkin);
    const checkoutDate = new Date(tourist.checkout);
    const now = new Date();
    let status = "completed";
    if (checkinDate <= now && checkoutDate >= now) status = "staying";
    else if (checkinDate > now) status = "upcoming";
    
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesRoom && matchesStatus;
  }).sort((a, b) => {
    const sortFactor = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "name") {
      return a.name.localeCompare(b.name) * sortFactor;
    } else if (sortBy === "room") {
      return a.room.localeCompare(b.room) * sortFactor;
    } else if (sortBy === "checkin") {
      return new Date(a.checkin).getTime() - new Date(b.checkin).getTime() * sortFactor;
    } else {
      return 0;
    }
  });

  const uniqueRooms = [...new Set(tourists.map(t => t.room))].sort();

  // Bulk select handlers
  const handleSelectTourist = (touristId: number, checked: boolean) => {
    if (checked) {
      setSelectedTourists(prev => [...prev, touristId]);
    } else {
      setSelectedTourists(prev => prev.filter(id => id !== touristId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTourists(filteredTourists.map(tourist => tourist.id));
    } else {
      setSelectedTourists([]);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    try {
      const touristsToDelete = tourists.filter(t => selectedTourists.includes(t.id));
      const selectedCount = selectedTourists.length;
      
      // Clear studio assignments first
      for (const tourist of touristsToDelete) {
        if (tourist.assignedto) {
          try {
            await updateStudio(tourist.assignedto, { 
              occupied: false, 
              occupiedby: null 
            });
          } catch (studioError) {
            console.warn('Failed to update studio occupancy:', studioError);
          }
        }
      }
      
      // Delete tourists
      await bulkDeleteTourists(selectedTourists);
      
      // Call the parent callback to update the main state
      selectedTourists.forEach(touristId => {
        onDeleteTourist(touristId);
      });
      
      setSelectedTourists([]);
      setIsBulkDeleteDialogOpen(false);
      
      toast({ 
        title: 'Tourists deleted', 
        description: `${selectedCount} tourists have been permanently deleted.` 
      });
    } catch (e: any) {
      console.error('Bulk delete error:', e);
      toast({ title: 'Bulk delete failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading tourists..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tourist Management</h2>
          <p className="text-slate-600">Manage short-term tourist bookings and accommodations</p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedTourists.length > 0 && (
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedTourists.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Tourists</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedTourists.length} selected tourists? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Dialog open={isAddTouristModalOpen} onOpenChange={setIsAddTouristModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Tourist
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Add New Tourist
                </DialogTitle>
                <p className="text-sm text-slate-600">
                  Add a new short-term tourist booking with accommodation details.
                </p>
              </DialogHeader>

              <div className="space-y-6">
                {/* Tourist Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input 
                      value={newTourist.name} 
                      onChange={e => setNewTourist(s => ({ ...s, name: e.target.value }))} 
                      placeholder="Full name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      value={newTourist.phone} 
                      onChange={e => setNewTourist(s => ({ ...s, phone: e.target.value }))} 
                      placeholder="Phone number" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      value={newTourist.email} 
                      onChange={e => setNewTourist(s => ({ ...s, email: e.target.value }))} 
                      placeholder="Email address" 
                    />
                  </div>
                </div>

                {/* Studio Assignment */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Studio Assignment</Label>
                  <Select 
                    value={newTourist.assignedto || "none"} 
                    onValueChange={value => {
                      const selectedStudioId = value === "none" ? "" : value;
                      const selectedStudio = studios.find(s => s.id === selectedStudioId);
                      setNewTourist(s => ({ 
                        ...s, 
                        assignedto: selectedStudioId,
                        room: selectedStudio?.roomGrade || "" // Auto-populate room grade from selected studio
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select available studio" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Search studios..."
                            value={studioSearchTerm}
                            onChange={(e) => setStudioSearchTerm(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <SelectItem value="none">No studio assigned</SelectItem>
                      {studios
                        .filter(studio => !studio.occupied)
                        .filter(studio => 
                          studio.name.toLowerCase().includes(studioSearchTerm.toLowerCase()) ||
                          (studio.roomGrade || "").toLowerCase().includes(studioSearchTerm.toLowerCase()) ||
                          studio.floor.toString().includes(studioSearchTerm)
                        )
                        .map(studio => (
                          <SelectItem key={studio.id} value={studio.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {studio.name} - Floor {studio.floor === 0 ? 'Ground Floor' : studio.floor} ({studio.roomGrade || 'No grade'})
                            </div>
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <div className="space-y-2">
                    <Label>Room Grade</Label>
                    <Input
                      value={newTourist.room || "Not assigned"}
                      disabled
                      className="bg-slate-50"
                    />
                  </div>
                </div>

                {/* Date Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkin">Check-in Date</Label>
                    <Input
                      id="checkin"
                      type="date"
                      value={newTourist.checkin}
                      onChange={(e) => setNewTourist(s => ({ ...s, checkin: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkout">Check-out Date</Label>
                    <Input
                      id="checkout"
                      type="date"
                      value={newTourist.checkout}
                      onChange={(e) => setNewTourist(s => ({ ...s, checkout: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Rate Configuration */}
                <div className="space-y-2">
                  <Label htmlFor="daily-rate">Daily Rate (£)</Label>
                  <Input
                    id="daily-rate"
                    type="number"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(Number(e.target.value))}
                  />
                </div>

                {/* Calculate Button */}
                <Button onClick={calculateRevenue} variant="outline" className="w-full">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Calculate Total Revenue
                </Button>

                {/* Total Revenue Display */}
                {newTourist.revenue > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-green-900 font-medium">Total Revenue:</span>
                      <span className="text-2xl font-bold text-green-900">£{newTourist.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setIsAddTouristModalOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddTourist} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={!newTourist.name || !newTourist.checkin || !newTourist.checkout}
                  >
                    Add Tourist
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search tourists by name, email, phone, or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Room Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {uniqueRooms.map(room => (
                    <SelectItem key={room} value={room}>{room}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="staying">Currently Staying</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tourists Table */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tourist Bookings ({filteredTourists.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTourists.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No tourists found</h3>
              <p className="text-slate-600">
                {searchTerm 
                  ? "No tourists match your search criteria."
                  : "No tourist bookings have been added yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="font-semibold w-12">
                      <Checkbox
                        checked={selectedTourists.length === filteredTourists.length && filteredTourists.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Tourist</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold">Room</TableHead>
                    <TableHead className="font-semibold">Check-in</TableHead>
                    <TableHead className="font-semibold">Check-out</TableHead>
                    <TableHead className="font-semibold">Duration</TableHead>
                    <TableHead className="font-semibold">Revenue</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTourists.map((tourist) => {
                    const checkinDate = new Date(tourist.checkin);
                    const checkoutDate = new Date(tourist.checkout);
                    const now = new Date();
                    let status = "Completed";
                    let statusColor = "bg-slate-100 text-slate-800";

                    if (checkinDate <= now && checkoutDate >= now) {
                      status = "Staying";
                      statusColor = "bg-green-100 text-green-800";
                    } else if (checkinDate > now) {
                      status = "Upcoming";
                      statusColor = "bg-blue-100 text-blue-800";
                    }

                    return (
                      <TableRow key={tourist.id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200">
                        <TableCell>
                          <Checkbox
                            checked={selectedTourists.includes(tourist.id)}
                            onCheckedChange={(checked) => handleSelectTourist(tourist.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs">
                                {tourist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-slate-900">{tourist.name}</p>
                              <p className="text-sm text-slate-500">ID: {tourist.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-slate-900">{tourist.email}</p>
                            <p className="text-sm text-slate-500">{tourist.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-50">
                            {tourist.room}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-900">{checkinDate.toLocaleDateString()}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-900">{checkoutDate.toLocaleDateString()}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-900">{tourist.duration}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-slate-900">£{tourist.revenue}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColor}>
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditTourist(tourist)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Tourist</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {tourist.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTourist(tourist.id)} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Tourist Modal */}
      <Dialog open={isEditTouristModalOpen} onOpenChange={setIsEditTouristModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tourist</DialogTitle>
            <DialogDescription>
              Update the tourist information below. All changes will be saved automatically.
            </DialogDescription>
          </DialogHeader>
          {editingTourist && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingTourist.name}
                  onChange={(e) => setEditingTourist({...editingTourist, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editingTourist.phone}
                  onChange={(e) => setEditingTourist({...editingTourist, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editingTourist.email}
                  onChange={(e) => setEditingTourist({...editingTourist, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned Studio</Label>
                <Select 
                  value={editingTourist.assignedto || "none"} 
                  onValueChange={value => {
                    const selectedStudioId = value === "none" ? "" : value;
                    const selectedStudio = studios.find(s => s.id === selectedStudioId);
                    setEditingTourist({
                      ...editingTourist, 
                      assignedto: selectedStudioId,
                      room: selectedStudio?.roomGrade || "" // Auto-populate room grade from selected studio
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select studio (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No studio assigned</SelectItem>
                    {studios
                      .filter(studio => !studio.occupied || studio.occupiedby === editingTourist.id)
                      .map(studio => (
                        <SelectItem key={studio.id} value={studio.id}>
                          {studio.name} - Floor {studio.floor === 0 ? 'Ground Floor' : `Floor ${studio.floor}`} ({studio.roomGrade || 'No grade'})
                          {studio.occupiedby === editingTourist.id && " (Currently assigned)"}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room Grade</Label>
                <Input
                  value={editingTourist.room || "Not assigned"}
                  disabled
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Check-In Date</Label>
                <Input
                  type="date"
                  value={editingTourist.checkin}
                  onChange={(e) => setEditingTourist({...editingTourist, checkin: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-Out Date</Label>
                <Input
                  type="date"
                  value={editingTourist.checkout}
                  onChange={(e) => setEditingTourist({...editingTourist, checkout: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Revenue</Label>
                <Input
                  type="number"
                  value={editingTourist.revenue}
                  onChange={(e) => setEditingTourist({...editingTourist, revenue: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          )}
          <div className="flex space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditTouristModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTourist} className="bg-gradient-to-r from-blue-600 to-blue-700">
              Update Tourist
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TouristManagement;
