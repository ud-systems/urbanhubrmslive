import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ConversionModal from "@/components/ConversionModal";
import BulkEditModal from "@/components/BulkEditModal";
import LeadDetailsModal from "@/components/LeadDetailsModal";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  UserPlus,
  Filter,
  Grid,
  List,
  Eye,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  EditIcon,
  Shield,
  AlertTriangle,
  Users,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { getLeads, createLead, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads } from "@/lib/supabaseCrud";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { TableRowSkeleton } from "@/components/LoadingSpinner";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
  source: string;
  roomgrade: string;
  duration: string;
  revenue: number;
  assignedto: string;
  notes: string;
  dateofinquiry: string;
  responsecategory: string;
  followupstage: string;
}

import { Studio } from "@/types";

interface LeadManagementProps {
  studios: Studio[];
  leadStatus: any[];
  followUpStages: any[];
  responseCategories: any[];
  roomGrades: any[];
  stayDurations: any[];
  leadSources: any[];
  salespeople: any[];
  studioViews: any[];
  onConvertLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (leadId: number) => void;
  operationLoading?: string | null;
}

const LeadManagement = ({ 
  studios, 
  leadStatus,
  followUpStages,
  responseCategories,
  roomGrades,
  stayDurations,
  leadSources,
  salespeople,
  studioViews,
  onConvertLead,
  onUpdateLead,
  onDeleteLead
}: LeadManagementProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [isViewLeadModalOpen, setIsViewLeadModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    status: "New",
    source: "",
    roomgrade: "",
    duration: "",
    assignedto: "",
    notes: "",
    dateofinquiry: "",
    responsecategory: "",
    followupstage: ""
  });

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      setLeads(data || []);
    } catch (e: any) {
      toast({ title: 'Error fetching leads', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (lead.phone || '').includes(searchTerm) ||
                         (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    const matchesResponse = responseFilter === "all" || lead.responsecategory === responseFilter;
    const matchesFollowUp = followUpFilter === "all" || lead.followupstage === followUpFilter;
    
    let matchesDateRange = true;
    if (dateRange?.from && dateRange?.to) {
      const leadDate = new Date(lead.dateofinquiry);
      matchesDateRange = leadDate >= dateRange.from && leadDate <= dateRange.to;
    }
    
    return matchesSearch && matchesStatus && matchesSource && matchesResponse && matchesFollowUp && matchesDateRange;
  });

  const handleSelectLead = (leadId: number, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleBulkUpdate = async (updates: Partial<Lead>) => {
    try {
      await bulkUpdateLeads(selectedLeads, updates);
      setLeads(prev => prev.map(lead => selectedLeads.includes(lead.id) ? { ...lead, ...updates } : lead));
      setSelectedLeads([]);
      toast({ title: 'Leads updated', description: 'Bulk update successful.' });
    } catch (e: any) {
      toast({ title: 'Bulk update failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) {
      toast({ 
        title: 'Access Denied', 
        description: 'Only administrators can delete leads.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      await bulkDeleteLeads(selectedLeads);
      setLeads(prev => prev.filter(lead => !selectedLeads.includes(lead.id)));
    setSelectedLeads([]);
      setIsBulkDeleteDialogOpen(false);
      toast({ 
        title: 'Leads deleted', 
        description: `${selectedLeads.length} leads have been permanently deleted.` 
      });
    } catch (e: any) {
      toast({ 
        title: 'Bulk delete failed', 
        description: e.message || String(e), 
        variant: 'destructive' 
      });
    }
  };

  const handleConvertLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsConversionModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditLeadModalOpen(true);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsViewLeadModalOpen(true);
  };

  const handleAddLead = async () => {
    try {
      const lead: Omit<Lead, 'id' | 'revenue'> = {
      ...newLead,
      status: "New",
        dateofinquiry: newLead.dateofinquiry || new Date().toISOString().split('T')[0]
    };
      const created = await createLead(lead);
      setLeads(prev => [...prev, created]);
    setIsAddLeadModalOpen(false);
    setNewLead({
      name: "",
      phone: "",
      email: "",
        status: "New",
      source: "",
        roomgrade: "",
      duration: "",
        assignedto: "",
      notes: "",
        dateofinquiry: "",
        responsecategory: "",
        followupstage: ""
    });
      toast({ title: 'Lead created', description: 'Lead added successfully.' });
    } catch (e: any) {
      toast({ title: 'Create failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    try {
      await updateLead(updatedLead.id, updatedLead);
      setLeads(await getLeads());
      onUpdateLead(updatedLead);
      toast({ title: 'Lead updated', description: 'Lead updated successfully.' });
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    try {
      await deleteLead(leadId);
      setLeads(await getLeads());
      onDeleteLead(leadId);
      toast({ title: 'Lead deleted', description: 'Lead deleted successfully.' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  // Calculate source stats for the current filtered leads
  const sourceStats = () => {
    const sourceCounts: { [key: string]: { total: number; converted: number } } = {};
    
    // Count leads by source and track conversions
    filteredLeads.forEach(lead => {
      const source = lead.source || 'Unknown';
      if (!sourceCounts[source]) {
        sourceCounts[source] = { total: 0, converted: 0 };
      }
      sourceCounts[source].total += 1;
      if (lead.status === 'Converted') {
        sourceCounts[source].converted += 1;
      }
    });
    
    // Get top 6 sources by total count, removing duplicates
    const uniqueSources = Object.keys(sourceCounts);
    const sortedSources = uniqueSources
      .map(source => ({
        source,
        total: sourceCounts[source].total,
        converted: sourceCounts[source].converted,
        conversionRate: sourceCounts[source].total > 0 
          ? Math.round((sourceCounts[source].converted / sourceCounts[source].total) * 100)
          : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
    
    return {
      totalLeads: filteredLeads.length,
      sources: sortedSources
    };
  };

  const stats = sourceStats();

  // Function to get color for source cards
  const getSourceColor = (source: string) => {
    const colors = [
      'from-blue-50/30 to-blue-100/30',
      'from-green-50/30 to-green-100/30', 
      'from-purple-50/30 to-purple-100/30',
      'from-orange-50/30 to-orange-100/30',
      'from-pink-50/30 to-pink-100/30',
      'from-indigo-50/30 to-indigo-100/30'
    ];
    const colorIndex = source.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot": return "bg-orange-100 text-orange-800";
      case "Converted": return "bg-green-100 text-green-800";
      case "Cold": return "bg-blue-100 text-blue-800";
      case "Dead": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Add this debugging info temporarily
  console.log('Debug info:', {
    selectedLeads: selectedLeads.length,
    isAdmin: isAdmin,
    userRole: user?.role,
    user: user
  });

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading leads..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Lead Management</h2>
          <p className="text-slate-600 mt-1">Track and manage your sales leads</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedLeads.length > 0 && (
            <>
            <Button
              onClick={() => setIsBulkEditModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit {selectedLeads.length} Selected
            </Button>
              
              {isAdmin && (
                <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete {selectedLeads.length} Selected
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
                          <span className="text-red-700 font-medium">Admin Action Required</span>
                        </div>
                        <p>
                          You are about to permanently delete <strong>{selectedLeads.length} leads</strong>. 
                          This action cannot be undone and will remove all associated data.
                        </p>
                        <p className="text-sm text-slate-600">
                          Selected leads: {selectedLeads.length} item{selectedLeads.length !== 1 ? 's' : ''}
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}

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

          <Dialog open={isAddLeadModalOpen} onOpenChange={setIsAddLeadModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Create a new lead with their contact information and preferences.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newLead.phone}
                    onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={newLead.source} onValueChange={(value) => setNewLead({...newLead, source: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSources.map(source => (
                        <SelectItem key={source.id} value={source.name}>{source.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room Grade</Label>
                  <Select value={newLead.roomgrade} onValueChange={(value) => setNewLead({...newLead, roomgrade: value})}>
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
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={newLead.duration} onValueChange={(value) => setNewLead({...newLead, duration: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {stayDurations.map(duration => (
                        <SelectItem key={duration.id} value={duration.name}>{duration.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Response Category</Label>
                  <Select value={newLead.responsecategory} onValueChange={value => setNewLead({...newLead, responsecategory: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select response category" />
                    </SelectTrigger>
                    <SelectContent>
                      {responseCategories.map(option => (
                        <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Follow Up Stage</Label>
                  <Select value={newLead.followupstage} onValueChange={(value) => setNewLead({...newLead, followupstage: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select follow up stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {followUpStages.map(stage => (
                        <SelectItem key={stage.id} value={stage.name}>{stage.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newLead.status} onValueChange={value => setNewLead({...newLead, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadStatus.map(option => (
                        <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Select value={newLead.assignedto} onValueChange={value => setNewLead({...newLead, assignedto: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select salesperson" />
                    </SelectTrigger>
                    <SelectContent>
                      {salespeople.map(user => (
                        <SelectItem key={user.id} value={user.name || user.email}>{user.name || user.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Inquiry</Label>
                  <Input
                    type="date"
                    value={newLead.dateofinquiry}
                    onChange={(e) => setNewLead({...newLead, dateofinquiry: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newLead.notes}
                    onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddLeadModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLead} className="bg-gradient-to-r from-blue-600 to-blue-700">Add Lead</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lead Source Count Cards */}
      <div className="flex gap-3 mb-6">
        {stats.sources.map((source, index) => (
          <Button
            key={source.source}
            variant="ghost"
            className={`p-0 h-auto border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white ${getSourceColor(source.source)} flex-1 hover:from-slate-50/50 hover:to-slate-100/50`}
            onClick={() => {
              // Map source names to routes - handle all sources
              const sourceRoutes: { [key: string]: string } = {
                'WhatsApp': '/sources/whatsapp',
                'TikTok': '/sources/tiktok',
                'Meta Ads': '/sources/meta-ads',
                'Direct': '/sources/direct',
                'Website': '/sources/website',
                'Google Ads': '/sources/google-ads',
                'Referral': '/sources/referral'
              };
              const route = sourceRoutes[source.source];
              if (route) {
                navigate(route);
              } else {
                // For any other source, navigate to a generic source page with the source as a parameter
                navigate(`/sources/${source.source.toLowerCase().replace(/\s+/g, '-')}`);
              }
            }}
          >
            <Card className="border-0 bg-transparent w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold text-slate-700 truncate">{source.source}</CardTitle>
                <Users className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-slate-900">{source.total}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-green-600">{source.converted}</span> converted
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    {source.conversionRate}%
                  </div>
                </div>
              </CardContent>
            </Card>
          </Button>
        ))}
        
        {/* Total Leads Card - always show */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50/30 flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold text-slate-700">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-slate-900">{stats.totalLeads}</div>
            <div className="text-sm text-slate-600 mt-2">
              {filteredLeads.filter(lead => lead.status === 'Converted').length} converted
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search leads by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-48">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} -{" "}
                        {format(dateRange.to, "LLL dd")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Pick date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {leadStatus.map(option => (
                  <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {leadSources.map(source => (
                  <SelectItem key={source.id} value={source.name}>{source.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={responseFilter} onValueChange={setResponseFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by response" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Responses</SelectItem>
                {responseCategories.map(option => (
                  <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by follow up" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Follow Ups</SelectItem>
                {followUpStages.map(stage => (
                  <SelectItem key={stage.id} value={stage.name}>{stage.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List View with Multiple Select */}
      {viewMode === "list" && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Lead</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Source</TableHead>
                  <TableHead className="font-semibold">Response</TableHead>
                  <TableHead className="font-semibold">Follow Up</TableHead>
                  <TableHead className="font-semibold">Revenue</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200">
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-medium">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900">{lead.name}</p>
                          <p className="text-sm text-slate-500">ID: {lead.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-600">{lead.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-600">{lead.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-700">{lead.source}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-700 text-sm">{lead.responsecategory}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {lead.followupstage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-900">£{(lead.revenue || 0).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewLead(lead)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditLead(lead)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteLead(lead.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConvertLead(lead)}
                        >
                          <UserPlus className="w-4 h-4" />
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
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-medium">
                      {lead.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <p className="text-sm text-slate-500">Lead #{lead.id.toString().padStart(4, '0')}</p>
                  </div>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Source</p>
                    <p className="font-medium text-slate-900">{lead.source}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Room Grade</p>
                    <p className="font-medium text-slate-900">{lead.roomgrade}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Duration</p>
                    <p className="font-medium text-slate-900">{lead.duration}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Response</p>
                    <p className="font-medium text-slate-900 text-xs">{lead.responsecategory}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{lead.phone}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{lead.email}</span>
                </div>

                {lead.notes && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-sm text-slate-700">{lead.notes}</p>
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-900">Est. Revenue</span>
                    <span className="text-lg font-bold text-blue-900">£{(lead.revenue || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleConvertLead(lead)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convert
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredLeads.length === 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Leads Found</h3>
            <p className="text-slate-500">
              {searchTerm || statusFilter !== "all" || sourceFilter !== "all" || responseFilter !== "all" || followUpFilter !== "all"
                ? "No leads match your search criteria." 
                : "No leads have been added yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Lead Modal */}
      <Dialog open={isEditLeadModalOpen} onOpenChange={setIsEditLeadModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update the lead's information and status.
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingLead.name}
                  onChange={(e) => setEditingLead({...editingLead, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editingLead.phone}
                  onChange={(e) => setEditingLead({...editingLead, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editingLead.email}
                  onChange={(e) => setEditingLead({...editingLead, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editingLead.status} onValueChange={value => setEditingLead({...editingLead, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStatus.map(option => (
                      <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={editingLead.source} onValueChange={(value) => setEditingLead({...editingLead, source: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map(source => (
                      <SelectItem key={source.id} value={source.name}>{source.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Response Category</Label>
                <Select value={editingLead.responsecategory} onValueChange={(value) => setEditingLead({...editingLead, responsecategory: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {responseCategories.map(option => (
                      <SelectItem key={option.id} value={option.name}>{option.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select value={editingLead.assignedto} onValueChange={value => setEditingLead({...editingLead, assignedto: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {salespeople.map(user => (
                      <SelectItem key={user.id} value={user.name || user.email}>{user.name || user.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room Grade</Label>
                <Select value={editingLead.roomgrade} onValueChange={(value) => setEditingLead({...editingLead, roomgrade: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomGrades.map(grade => (
                      <SelectItem key={grade.id} value={grade.name}>{grade.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editingLead.notes}
                  onChange={(e) => setEditingLead({...editingLead, notes: e.target.value})}
                />
              </div>
            </div>
          )}
          <div className="flex space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleUpdateLead(editingLead)} className="bg-gradient-to-r from-blue-600 to-blue-700">
              Update Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Details Modal */}
      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isViewLeadModalOpen}
        onClose={() => setIsViewLeadModalOpen(false)}
      />

      <ConversionModal
        lead={selectedLead}
        isOpen={isConversionModalOpen}
        onClose={() => {
          setIsConversionModalOpen(false);
          setSelectedLead(null);
          // Refresh leads data after conversion
          fetchLeads();
        }}
        onConvert={onConvertLead}
        studios={studios}
        studioViews={studioViews}
        roomGrades={roomGrades}
      />

      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedLeads={filteredLeads.filter(lead => selectedLeads.includes(lead.id))}
        onBulkUpdate={handleBulkUpdate}
        responseCategories={responseCategories}
        followUpStages={followUpStages}
        salespeople={salespeople}
      />
    </div>
  );
};

export default LeadManagement;
