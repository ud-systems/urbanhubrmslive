import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  AlertTriangle,
  User,
  CheckCircle
} from "lucide-react";
import { getStudents, updateStudent, deleteStudent, createStudent, updateStudio, bulkDeleteStudents, createStudentUserAccount, createStudentWithUserAccount, createStudentInvoice, getPaymentPlans } from "@/lib/supabaseCrud";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import BulkEditStudentModal from "@/components/BulkEditStudentModal";
import { TableRowSkeleton } from "@/components/LoadingSpinner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ValidatedInput, ValidatedSelectWrapper } from '@/components/ui/validated-input';
import { validateForm, showValidationErrors, commonRules } from '@/lib/formValidation';

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

import { Studio } from "@/types";

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
  const navigate = useNavigate();
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
  const [durationType, setDurationType] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [dailyRate, setDailyRate] = useState(45);
  const [weeklyRate, setWeeklyRate] = useState(320);
  const [customWeeks, setCustomWeeks] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [studioSearchTerm, setStudioSearchTerm] = useState("");
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState("");
  const [paymentPlans, setPaymentPlans] = useState<any[]>([]);
  const vacantStudios = studios.filter(studio => !studio.occupied);

  // Fetch payment plans on component mount
  useEffect(() => {
    const fetchPaymentPlans = async () => {
      try {
        const plans = await getPaymentPlans();
        setPaymentPlans(plans || []);
      } catch (error) {
        console.error('Error fetching payment plans:', error);
      }
    };
    fetchPaymentPlans();
  }, []);

  const calculateRevenue = () => {
    if (durationType === "short" && checkInDate && checkOutDate) {
      const days = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
      setTotalRevenue(days * dailyRate);
    } else if (durationType === "45-weeks") {
      setTotalRevenue(45 * weeklyRate);
    } else if (durationType === "51-weeks") {
      setTotalRevenue(51 * weeklyRate);
    } else if (durationType === "custom" && customWeeks) {
      setTotalRevenue(parseInt(customWeeks) * weeklyRate);
    }
  };

  // Auto-calculate revenue when rates or duration changes
  useEffect(() => {
    if (durationType && (weeklyRate > 0 || dailyRate > 0)) {
      calculateRevenue();
    }
  }, [durationType, weeklyRate, dailyRate, checkInDate, checkOutDate, customWeeks]);



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
      
      // Clear studio assignment if student was assigned to a studio
      if (student?.assignedto) {
        try {
          await updateStudio(student.assignedto, { 
            occupied: false, 
            occupiedby: null 
          });
        } catch (studioError) {
          console.warn('Failed to update studio occupancy:', studioError);
        }
      }
      
      // Delete the student
      await deleteStudent(studentId);
      
      // Call the parent callback to update the main state
      onDeleteStudent(studentId);
      
      toast({ title: 'Student deleted', description: 'Student deleted successfully.' });
    } catch (e: any) {
      console.error('Delete student error:', e);
      toast({ title: 'Delete failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const handleAddStudent = async () => {
    // Define validation rules with proper typing
    const validationRules: any = {
      name: commonRules.name,
      email: commonRules.email,
      phone: commonRules.phone,
      durationType: { required: true },
      assignedto: { required: true }
    };

    // Add conditional validation for dates
    if (durationType === "short" || durationType === "custom") {
      validationRules.checkin = { required: true };
      if (durationType === "short") {
        validationRules.checkout = { required: true };
      }
    }

    if (durationType === "custom") {
      validationRules.customWeeks = { 
        required: true,
        custom: (value: any) => !isNaN(Number(value)) && Number(value) > 0
      };
    }

    // Add payment plan validation for long-term stays
    if (durationType === "45-weeks" || durationType === "51-weeks" || durationType === "custom") {
      validationRules.selectedPaymentPlan = { required: true };
    }

    // Validate form data
    const formData = {
      ...newStudent,
      durationType,
      assignedto: newStudent.assignedto,
      checkin: checkInDate,
      checkout: checkOutDate,
      customWeeks,
      selectedPaymentPlan
    };

    const validation = validateForm(formData, validationRules);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showValidationErrors(validation.errors, validation.firstErrorField);
      return;
    }

    // Clear validation errors if form is valid
    setValidationErrors({});

    try {
      // Prepare student data with calculated duration and revenue
      const studentData = {
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
        assignedto: newStudent.assignedto,
        checkin: checkInDate || new Date().toISOString().split('T')[0],
        duration: durationType === "45-weeks" ? "45 weeks" : 
                  durationType === "51-weeks" ? "51 weeks" : 
                  durationType === "custom" ? `${customWeeks} weeks` : 
                  checkInDate && checkOutDate ? `${Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))} days` : "",
        revenue: totalRevenue || 0,
        // Add payment plan information for long-term stays
        ...(selectedPaymentPlan && {
          payment_plan_id: parseInt(selectedPaymentPlan),
          wants_installments: true,
          selected_installment_plan: paymentPlans.find(p => p.id.toString() === selectedPaymentPlan)?.name || ''
        })
        // Note: Don't include 'room' field as it causes foreign key constraint violations
        // The 'assignedto' field handles studio assignment
      };

      // Create student with user account link
      const result = await createStudentWithUserAccount(studentData);
      
      if (!result || !result.success) {
        const errorMessage = (result as any)?.error || 'Failed to create student with user account';
        throw new Error(errorMessage);
      }
      
      // Update studio occupancy if studio is assigned
      if (newStudent.assignedto) {
        await updateStudio(newStudent.assignedto, { 
          occupied: true, 
          occupiedby: result.student.id 
        });
      }

      // Automatically create invoice for the student
      try {
        await createStudentInvoice(result.student);
        console.log('Invoice created automatically for student:', result.student.name);
      } catch (invoiceError) {
        console.warn('Failed to create automatic invoice:', invoiceError);
        // Don't fail the student creation if invoice fails
      }

      // Show success message with login details
      toast({ 
        title: 'Student Portal Created', 
        description: `Student account created with email: ${studentData.email}. Default password: ${result.defaultPassword}` 
      });
      
      onAddStudent(result.student);
      setIsAddStudentModalOpen(false);
      
      // Reset all form states
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
      setDurationType("");
      setCheckInDate("");
      setCheckOutDate("");
      setDailyRate(45);
      setWeeklyRate(320);
      setCustomWeeks("");
      setTotalRevenue(0);
      setStudioSearchTerm("");
      setValidationErrors({});
      setSelectedPaymentPlan("");
    } catch (e: any) {
      console.error('Student creation error:', e);
      toast({ 
        title: 'Create failed', 
        description: e.message || 'Failed to create student. Please try again.',
        variant: 'destructive' 
      });
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
      const studentsToDelete = students.filter(s => selectedStudents.includes(s.id));
      const selectedCount = selectedStudents.length;
      
      // Clear studio assignments first
      for (const student of studentsToDelete) {
        if (student.assignedto) {
          try {
            await updateStudio(student.assignedto, { 
              occupied: false, 
              occupiedby: null 
            });
          } catch (studioError) {
            console.warn('Failed to update studio occupancy:', studioError);
          }
        }
      }
      
      // Delete students
      await bulkDeleteStudents(selectedStudents);
      
      // Call the parent callback to update the main state
      selectedStudents.forEach(studentId => {
        onDeleteStudent(studentId);
      });
      
      setSelectedStudents([]);
      setIsBulkDeleteDialogOpen(false);
      
      toast({ 
        title: 'Students deleted', 
        description: `${selectedCount} students have been permanently deleted.` 
      });
    } catch (e: any) {
      console.error('Bulk delete error:', e);
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

  // Create user account for student
  const handleCreateUserAccount = async (student: Student) => {
    try {
      // Check if student already has a user account
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', student.email)
        .eq('role', 'student')
        .single();

      if (existingUser) {
        toast({ 
          title: 'User Account Exists', 
          description: 'This student already has a user account.', 
          variant: 'destructive' 
        });
        return;
      }

      // Create user account for the student
      const userAccount = await createStudentUserAccount({
        name: student.name,
        email: student.email,
        phone: student.phone
      });
      
      if (userAccount?.success) {
        // Update student record with user_id
        await supabase
          .from('students')
          .update({ user_id: userAccount.user.id })
          .eq('id', student.id);

        toast({ 
          title: 'User Account Created', 
          description: `Student account created with email: ${student.email}. Default password: ${userAccount.defaultPassword}` 
        });
      } else {
        toast({ 
          title: 'Creation Failed', 
          description: 'Failed to create user account for student.', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error creating user account:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create user account for student.', 
        variant: 'destructive' 
      });
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading students..." />;
  }

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
                    <AlertDialogDescription asChild>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-red-700 font-medium">Dangerous Action</span>
                        </div>
                        <div>
                          You are about to permanently delete <strong>{selectedStudents.length} students</strong>. 
                          This action cannot be undone and will remove all associated data including studio assignments.
                        </div>
                        <div className="text-sm text-slate-600">
                          Selected students: {selectedStudents.length} item{selectedStudents.length !== 1 ? 's' : ''}
                        </div>
                      </div>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Add New Student
              </DialogTitle>
              <p className="text-sm text-slate-600">
                Add a new student and assign them to a studio with booking details.
              </p>
            </DialogHeader>

            <div className="space-y-6">
              {/* Student Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedInput
                  label="Name"
                  fieldName="name"
                  value={newStudent.name}
                  onChange={e => setNewStudent(s => ({ ...s, name: e.target.value }))}
                  placeholder="Full name"
                  required
                  error={validationErrors.name}
                />
                <ValidatedInput
                  label="Phone"
                  fieldName="phone"
                  value={newStudent.phone}
                  onChange={e => setNewStudent(s => ({ ...s, phone: e.target.value }))}
                  placeholder="Phone number"
                  required
                  error={validationErrors.phone}
                />
                <ValidatedInput
                  label="Email"
                  fieldName="email"
                  type="email"
                  value={newStudent.email}
                  onChange={e => setNewStudent(s => ({ ...s, email: e.target.value }))}
                  placeholder="Email address"
                  required
                  error={validationErrors.email}
                />
              </div>

              {/* Studio Assignment */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Studio Assignment</Label>
                <Select 
                  value={newStudent.assignedto || "none"} 
                  onValueChange={value => {
                    const selectedStudioId = value === "none" ? "" : value;
                    const selectedStudio = studios.find(s => s.id === selectedStudioId);
                    setNewStudent(s => ({ 
                      ...s, 
                      assignedto: selectedStudioId,
                      room: selectedStudio?.roomGrade || "" // Auto-populate room grade from selected studio
                    }));
                    
                    // Auto-set weekly rate based on room grade if available
                    if (selectedStudio?.roomGrade) {
                      // Find the room grade and get its default weekly rate
                      const roomGradeData = roomGrades.find(rg => rg.name === selectedStudio.roomGrade);
                      if (roomGradeData && roomGradeData.weekly_rate) {
                        setWeeklyRate(roomGradeData.weekly_rate);
                      }
                    }
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
                    value={newStudent.room || "Not assigned"}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
              </div>

              {/* Duration Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Booking Duration</Label>
                <Select value={durationType} onValueChange={setDurationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short Stay (Daily)</SelectItem>
                    <SelectItem value="45-weeks">45 Weeks</SelectItem>
                    <SelectItem value="51-weeks">51 Weeks</SelectItem>
                    <SelectItem value="custom">Custom Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Plan Selection - Only for long-term stays */}
              {(durationType === "45-weeks" || durationType === "51-weeks" || durationType === "custom") && (
                <div className="space-y-4">
                  <Label className="text-base font-medium">Payment Plan</Label>
                  <Select value={selectedPaymentPlan} onValueChange={setSelectedPaymentPlan}>
                    <SelectTrigger className={validationErrors.selectedPaymentPlan ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select payment plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentPlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} ({plan.payment_cycles} cycles)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.selectedPaymentPlan && (
                    <p className="text-sm text-red-600">{validationErrors.selectedPaymentPlan}</p>
                  )}
                  {selectedPaymentPlan && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          ✓ Payment plan selected: {paymentPlans.find(p => p.id.toString() === selectedPaymentPlan)?.name}
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Installment amount will be calculated based on your weekly rate
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Date Inputs */}
              {(durationType === "short" || durationType === "custom") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkin">Check-in Date</Label>
                    <Input
                      id="checkin"
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkout">Check-out Date</Label>
                    <Input
                      id="checkout"
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {durationType === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="weeks">Number of Weeks</Label>
                  <Input
                    id="weeks"
                    type="number"
                    placeholder="Enter number of weeks"
                    value={customWeeks}
                    onChange={(e) => setCustomWeeks(e.target.value)}
                  />
                </div>
              )}

              {/* Rate Configuration */}
              <div className="grid grid-cols-2 gap-4">
                {durationType === "short" && (
                  <div className="space-y-2">
                    <Label htmlFor="daily-rate">Daily Rate (£)</Label>
                    <Input
                      id="daily-rate"
                      type="number"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(Number(e.target.value))}
                    />
                  </div>
                )}
                {(durationType === "45-weeks" || durationType === "51-weeks" || durationType === "custom") && (
                  <div className="space-y-2">
                    <Label htmlFor="weekly-rate">Weekly Rate (£)</Label>
                    <Input
                      id="weekly-rate"
                      type="number"
                      value={weeklyRate}
                      onChange={(e) => setWeeklyRate(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              {/* Revenue is calculated automatically */}

              {/* Total Revenue Display */}
              {totalRevenue > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-green-900 font-medium">Total Revenue:</span>
                    <span className="text-2xl font-bold text-green-900">£{totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setIsAddStudentModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddStudent} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!newStudent.name || !durationType || (!checkInDate && durationType !== "45-weeks" && durationType !== "51-weeks")}
                >
                  Add Student
                </Button>
              </div>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/student/${student.id}`)}
                        className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditStudent(student)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCreateUserAccount(student)}
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        title="Create User Account"
                      >
                        <User className="w-4 h-4" />
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
            <DialogDescription>
              Update the student information below. All changes will be saved automatically.
            </DialogDescription>
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
                <Label>Assigned Studio</Label>
                <Select 
                  value={editingStudent.assignedto || "none"} 
                  onValueChange={value => {
                    const selectedStudioId = value === "none" ? "" : value;
                    const selectedStudio = studios.find(s => s.id === selectedStudioId);
                    setEditingStudent({
                      ...editingStudent, 
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
                      .filter(studio => !studio.occupied || studio.occupiedby === editingStudent.id)
                      .map(studio => (
                        <SelectItem key={studio.id} value={studio.id}>
                          {studio.name} - Floor {studio.floor === 0 ? 'Ground Floor' : `Floor ${studio.floor}`} ({studio.roomGrade || 'No grade'})
                          {studio.occupiedby === editingStudent.id && " (Currently assigned)"}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room Grade</Label>
                <Input
                  value={editingStudent.room || "Not assigned"}
                  disabled
                  className="bg-slate-50"
                />
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
