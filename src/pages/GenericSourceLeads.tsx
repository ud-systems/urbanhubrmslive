import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, Filter, Eye, Edit, Trash2, Users, TrendingUp, UserCheck, ArrowLeft } from "lucide-react";
import { getLeads, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads } from "@/lib/supabaseCrud";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { TableRowSkeleton } from "@/components/LoadingSpinner";
import LoadingSpinner from "@/components/LoadingSpinner";
import LeadDetailsModal from "@/components/LeadDetailsModal";
import ProfileDropdown from "@/components/ProfileDropdown";

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

const GenericSourceLeads = () => {
  const { source } = useParams<{ source: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isViewLeadModalOpen, setIsViewLeadModalOpen] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const data = await getLeads();
        // Filter leads by the current source
        const sourceLeads = data?.filter(lead => 
          lead.source?.toLowerCase() === source?.toLowerCase()
        ) || [];
        setLeads(sourceLeads);
      } catch (e: any) {
        toast({ title: 'Error fetching leads', description: e.message || String(e), variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [source]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (lead.phone || '').includes(searchTerm) ||
                         (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    let matchesDateRange = true;
    if (dateRange?.from && dateRange?.to) {
      const leadDate = new Date(lead.dateofinquiry);
      matchesDateRange = leadDate >= dateRange.from && leadDate <= dateRange.to;
    }
    
    return matchesSearch && matchesStatus && matchesDateRange;
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

  const handleBulkDelete = async () => {
    if (!isAdmin) {
      toast({ title: 'Access denied', description: 'Only admins can delete leads.', variant: 'destructive' });
      return;
    }

    try {
      await bulkDeleteLeads(selectedLeads);
      setLeads(prev => prev.filter(lead => !selectedLeads.includes(lead.id)));
      setSelectedLeads([]);
      toast({ title: 'Leads deleted', description: 'Bulk delete successful.' });
    } catch (e: any) {
      toast({ title: 'Bulk delete failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsViewLeadModalOpen(true);
  };

  const handleDeleteLead = async (leadId: number) => {
    if (!isAdmin) {
      toast({ title: 'Access denied', description: 'Only admins can delete leads.', variant: 'destructive' });
      return;
    }

    try {
      await deleteLead(leadId);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      toast({ title: 'Lead deleted', description: 'Lead deleted successfully.' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-green-100 text-green-800";
      case "Hot": return "bg-orange-100 text-orange-800";
      case "Converted": return "bg-green-100 text-green-800";
      case "Cold": return "bg-blue-100 text-blue-800";
      case "Dead": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatSourceName = (sourceName: string) => {
    return sourceName.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading leads..." />;
  }

  const sourceName = formatSourceName(source || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 font-inter-tight">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{sourceName} Leads</h1>
              <p className="text-sm text-slate-500">Lead & Booking Management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{filteredLeads.length}</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Converted</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {filteredLeads.filter(lead => lead.status === 'Converted').length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Hot Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {filteredLeads.filter(lead => lead.status === 'Hot').length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-red-50/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {filteredLeads.length > 0 
                    ? Math.round((filteredLeads.filter(lead => lead.status === 'Converted').length / filteredLeads.length) * 100)
                    : 0}%
                </div>
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
                    <Filter className="mr-2 h-4 w-4" />
                    {statusFilter === "all" ? "All Statuses" : statusFilter}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Hot">Hot</SelectItem>
                    <SelectItem value="Cold">Cold</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                    <SelectItem value="Dead">Dead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedLeads.length > 0 && (
            <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-red-100/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-red-700">
                      {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      onClick={handleBulkDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leads Table */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Leads from {sourceName}</span>
                <span className="text-sm font-normal text-slate-500">
                  {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          No leads found for {sourceName}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLeads.includes(lead.id)}
                              onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  {lead.name?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{lead.name}</div>
                                <div className="text-sm text-slate-500">{lead.assignedto}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">{lead.phone}</span>
                              </div>
                              <div className="text-sm text-slate-500">{lead.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              ${lead.revenue?.toLocaleString() || '0'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-500">
                              {lead.dateofinquiry ? format(new Date(lead.dateofinquiry), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewLead(lead)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteLead(lead.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lead Details Modal */}
      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isViewLeadModalOpen}
        onClose={() => setIsViewLeadModalOpen(false)}
      />
    </div>
  );
};

export default GenericSourceLeads; 