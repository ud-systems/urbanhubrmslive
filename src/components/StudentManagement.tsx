import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { getStudents, updateStudent, deleteStudent, createStudent, updateStudio, bulkDeleteStudents } from "@/lib/supabaseCrud";
import { useToast } from "@/hooks/use-toast";
import BulkEditStudentModal from "@/components/BulkEditStudentModal";

interface Student {
  id: number;
  name: string;
  phone: string;
  email: string;
  room: string;
  checkin: string;
  duration: string;
  revenue: number;
  assignedto?: string; // Studio ID
}

interface Studio {
  id: string;
  name: string;
  view: string;
  floor: number;
  occupied: boolean;
  occupiedby: number | null;
  roomGrade: string;
}

interface StudentManagementProps {
  students: Student[];
  studios: Studio[];
  studioStats: {
    total: number;
    occupied: number;
    vacant: number;
  };
  roomGrades: any[];
  stayDurations: any[];
  onUpdateStudent: (updatedStudent: Student) => void;
  onDeleteStudent: (studentId: number) => void;
  onAddStudent: (newStudent: Student) => void;
}

const StudentManagement = ({ students, studios, studioStats, roomGrades, stayDurations, onUpdateStudent, onDeleteStudent, onAddStudent }: StudentManagementProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: "",
    phone: "",
    email: "",
    room: "",
    checkin: "",
    duration: "",
    revenue: 0,
    assignedto: "",
  });
  const [selectedRoomGrade, setSelectedRoomGrade] = useState("");

  const vacantStudios = studios.filter(studio => !studio.occupied);
  
  // Get available studios filtered by room grade
  const getAvailableStudiosByGrade = (roomGrade: string) => {
    return studios.filter(studio => 
      !studio.occupied && 
      studio.roomGrade === roomGrade
    );
  };



  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsEditStudentModalOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (editingStudent) {
      try {
        // Get the original student to compare studio assignment
        const originalStudent = students.find(s => s.id === editingStudent.id);
        
        const updated = await updateStudent(editingStudent.id, editingStudent);
        
        // Handle studio assignment changes
        if (originalStudent) {
          // If studio assignment changed, update studio occupancy
          if (originalStudent.assignedto !== editingStudent.assignedto) {
            // Clear previous studio assignment
            if (originalStudent.assignedto) {
              await updateStudio(originalStudent.assignedto, { 
                occupied: false, 
                occupiedby: null 
              });
            }
            
            // Set new studio assignment
            if (editingStudent.assignedto) {
              await updateStudio(editingStudent.assignedto, { 
                occupied: true, 
                occupiedby: editingStudent.id 
              });
            }
          }
        }
        
        setIsEditStudentModalOpen(false);
        setEditingStudent(null);
        onUpdateStudent(updated);
        toast({ title: 'Student updated', description: 'Student updated successfully.' });
      } catch (e: any) {
        toast({ title: 'Update failed', description: e.message || String(e), variant: 'destructive' });
      }
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    try {
      // Get the student to check if they have a studio assignment
      const student = students.find(s => s.id === studentId);
      
      await deleteStudent(studentId);
      
      // Clear studio assignment if student was assigned to a studio
      if (student?.assignedto) {
        await updateStudio(student.assignedto, { 
          occupied: false, 
          occupiedby: null 
        });
      }
      
      onDeleteStudent(studentId);
      toast({ title: 'Student deleted', description: 'Student deleted successfully.' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const handleAddStudent = async () => {
    try {
      const created = await createStudent(newStudent);
      
      // Update studio occupancy if studio is assigned
      if (newStudent.assignedto) {
        await updateStudio(newStudent.assignedto, { 
          occupied: true, 
          occupiedby: created.id 
        });
      }
      
      onAddStudent(created);
      setIsAddStudentModalOpen(false);
      setNewStudent({
        name: "",
        phone: "",
        email: "",
        room: "",
        checkin: "",
        duration: "",
        revenue: 0,
        assignedto: "",
      });
      setSelectedRoomGrade("");
      toast({ title: 'Student created', description: 'Student added successfully.' });
    } catch (e: any) {
      toast({ title: 'Create failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (student.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (student.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (student.room?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRoom = roomFilter === "all" || student.room === roomFilter;
    const matchesDuration = durationFilter === "all" || student.duration === durationFilter;

    return matchesSearch && matchesRoom && matchesDuration;
  }).sort((a, b) => {
    const sortFactor = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "name") {
      return a.name.localeCompare(b.name) * sortFactor;
    } else if (sortBy === "room") {
      return a.room.localeCompare(b.room) * sortFactor;
    } else if (sortBy === "duration") {
      return a.duration.localeCompare(b.duration) * sortFactor;
    } else {
      return 0;
    }
  });

  const uniqueRooms = [...new Set(students.map(s => s.room))].sort();
  const uniqueDurations = [...new Set(students.map(s => s.duration))].sort();

  // Bulk select handlers
  const handleSelectStudent = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    try {
      // Get students to check studio assignments
      const studentsToDelete = students.filter(s => selectedStudents.includes(s.id));
      
      // Clear studio assignments first
      for (const student of studentsToDelete) {
        if (student.assignedto) {
          await updateStudio(student.assignedto, { 
            occupied: false, 
            occupiedby: null 
          });
        }
      }
      
      // Delete students
      await bulkDeleteStudents(selectedStudents);
      setSelectedStudents([]);
      setIsBulkDeleteDialogOpen(false);
      toast({ 
        title: 'Students deleted', 
        description: `${selectedStudents.length} students have been permanently deleted.` 
      });
    } catch (e: any) {
      toast({ title: 'Bulk delete failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  // Bulk edit
  const handleBulkEdit = async (updates: Partial<Student>) => {
    try {
      await Promise.all(selectedStudents.map(id => updateStudent(id, updates)));
      setSelectedStudents([]);
      setIsBulkEditModalOpen(false);
      toast({ title: 'Students updated', description: 'Bulk edit successful.' });
    } catch (e: any) {
      toast({ title: 'Bulk edit failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Student Management</h2>
          <p className="text-slate-600 mt-1">Manage student bookings and details</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedStudents.length > 0 && (
            <>
              <Button
                onClick={() => setIsBulkEditModalOpen(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit {selectedStudents.length} Selected
              </Button>
              <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete {selectedStudents.length} Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-red-600" />
                      <span>Confirm Bulk Delete</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="text-red-700 font-medium">Dangerous Action</span>
                      </div>
                      <p>
                        You are about to permanently delete <strong>{selectedStudents.length} students</strong>. 
                        This action cannot be undone and will remove all associated data including studio assignments.
                      </p>
                      <p className="text-sm text-slate-600">
                        Selected students: {selectedStudents.length} item{selectedStudents.length !== 1 ? 's' : ''}
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Students
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          <Dialog open={isAddStudentModalOpen} onOpenChange={setIsAddStudentModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newStudent.name} onChange={e => setNewStudent(s => ({ ...s, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={newStudent.phone} onChange={e => setNewStudent(s => ({ ...s, phone: e.target.value }))} placeholder="Phone number" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={newStudent.email} onChange={e => setNewStudent(s => ({ ...s, email: e.target.value }))} placeholder="Email address" />
              </div>
              <div className="space-y-2">
                <Label>Room Grade</Label>
                <Select value={selectedRoomGrade} onValueChange={value => {
                  setSelectedRoomGrade(value);
                  setNewStudent(s => ({ ...s, room: value, assignedto: "" }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomGrades.map(grade => (
                      <SelectItem key={grade.name} value={grade.name}>{grade.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned Studio</Label>
                <Select 
                  value={newStudent.assignedto || "none"} 
                  onValueChange={value => setNewStudent(s => ({ ...s, assignedto: value === "none" ? "" : value }))}
                  disabled={!selectedRoomGrade}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedRoomGrade ? "Select available studio" : "Select room grade first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRoomGrade ? (
                      getAvailableStudiosByGrade(selectedRoomGrade).map(studio => (
                        <SelectItem key={studio.id} value={studio.id}>
                          {studio.name} - Floor {studio.floor} ({studio.view})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Select room grade first</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedRoomGrade && getAvailableStudiosByGrade(selectedRoomGrade).length === 0 && (
                  <p className="text-sm text-red-600">No vacant studios available for this room grade</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Check-In Date</Label>
                <Input type="date" value={newStudent.checkin} onChange={e => setNewStudent(s => ({ ...s, checkin: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={newStudent.duration} onValueChange={value => setNewStudent(s => ({ ...s, duration: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {stayDurations.map(duration => (
                      <SelectItem key={duration.name} value={duration.name}>{duration.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Revenue</Label>
                <Input type="number" value={newStudent.revenue} onChange={e => setNewStudent(s => ({ ...s, revenue: Number(e.target.value) }))} placeholder="Revenue" />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddStudentModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStudent} className="bg-gradient-to-r from-blue-600 to-blue-700">
                Add Student
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Student Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{students.length}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-red-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Occupied Studios</CardTitle>
            <Building2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{studioStats.occupied}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Vacant Studios</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{studioStats.vacant}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search students by name, email, phone, or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {uniqueRooms.map(room => (
                  <SelectItem key={room} value={room}>{room}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={durationFilter} onValueChange={setDurationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Durations</SelectItem>
                {uniqueDurations.map(duration => (
                  <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student Table */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-semibold">Student</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Room</TableHead>
                <TableHead className="font-semibold">Check-In</TableHead>
                <TableHead className="font-semibold">Duration</TableHead>
                <TableHead className="font-semibold">Revenue</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200">
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-medium">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">{student.name}</p>
                        <p className="text-sm text-slate-500">ID: {student.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-600">{student.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-600">{student.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-700 font-medium">{student.room}</span>
                      </div>
                      {student.assignedto && (
                        <div className="text-xs text-slate-500">
                          Studio: {studios.find(s => s.id === student.assignedto)?.name || 'Unknown'}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-600">{student.checkin}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-600">{student.duration}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-3 h-3 text-green-600" />
                      <span className="font-semibold text-slate-900">£{(student.revenue || 0).toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditStudent(student)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteStudent(student.id)}>
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

      {filteredStudents.length === 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Students Found</h3>
            <p className="text-slate-500">
              {searchTerm || roomFilter !== "all" || durationFilter !== "all"
                ? "No students match your search criteria."
                : "No students have been added yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Student Modal */}
      <Dialog open={isEditStudentModalOpen} onOpenChange={setIsEditStudentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Room Grade</Label>
                <Select value={editingStudent.room} onValueChange={value => setEditingStudent({...editingStudent, room: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomGrades.map(grade => (
                      <SelectItem key={grade.name} value={grade.name}>{grade.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned Studio</Label>
                <Select 
                  value={editingStudent.assignedto || "none"} 
                  onValueChange={value => setEditingStudent({...editingStudent, assignedto: value === "none" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select studio (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No studio assigned</SelectItem>
                    {studios
                      .filter(studio => !studio.occupied || studio.occupiedby === editingStudent.id)
                      .filter(studio => studio.roomGrade === editingStudent.room)
                      .map(studio => (
                        <SelectItem key={studio.id} value={studio.id}>
                          {studio.name} - Floor {studio.floor} ({studio.view})
                          {studio.occupiedby === editingStudent.id && " (Currently assigned)"}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Check-In Date</Label>
                <Input
                  value={editingStudent.checkin}
                  onChange={(e) => setEditingStudent({...editingStudent, checkin: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={editingStudent.duration} onValueChange={value => setEditingStudent({...editingStudent, duration: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {stayDurations.map(duration => (
                      <SelectItem key={duration.name} value={duration.name}>{duration.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Revenue</Label>
                <Input
                  type="number"
                  value={editingStudent.revenue}
                  onChange={(e) => setEditingStudent({...editingStudent, revenue: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          )}
          <div className="flex space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditStudentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStudent} className="bg-gradient-to-r from-blue-600 to-blue-700">
              Update Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Modal */}
      <BulkEditStudentModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedStudents={students.filter(s => selectedStudents.includes(s.id))}
        onBulkUpdate={handleBulkEdit}
        roomGrades={roomGrades}
        stayDurations={stayDurations}
        vacantStudios={vacantStudios}
      />


    </div>
  );
};

export default StudentManagement;
