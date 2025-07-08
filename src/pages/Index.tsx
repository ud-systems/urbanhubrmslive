import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, TrendingUp, UserCheck, DollarSign, Bell, LogOut, Filter, Phone, Mail, ChevronDown, ChevronRight, Eye, Edit, Trash2 } from "lucide-react";
import LeadManagement from "@/components/LeadManagement";
import StudentManagement from "@/components/StudentManagement";
import Analytics from "@/components/Analytics";
import StudioManagement from "@/components/StudioManagement";
import LeadDetailsModal from "@/components/LeadDetailsModal";
import Reports from "./Reports";
import Notifications from "./Notifications";
import { useNavigate, useLocation } from "react-router-dom";
import ProfileDropdown from "@/components/ProfileDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { getLeads, getStudents, getStudios, createLead, updateLead, deleteLead, createStudent, updateStudent, deleteStudent, createStudio, updateStudio, deleteStudio, getRoomGrades, getStayDurations, getLeadSources, getUsers, getLeadStatus, getFollowUpStages, getResponseCategories, debugStudentsSchema, debugStudiosSchema } from "@/lib/supabaseCrud";
import { addDays, startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter, isBefore, isEqual } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import Settings from "./Settings";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);

  const { user } = useAuth();
  
  // Get current tab from URL or default to dashboard
  const getCurrentTab = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') || 'dashboard';
  };
  
  const [currentTab, setCurrentTab] = useState(getCurrentTab());
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', value);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };
  
  // Update tab when URL changes
  useEffect(() => {
    setCurrentTab(getCurrentTab());
  }, [location.search]);

  // Remove hardcoded user data - use actual authenticated user

  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");

  const [leadStatus, setLeadStatus] = useState([]);
  const [followUpStages, setFollowUpStages] = useState([]);

  const [leads, setLeads] = useState([]);
  const [students, setStudents] = useState([]);
  const [studios, setStudios] = useState([]);

  const [responseCategories, setResponseCategories] = useState([]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [roomGrades, setRoomGrades] = useState([]);
  const [stayDurations, setStayDurations] = useState([]);
  const [leadSources, setLeadSources] = useState([]);

  const [users, setUsers] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const statusOptions = ["New", "Hot", "Cold", "Converted", "Dead"];

  useEffect(() => {
    const fetchAll = async () => {
      setLeads(await getLeads());
      setStudents(await getStudents());
      setStudios(await getStudios());
      setRoomGrades((await getRoomGrades()) || []);
      setStayDurations((await getStayDurations()) || []);
      setLeadSources((await getLeadSources()) || []);
      setLeadStatus((await getLeadStatus()) || []);
      setFollowUpStages((await getFollowUpStages()) || []);
      setResponseCategories((await getResponseCategories()) || []);
      const allUsers = (await getUsers()) || [];
      setUsers(allUsers);
      setSalespeople(allUsers.filter(u => u.role === "salesperson"));
      
      // Debug: Check students table schema
      await debugStudentsSchema();
      // Debug: Check studios table schema
      await debugStudiosSchema();
    };
    fetchAll();
  }, []);

  const handleConvertLead = async (studentData: any) => {
    try {
      const createdStudent = await createStudent(studentData);
      setStudents(prev => [...prev, createdStudent]);
      
      // Update the lead status to "Converted" - we need to find the lead by matching data
      const matchingLead = leads.find(lead => 
        lead.name === studentData.name && 
        lead.phone === studentData.phone && 
        lead.email === studentData.email
      );
      
      if (matchingLead) {
        await updateLead(matchingLead.id, { status: "Converted" });
        setLeads(await getLeads());
      }
      
      // Handle studio assignment if provided
      if (studentData.assignedto) {
        await updateStudio(studentData.assignedto, { 
          occupied: true, 
          occupiedby: createdStudent.id 
        });
        // Refresh studios data to show updated occupancy
        const updatedStudios = await getStudios();
        setStudios(updatedStudios);
      }
    } catch (error) {
      console.error('Error converting lead:', error);
    }
  };

  const handleUpdateLead = async (updatedLead: any) => {
    await updateLead(updatedLead.id, updatedLead);
    setLeads(await getLeads());
  };

  const handleDeleteLead = async (leadId: number) => {
    await deleteLead(leadId);
    setLeads(await getLeads());
  };

  const handleUpdateStudent = async (updatedStudent: any) => {
    // Get the original student to compare studio assignment
    const originalStudent = students.find((s: any) => s.id === updatedStudent.id);
    
    await updateStudent(updatedStudent.id, updatedStudent);
    
    // Handle studio assignment changes
    if (originalStudent) {
      if (originalStudent.assignedto !== updatedStudent.assignedto) {
        // Clear previous studio assignment
        if (originalStudent.assignedto) {
          await updateStudio(originalStudent.assignedto, { 
            occupied: false, 
            occupiedby: null 
          });
        }
        
        // Set new studio assignment
        if (updatedStudent.assignedto) {
          await updateStudio(updatedStudent.assignedto, { 
            occupied: true, 
            occupiedby: updatedStudent.id 
          });
        }
        
        // Refresh studios data to show updated occupancy
        const updatedStudios = await getStudios();
        setStudios(updatedStudios);
      }
    }
    
    setStudents(await getStudents());
  };

  const handleDeleteStudent = async (studentId: number) => {
    const student = students.find((s: any) => s.id === studentId);
          if (student?.assignedto) {
        await updateStudio(student.assignedto, { occupied: false, occupiedby: null });
        // Refresh studios data to show updated occupancy
        const updatedStudios = await getStudios();
        setStudios(updatedStudios);
      }
    await deleteStudent(studentId);
    setStudents(await getStudents());
  };

  const handleUpdateStudio = async (updatedStudio: any) => {
    await updateStudio(updatedStudio.id, updatedStudio);
    const updatedStudios = await getStudios();
    setStudios(updatedStudios);
  };

  const handleDeleteStudio = async (studioId: string) => {
    await deleteStudio(studioId);
    const updatedStudios = await getStudios();
    setStudios(updatedStudios);
  };

  const handleAddStudio = async (studioData: any) => {
    await createStudio(studioData);
    const updatedStudios = await getStudios();
    setStudios(updatedStudios);
  };

  const toggleRowExpansion = (leadId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    setExpandedRows(newExpanded);
  };

  const handleViewLead = (lead: any) => {
    setSelectedLead(lead);
    setIsLeadDetailsOpen(true);
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleEditLead = (lead: any) => {
    // Implement lead editing logic here
  };

  const filteredLeadsForStats = leads.filter(l => {
    if (!l.dateofinquiry) return false;
    const leadDate = new Date(l.dateofinquiry);
    if (dateRange?.from && dateRange?.to) {
      return (isAfter(leadDate, dateRange.from) || isEqual(leadDate, dateRange.from)) &&
             (isBefore(leadDate, dateRange.to) || isEqual(leadDate, dateRange.to));
    }
    return true;
  });

  const stats = {
    totalLeads: filteredLeadsForStats.length,
    newLeads: filteredLeadsForStats.filter(l => l.status === "New").length,
    hotLeads: filteredLeadsForStats.filter(l => l.status === "Hot").length,
    coldLeads: filteredLeadsForStats.filter(l => l.status === "Cold").length,
    converted: filteredLeadsForStats.filter(l => l.status === "Converted").length,
    deadLeads: filteredLeadsForStats.filter(l => l.status === "Dead").length,
  };

  const studioStats = {
    total: studios.length,
    occupied: studios.filter(s => s.occupied).length,
    vacant: studios.filter(s => !s.occupied).length
  };

  // Filter leads for dashboard
  const filteredLeads = leads.filter(lead => {
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    const matchesResponse = responseFilter === "all" || lead.responsecategory === responseFilter;
    const matchesFollowUp = followUpFilter === "all" || lead.followupstage === followUpFilter;
    const matchesAssignedTo = assignedToFilter === "all" || lead.assignedto === assignedToFilter;
    
    return matchesStatus && matchesSource && matchesResponse && matchesFollowUp && matchesAssignedTo;
  }).slice(0, 8);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot": return "bg-orange-100 text-orange-800";
      case "Converted": return "bg-green-100 text-green-800";
      case "Cold": return "bg-blue-100 text-blue-800";
      case "Dead": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 font-inter-tight">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Student Accommodation Hub</h1>
              <p className="text-sm text-slate-500">Lead & Booking Management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="relative" onClick={handleNotificationClick}>
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white/80 backdrop-blur-md border border-slate-200/60 p-1 shadow-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Dashboard</TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Leads</TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Students</TabsTrigger>
            <TabsTrigger value="studios" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Studios</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Analytics</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Reports</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Dashboard Overview</h2>
              <p className="text-slate-600">Welcome back! Here's what's happening with your leads today.</p>
            </div>

            {/* Date Range Picker (styled like leads tab) */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-64 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
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
            </div>

            {/* Stats Cards - with all required stats except total revenue */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              <Button
                variant="ghost"
                className="p-0 h-auto border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30 hover:from-green-50/50 hover:to-green-100/50"
                onClick={() => navigate("/leads/new")}
              >
                <Card className="border-0 bg-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">New Leads</CardTitle>
                    <Users className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{stats.newLeads}</div>
                  </CardContent>
                </Card>
              </Button>
              <Button
                variant="ghost"
                className="p-0 h-auto border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-100/30 hover:from-blue-50/50 hover:to-blue-100/50"
                onClick={() => navigate("/leads/cold")}
              >
                <Card className="border-0 bg-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Cold Leads</CardTitle>
                    <Users className="h-4 w-4 text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{stats.coldLeads}</div>
                  </CardContent>
                </Card>
              </Button>
              <Button
                variant="ghost"
                className="p-0 h-auto border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-red-50/30 hover:from-red-50/50 hover:to-red-100/50"
                onClick={() => navigate("/leads/dead")}
              >
                <Card className="border-0 bg-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Dead Leads</CardTitle>
                    <Users className="h-4 w-4 text-red-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{stats.deadLeads}</div>
                  </CardContent>
                </Card>
              </Button>
              <Button
                variant="ghost"
                className="p-0 h-auto border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30 hover:from-orange-50/50 hover:to-orange-100/50"
                onClick={() => navigate("/leads/hot")}
              >
                <Card className="border-0 bg-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Hot Leads</CardTitle>
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{stats.hotLeads}</div>
                  </CardContent>
                </Card>
              </Button>
              <Button
                variant="ghost"
                className="p-0 h-auto border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50/30 hover:from-emerald-50/50 hover:to-emerald-100/50"
                onClick={() => navigate("/leads/converted")}
              >
                <Card className="border-0 bg-transparent">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Converted Leads</CardTitle>
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{stats.converted}</div>
                  </CardContent>
                </Card>
              </Button>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalLeads}</div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Filters */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Hot">Hot</SelectItem>
                      <SelectItem value="Cold">Cold</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                      <SelectItem value="Dead">Dead</SelectItem>
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
                      {responseCategories.map(category => (
                        <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
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

                  <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by assigned to" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {salespeople.map(user => (
                        <SelectItem key={user.id} value={user.name || user.email}>{user.name || user.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Latest Leads with expandable rows */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg">Latest Leads</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200">
                      <TableHead className="font-semibold w-8"></TableHead>
                      <TableHead className="font-semibold">Lead</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Source</TableHead>
                      <TableHead className="font-semibold">Response</TableHead>
                      <TableHead className="font-semibold">Revenue</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <React.Fragment key={lead.id}>
                        <TableRow className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(lead.id)}
                            >
                              {expandedRows.has(lead.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
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
                            <span className="font-semibold text-slate-900">£{(lead.revenue || 0).toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="outline" size="sm" onClick={() => handleViewLead(lead)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditLead(lead)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteLead(lead.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(lead.id) && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-slate-50 p-4">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-slate-600">Room Grade:</span>
                                  <p className="text-slate-900">{lead.roomgrade}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-slate-600">Duration:</span>
                                  <p className="text-slate-900">{lead.duration}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-slate-600">Assigned To:</span>
                                  <p className="text-slate-900">{lead.assignedto}</p>
                                </div>
                                <div className="col-span-3">
                                  <span className="font-medium text-slate-600">Notes:</span>
                                  <p className="text-slate-900">{lead.notes}</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads">
            <LeadManagement 
              studios={studios}
              leadStatus={leadStatus}
              followUpStages={followUpStages}
              responseCategories={responseCategories}
              roomGrades={roomGrades}
              stayDurations={stayDurations}
              leadSources={leadSources}
              salespeople={salespeople}
              onConvertLead={handleConvertLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
            />
          </TabsContent>

          <TabsContent value="students">
            <StudentManagement 
              students={students}
              studios={studios}
              studioStats={{
                total: studios.length,
                occupied: studios.filter((s: any) => s.occupied).length,
                vacant: studios.filter((s: any) => !s.occupied).length,
              }}
              roomGrades={roomGrades}
              stayDurations={stayDurations}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onAddStudent={(newStudent) => setStudents(prev => [...prev, newStudent])}
            />
          </TabsContent>

          <TabsContent value="studios">
            <StudioManagement 
              studios={studios}
              studioStats={studioStats}
              onUpdateStudio={handleUpdateStudio}
              onDeleteStudio={handleDeleteStudio}
              onAddStudio={handleAddStudio}
              roomGrades={roomGrades}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics leads={leads} students={students} />
          </TabsContent>

          <TabsContent value="reports">
            <Reports />
          </TabsContent>

          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </main>

      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isLeadDetailsOpen}
        onClose={() => setIsLeadDetailsOpen(false)}
      />
    </div>
  );
};

export default Index;
