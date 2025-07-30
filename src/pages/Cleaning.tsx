import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getCleaningSchedules, 
  getCleaningSupplies, 
  getStudios,
  createCleaningSchedule,
  updateCleaningSchedule,
  deleteCleaningSchedule,
  createCleaningTask,
  updateCleaningTask,
  deleteCleaningTask,
  createCleaningSupply,
  updateCleaningSupply,
  deleteCleaningSupply,
  startCleaningTask,
  completeCleaningTask,
  getUsers
} from '@/lib/supabaseCrud';
import { autoScheduleUpcomingCleanings, updateOverdueCleanings, getAutomationStats } from '@/lib/cleaningAutomation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { toast } from 'sonner';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  Users,
  Building2,
  Package,
  ArrowLeft,
  Play,
  Save,
  X
} from "lucide-react";

interface CleaningSchedule {
  id: number;
  studio_id: string;
  reservation_type: 'student' | 'tourist';
  reservation_id?: number;
  scheduled_date: string;
  scheduled_time?: string;
  checkout_trigger_date?: string;
  cleaning_type: 'checkout' | 'deep_clean' | 'maintenance' | 'emergency';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  assigned_cleaner_id?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimated_duration?: number;
  notes?: string;
  special_requirements?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  studio?: any;
  cleaner?: any;
  tasks?: CleaningTask[];
}

interface CleaningTask {
  id: number;
  schedule_id: number;
  task_name: string;
  description?: string;
  is_completed: boolean;
  estimated_minutes?: number;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  created_at: string;
}

interface CleaningSupply {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  supplier?: string;
  cost_per_unit?: number;
  created_at?: string;
}

const Cleaning = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<CleaningSchedule[]>([]);
  const [supplies, setSupplies] = useState<CleaningSupply[]>([]);
  const [studios, setStudios] = useState<any[]>([]);
  const [cleaners, setCleaners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Dialog states
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [supplyDialogOpen, setSupplyDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [viewScheduleDialogOpen, setViewScheduleDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CleaningSchedule | null>(null);
  const [editingSupply, setEditingSupply] = useState<CleaningSupply | null>(null);
  const [viewingSchedule, setViewingSchedule] = useState<CleaningSchedule | null>(null);
  const [selectedScheduleForTask, setSelectedScheduleForTask] = useState<CleaningSchedule | null>(null);

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    studio_id: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '10:00',
    cleaning_type: 'checkout' as 'checkout' | 'deep_clean' | 'maintenance' | 'emergency',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    assigned_cleaner_id: 'auto-assign',
    estimated_duration: 120,
    notes: '',
    special_requirements: ''
  });

  const [supplyForm, setSupplyForm] = useState({
    name: '',
    description: '',
    quantity: 0,
    unit: '',
    reorder_level: 5,
    supplier: '',
    cost_per_unit: 0
  });

  const [taskForm, setTaskForm] = useState({
    task_name: '',
    description: '',
    estimated_minutes: 15
  });

  // Loading states
  const [submitting, setSubmitting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalSchedules: 0,
    completedToday: 0,
    pendingToday: 0,
    overdueSchedules: 0,
    lowStockSupplies: 0
  });

  // Automation stats
  const [automationStats, setAutomationStats] = useState({
    upcomingCheckouts: 0,
    autoScheduled: 0,
    needsScheduling: 0,
    efficiency: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from database
      const [schedulesData, suppliesData, studiosData, cleanersData, automationStatsData] = await Promise.all([
        getCleaningSchedules(),
        getCleaningSupplies(),
        getStudios(),
        getUsers(), // Get all users, will filter for cleaners
        getAutomationStats()
      ]);

      setSchedules(schedulesData || []);
      setSupplies(suppliesData || []);
      setStudios(studiosData || []);
      // Filter for cleaner role only
      setCleaners(cleanersData?.filter(user => user.role === 'cleaner') || []);
      setAutomationStats(automationStatsData);
      
      // Calculate stats from real data
      const today = new Date().toISOString().split('T')[0];
      const totalSchedules = schedulesData?.length || 0;
      const completedToday = schedulesData?.filter(s => 
        s.scheduled_date === today && s.status === 'completed'
      ).length || 0;
      const pendingToday = schedulesData?.filter(s => 
        s.scheduled_date === today && (s.status === 'scheduled' || s.status === 'in_progress')
      ).length || 0;
      const overdueSchedules = schedulesData?.filter(s => 
        s.scheduled_date < today && s.status !== 'completed' && s.status !== 'cancelled'
      ).length || 0;
      const lowStockSupplies = suppliesData?.filter(s => s.quantity <= s.reorder_level).length || 0;

      setStats({
        totalSchedules,
        completedToday,
        pendingToday,
        overdueSchedules,
        lowStockSupplies
      });

    } catch (error) {
      console.error('Error fetching cleaning data:', error);
      toast.error('Failed to load cleaning data');
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations for Cleaning Schedules
  const handleCreateSchedule = async () => {
    if (!scheduleForm.studio_id) {
      toast.error('Please select a studio');
      return;
    }

    setSubmitting(true);
    try {
      const newSchedule = await createCleaningSchedule({
        ...scheduleForm,
        assigned_cleaner_id: scheduleForm.assigned_cleaner_id === 'auto-assign' ? null : scheduleForm.assigned_cleaner_id,
        reservation_type: 'student' // Default to student for now
      });
      
      if (newSchedule) {
        toast.success('Cleaning schedule created successfully');
        setScheduleDialogOpen(false);
        resetScheduleForm();
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create cleaning schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;

    setSubmitting(true);
    try {
      const updatedSchedule = await updateCleaningSchedule(editingSchedule.id, {
        ...scheduleForm,
        assigned_cleaner_id: scheduleForm.assigned_cleaner_id === 'auto-assign' ? null : scheduleForm.assigned_cleaner_id
      });
      
      if (updatedSchedule) {
        toast.success('Cleaning schedule updated successfully');
        setScheduleDialogOpen(false);
        setEditingSchedule(null);
        resetScheduleForm();
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update cleaning schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('Are you sure you want to delete this cleaning schedule?')) return;

    try {
      await deleteCleaningSchedule(scheduleId);
      toast.success('Cleaning schedule deleted successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete cleaning schedule');
    }
  };

  const handleStartCleaning = async (scheduleId: number) => {
    try {
      await startCleaningTask(scheduleId);
      toast.success('Cleaning task started');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error starting cleaning:', error);
      toast.error('Failed to start cleaning task');
    }
  };

  const handleCompleteCleaning = async (scheduleId: number) => {
    try {
      await completeCleaningTask(scheduleId);
      toast.success('Cleaning task completed');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error completing cleaning:', error);
      toast.error('Failed to complete cleaning task');
    }
  };

  // CRUD Operations for Cleaning Supplies
  const handleCreateSupply = async () => {
    if (!supplyForm.name || !supplyForm.unit) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      const newSupply = await createCleaningSupply(supplyForm);
      
      if (newSupply) {
        toast.success('Cleaning supply added successfully');
        setSupplyDialogOpen(false);
        resetSupplyForm();
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating supply:', error);
      toast.error('Failed to add cleaning supply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSupply = async () => {
    if (!editingSupply) return;

    setSubmitting(true);
    try {
      const updatedSupply = await updateCleaningSupply(editingSupply.id, supplyForm);
      
      if (updatedSupply) {
        toast.success('Cleaning supply updated successfully');
        setSupplyDialogOpen(false);
        setEditingSupply(null);
        resetSupplyForm();
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating supply:', error);
      toast.error('Failed to update cleaning supply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupply = async (supplyId: number) => {
    if (!confirm('Are you sure you want to delete this cleaning supply?')) return;

    try {
      await deleteCleaningSupply(supplyId);
      toast.success('Cleaning supply deleted successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error deleting supply:', error);
      toast.error('Failed to delete cleaning supply');
    }
  };

  // CRUD Operations for Cleaning Tasks
  const handleCreateTask = async () => {
    if (!selectedScheduleForTask || !taskForm.task_name) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      const newTask = await createCleaningTask({
        ...taskForm,
        schedule_id: selectedScheduleForTask.id
      });
      
      if (newTask) {
        toast.success('Cleaning task added successfully');
        setTaskDialogOpen(false);
        resetTaskForm();
        setSelectedScheduleForTask(null);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to add cleaning task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId: number, completed: boolean) => {
    try {
      await updateCleaningTask(taskId, { 
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null
      });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  // Form Reset Functions
  const resetScheduleForm = () => {
    setScheduleForm({
      studio_id: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '10:00',
      cleaning_type: 'checkout',
      priority: 'normal',
      assigned_cleaner_id: 'auto-assign',
      estimated_duration: 120,
      notes: '',
      special_requirements: ''
    });
  };

  const resetSupplyForm = () => {
    setSupplyForm({
      name: '',
      description: '',
      quantity: 0,
      unit: '',
      reorder_level: 5,
      supplier: '',
      cost_per_unit: 0
    });
  };

  const resetTaskForm = () => {
    setTaskForm({
      task_name: '',
      description: '',
      estimated_minutes: 15
    });
  };

  // Dialog Handlers
  const openEditSchedule = (schedule: CleaningSchedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      studio_id: schedule.studio_id,
      scheduled_date: schedule.scheduled_date,
      scheduled_time: schedule.scheduled_time || '10:00',
      cleaning_type: schedule.cleaning_type,
      priority: schedule.priority,
      assigned_cleaner_id: schedule.assigned_cleaner_id || 'auto-assign',
      estimated_duration: schedule.estimated_duration || 120,
      notes: schedule.notes || '',
      special_requirements: schedule.special_requirements || ''
    });
    setScheduleDialogOpen(true);
  };

  const openEditSupply = (supply: CleaningSupply) => {
    setEditingSupply(supply);
    setSupplyForm({
      name: supply.name,
      description: supply.description || '',
      quantity: supply.quantity,
      unit: supply.unit,
      reorder_level: supply.reorder_level,
      supplier: supply.supplier || '',
      cost_per_unit: supply.cost_per_unit || 0
    });
    setSupplyDialogOpen(true);
  };

  const openViewSchedule = (schedule: CleaningSchedule) => {
    setViewingSchedule(schedule);
    setViewScheduleDialogOpen(true);
  };

  const openAddTask = (schedule: CleaningSchedule) => {
    setSelectedScheduleForTask(schedule);
    setTaskDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCleaningTypeColor = (type: string) => {
    switch (type) {
      case 'checkout': return 'bg-blue-100 text-blue-800';
      case 'deep_clean': return 'bg-purple-100 text-purple-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusColor = (quantity: number, reorderLevel: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity <= reorderLevel) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  // Automation functions
  const handleAutoSchedule = async () => {
    try {
      setSubmitting(true);
      toast.info('🤖 Running auto-scheduler for upcoming checkouts...');
      
      const result = await autoScheduleUpcomingCleanings();
      
      if (result.success) {
        toast.success(`✅ Auto-scheduling completed! ${result.schedulesCreated} cleaning schedules processed.`);
        fetchData(); // Refresh data
      } else {
        toast.error(`❌ Auto-scheduling failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in auto-scheduling:', error);
      toast.error('Failed to run auto-scheduler');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOverdue = async () => {
    try {
      setSubmitting(true);
      const result = await updateOverdueCleanings();
      
      if (result.success) {
        toast.success(`✅ Updated ${result.updated} overdue cleaning schedules`);
        fetchData(); // Refresh data
      } else {
        toast.error(`❌ Failed to update overdue cleanings: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating overdue cleanings:', error);
      toast.error('Failed to update overdue cleanings');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = 
      schedule.studio?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.cleaner?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;
    const matchesType = typeFilter === 'all' || schedule.cleaning_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const todaySchedules = schedules.filter(schedule => 
    schedule.scheduled_date === new Date().toISOString().split('T')[0]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-slate-600">Loading Cleaning Module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-3xl font-bold text-slate-900">Cleaning Management</h1>
          <p className="text-xs md:text-slate-600 mt-1 md:mt-2 text-slate-500">Manage cleaning schedules, tasks, and supplies</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:ml-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center justify-center space-x-2 order-last md:order-first text-xs md:text-sm px-3 py-2"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            <span>Back</span>
          </Button>
          <div className="flex space-x-2 md:space-x-3">
            <Button variant="outline" className="text-xs md:text-sm px-3 py-2">
              <CalendarIcon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">View Calendar</span>
              <span className="md:hidden">Calendar</span>
            </Button>
            <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingSchedule(null);
                  resetScheduleForm();
                }} className="text-xs md:text-sm px-3 py-2">
                  <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="hidden md:inline">Schedule Cleaning</span>
                  <span className="md:hidden">Schedule</span>
                </Button>
              </DialogTrigger>
                      <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Edit Cleaning Schedule' : 'Schedule New Cleaning'}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule ? 'Update the cleaning schedule details below.' : 'Create a new cleaning schedule for a studio.'}
            </DialogDescription>
          </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studio">Studio *</Label>
                    <Select
                      value={scheduleForm.studio_id}
                      onValueChange={(value) => setScheduleForm(prev => ({ ...prev, studio_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Studio" />
                      </SelectTrigger>
                      <SelectContent>
                        {studios && studios.length > 0 ? studios.map((studio) => (
                          <SelectItem key={studio.id} value={studio.id}>
                            {studio.name} - Floor {studio.floor}
                          </SelectItem>
                        )) : (
                          <SelectItem value="no-studios" disabled>No studios available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cleaner">Assigned Cleaner</Label>
                    <Select
                      value={scheduleForm.assigned_cleaner_id}
                      onValueChange={(value) => setScheduleForm(prev => ({ ...prev, assigned_cleaner_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Auto-assign or select cleaner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto-assign">Auto-assign</SelectItem>
                        {cleaners && cleaners.length > 0 ? cleaners.map((cleaner) => (
                          <SelectItem key={cleaner.id} value={cleaner.id}>
                            {cleaner.name} ({cleaner.email})
                          </SelectItem>
                        )) : (
                          <SelectItem value="none" disabled>No cleaners available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Scheduled Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduleForm.scheduled_date}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Scheduled Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduleForm.scheduled_time}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Cleaning Type</Label>
                    <Select
                      value={scheduleForm.cleaning_type}
                      onValueChange={(value) => setScheduleForm(prev => ({ ...prev, cleaning_type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkout">Checkout Cleaning</SelectItem>
                        <SelectItem value="deep_clean">Deep Clean</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={scheduleForm.priority}
                      onValueChange={(value) => setScheduleForm(prev => ({ ...prev, priority: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>



                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes..."
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={scheduleForm.estimated_duration}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 120 }))}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="requirements">Special Requirements</Label>
                    <Textarea
                      id="requirements"
                      placeholder="Any special requirements..."
                      value={scheduleForm.special_requirements}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, special_requirements: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Schedules</p>
                <p className="text-2xl font-bold">{stats.totalSchedules}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Completed Today</p>
                <p className="text-2xl font-bold">{stats.completedToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pending Today</p>
                <p className="text-2xl font-bold">{stats.pendingToday}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Overdue</p>
                <p className="text-2xl font-bold">{stats.overdueSchedules}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Low Stock</p>
                <p className="text-2xl font-bold">{stats.lowStockSupplies}</p>
              </div>
              <Package className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-md border border-slate-200/60 p-1 shadow-sm">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="today">Today's Tasks</TabsTrigger>
          <TabsTrigger value="supplies">Supplies</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-slate-900">Cleaning Schedule</CardTitle>
                <div className="flex space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search schedules..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="checkout">Checkout</SelectItem>
                      <SelectItem value="deep_clean">Deep Clean</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Studio</TableHead>
                    <TableHead>Cleaner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules && filteredSchedules.length > 0 ? filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="font-medium">{schedule.studio?.name}</p>
                            <p className="text-sm text-slate-500">Floor {schedule.studio?.floor}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="font-medium">{schedule.cleaner?.name}</p>
                            <p className="text-sm text-slate-500">{schedule.cleaner?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCleaningTypeColor(schedule.cleaning_type)}>
                          {schedule.cleaning_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{new Date(schedule.scheduled_date).toLocaleDateString()}</p>
                          {schedule.scheduled_time && (
                            <p className="text-sm text-slate-500">{schedule.scheduled_time}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {schedule.tasks?.filter(t => t.is_completed).length || 0} / {schedule.tasks?.length || 0} completed
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openViewSchedule(schedule)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditSchedule(schedule)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {schedule.status === 'scheduled' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStartCleaning(schedule.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          ) : schedule.status === 'in_progress' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCompleteCleaning(schedule.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          ) : null}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                        No cleaning schedules found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Today's Tasks Tab */}
        <TabsContent value="today" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">Today's Cleaning Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {todaySchedules.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No cleaning tasks scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaySchedules.map((schedule) => (
                    <Card key={schedule.id} className="border border-slate-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{schedule.studio?.name}</h3>
                            <p className="text-sm text-slate-500">
                              {schedule.cleaner?.name} • {schedule.scheduled_time}
                            </p>
                          </div>
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Tasks:</span>
                            <span className="text-sm text-slate-500">
                              {schedule.tasks?.filter(t => t.is_completed).length || 0} / {schedule.tasks?.length || 0} completed
                            </span>
                          </div>
                          <div className="space-y-2">
                            {schedule.tasks?.map((task) => (
                              <div key={task.id} className="flex items-center space-x-3">
                                <Checkbox 
                                  checked={task.is_completed}
                                  disabled={schedule.status === 'completed'}
                                  onCheckedChange={(checked) => handleToggleTask(task.id, checked as boolean)}
                                />
                                <span className={`text-sm ${task.is_completed ? 'line-through text-slate-400' : ''}`}>
                                  {task.task_name}
                                </span>
                                {task.description && (
                                  <span className="text-xs text-slate-500">- {task.description}</span>
                                )}
                              </div>
                            ))}
                          </div>
                          {schedule.notes && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-md">
                              <p className="text-sm text-slate-600">{schedule.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplies Tab */}
        <TabsContent value="supplies" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-slate-900">Cleaning Supplies</CardTitle>
                <Dialog open={supplyDialogOpen} onOpenChange={setSupplyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingSupply(null);
                      resetSupplyForm();
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Supply
                    </Button>
                  </DialogTrigger>
                          <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSupply ? 'Edit Supply' : 'Add New Supply'}
            </DialogTitle>
            <DialogDescription>
              {editingSupply ? 'Update the supply information below.' : 'Add a new cleaning supply to your inventory.'}
            </DialogDescription>
          </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="supply-name">Name *</Label>
                        <Input
                          id="supply-name"
                          placeholder="Supply name"
                          value={supplyForm.name}
                          onChange={(e) => setSupplyForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supply-description">Description</Label>
                        <Textarea
                          id="supply-description"
                          placeholder="Description..."
                          value={supplyForm.description}
                          onChange={(e) => setSupplyForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={supplyForm.quantity}
                            onChange={(e) => setSupplyForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="unit">Unit *</Label>
                          <Input
                            id="unit"
                            placeholder="e.g. bottles, kg, liters"
                            value={supplyForm.unit}
                            onChange={(e) => setSupplyForm(prev => ({ ...prev, unit: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="reorder">Reorder Level</Label>
                          <Input
                            id="reorder"
                            type="number"
                            value={supplyForm.reorder_level}
                            onChange={(e) => setSupplyForm(prev => ({ ...prev, reorder_level: parseInt(e.target.value) || 5 }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cost">Cost per Unit (£)</Label>
                          <Input
                            id="cost"
                            type="number"
                            step="0.01"
                            value={supplyForm.cost_per_unit}
                            onChange={(e) => setSupplyForm(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          placeholder="Supplier name"
                          value={supplyForm.supplier}
                          onChange={(e) => setSupplyForm(prev => ({ ...prev, supplier: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <Button variant="outline" onClick={() => setSupplyDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={editingSupply ? handleUpdateSupply : handleCreateSupply}
                        disabled={submitting}
                      >
                        {submitting ? 'Saving...' : editingSupply ? 'Update Supply' : 'Add Supply'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplies && supplies.length > 0 ? supplies.map((supply) => (
                    <TableRow key={supply.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{supply.name}</p>
                          {supply.description && (
                            <p className="text-sm text-slate-500">{supply.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStockStatusColor(supply.quantity, supply.reorder_level)}>
                          {supply.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>{supply.unit}</TableCell>
                      <TableCell>{supply.reorder_level}</TableCell>
                      <TableCell>{supply.supplier || 'N/A'}</TableCell>
                      <TableCell>
                        {supply.cost_per_unit ? `£${supply.cost_per_unit.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditSupply(supply)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteSupply(supply.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                        No cleaning supplies found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">Cleaning Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-blue-600">This Week</p>
                      <p className="text-2xl font-bold text-blue-800">{stats.totalSchedules} schedules</p>
                    </div>
                    <CalendarIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-green-600">Completed</p>
                      <p className="text-2xl font-bold text-green-800">{stats.completedToday}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm text-red-600">Overdue</p>
                      <p className="text-2xl font-bold text-red-800">{stats.overdueSchedules}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    View Weekly Schedule
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    Order Supplies
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Assign Cleaners
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Cleaning Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Automation Section */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">🤖 Cleaning Automation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Upcoming Checkouts */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-blue-600">Upcoming Checkouts</p>
                    <p className="text-2xl font-bold text-blue-800">{automationStats.upcomingCheckouts}</p>
                    <p className="text-xs text-blue-500">Next 3 days</p>
                  </div>
                </div>

                {/* Auto-Scheduled */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-green-600">Auto-Scheduled</p>
                    <p className="text-2xl font-bold text-green-800">{automationStats.autoScheduled}</p>
                    <p className="text-xs text-green-500">Cleanings ready</p>
                  </div>
                </div>

                {/* Needs Scheduling */}
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-yellow-600">Needs Scheduling</p>
                    <p className="text-2xl font-bold text-yellow-800">{automationStats.needsScheduling}</p>
                    <p className="text-xs text-yellow-500">Missing schedules</p>
                  </div>
                </div>

                {/* Efficiency */}
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-purple-600">Efficiency</p>
                    <p className="text-2xl font-bold text-purple-800">{automationStats.efficiency}%</p>
                    <p className="text-xs text-purple-500">Auto-coverage</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleAutoSchedule}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Auto-Schedule Cleanings
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handleUpdateOverdue}
                  disabled={submitting}
                  variant="outline"
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Update Overdue Status
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">📋 How Automation Works:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Monitors student and tourist checkout dates</li>
                  <li>• Automatically creates cleaning schedules 3 days before checkout</li>
                  <li>• Assigns cleaners based on availability and workload</li>
                  <li>• Updates overdue schedules and priorities</li>
                  <li>• Tracks efficiency and completion rates</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Schedule Dialog */}
      <Dialog open={viewScheduleDialogOpen} onOpenChange={setViewScheduleDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Schedule Details</DialogTitle>
            <DialogDescription>
              View and manage the details of this cleaning schedule.
            </DialogDescription>
          </DialogHeader>
          {viewingSchedule && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Studio</Label>
                    <p className="text-lg font-semibold">{viewingSchedule.studio?.name}</p>
                    <p className="text-sm text-slate-500">Floor {viewingSchedule.studio?.floor}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Cleaning Type</Label>
                    <Badge className={getCleaningTypeColor(viewingSchedule.cleaning_type)}>
                      {viewingSchedule.cleaning_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-600">Status</Label>
                    <Badge className={getStatusColor(viewingSchedule.status)}>
                      {viewingSchedule.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Assigned Cleaner</Label>
                    <p className="text-lg font-semibold">{viewingSchedule.cleaner?.name || 'Auto-assigned'}</p>
                    {viewingSchedule.cleaner?.email && (
                      <p className="text-sm text-slate-500">{viewingSchedule.cleaner.email}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-600">Schedule</Label>
                    <p className="text-lg font-semibold">
                      {new Date(viewingSchedule.scheduled_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-500">{viewingSchedule.scheduled_time}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-600">Priority</Label>
                    <Badge variant={viewingSchedule.priority === 'urgent' ? 'destructive' : 'secondary'}>
                      {viewingSchedule.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {viewingSchedule.notes && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Notes</Label>
                  <div className="mt-2 p-3 bg-slate-50 rounded-md">
                    <p className="text-sm">{viewingSchedule.notes}</p>
                  </div>
                </div>
              )}

              {viewingSchedule.special_requirements && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Special Requirements</Label>
                  <div className="mt-2 p-3 bg-slate-50 rounded-md">
                    <p className="text-sm">{viewingSchedule.special_requirements}</p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-slate-600">Tasks</Label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openAddTask(viewingSchedule)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
                
                {viewingSchedule.tasks && viewingSchedule.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {viewingSchedule.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <Checkbox 
                            checked={task.is_completed}
                            onCheckedChange={(checked) => handleToggleTask(task.id, checked as boolean)}
                          />
                          <div>
                            <span className={`text-sm font-medium ${task.is_completed ? 'line-through text-slate-400' : ''}`}>
                              {task.task_name}
                            </span>
                            {task.description && (
                              <p className="text-xs text-slate-500">{task.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {task.estimated_minutes}min
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500">
                    <p className="text-sm">No tasks assigned yet</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setViewScheduleDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setViewScheduleDialogOpen(false);
                  openEditSchedule(viewingSchedule);
                }}>
                  Edit Schedule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Add a specific task to this cleaning schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name *</Label>
              <Input
                id="task-name"
                placeholder="Task name"
                value={taskForm.task_name}
                onChange={(e) => setTaskForm(prev => ({ ...prev, task_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Task description..."
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-minutes">Estimated Minutes</Label>
              <Input
                id="task-minutes"
                type="number"
                value={taskForm.estimated_minutes}
                onChange={(e) => setTaskForm(prev => ({ ...prev, estimated_minutes: parseInt(e.target.value) || 15 }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTask}
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cleaning; 