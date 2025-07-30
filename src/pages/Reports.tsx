import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Download, 
  Filter, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Building2, 
  DollarSign,
  Calendar as CalendarIcon,
  PieChart,
  Activity,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  ChevronDown,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  getLeads, 
  getStudents, 
  getStudios, 
  getUsers,
  getLeadStatus,
  getLeadSources,
  getResponseCategories,
  getFollowUpStages,
  getRoomGrades,
  getStayDurations
} from "@/lib/supabaseCrud";
import { 
  getCompleteStudentData, 
  getStudentDataSummary, 
  exportStudentData, 
  downloadFile,
  type CompleteStudentData 
} from "@/lib/studentDataExport";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { DateRange } from "react-day-picker";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ReportData {
  leads: any[];
  students: any[];
  studios: any[];
  users: any[];
}

interface FilterOptions {
  leadStatus: any[];
  leadSources: any[];
  responseCategories: any[];
  followUpStages: any[];
  roomGrades: any[];
  stayDurations: any[];
}

interface ReportMetrics {
  totalLeads: number;
  totalStudents: number;
  totalStudios: number;
  totalUsers: number;
  conversionRate: number;
  totalRevenue: number;
  avgRevenue: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  leadsByResponseCategory: Record<string, number>;
  leadsByFollowUpStage: Record<string, number>;
  studentsByRoomGrade: Record<string, number>;
  studentsByDuration: Record<string, number>;
  studiosByRoomGrade: Record<string, number>;
  monthlyTrends: Array<{ month: string; leads: number; students: number; revenue: number }>;
}

const Reports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("leads");
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState("30");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData>({ leads: [], students: [], studios: [], users: [] });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    leadStatus: [],
    leadSources: [],
    responseCategories: [],
    followUpStages: [],
    roomGrades: [],
    stayDurations: []
  });
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const { toast } = useToast();

  // Filter states
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [responseCategory, setResponseCategory] = useState("all");
  const [followUpStage, setFollowUpStage] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [assignedStudio, setAssignedStudio] = useState("all");
  const [roomGrade, setRoomGrade] = useState("all");
  const [duration, setDuration] = useState("all");

  // Student data state
  const [completeStudentData, setCompleteStudentData] = useState<CompleteStudentData[]>([]);
  const [studentSummary, setStudentSummary] = useState<any>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  // Fetch all data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        leads, 
        students, 
        studios, 
        users,
        leadStatus,
        leadSources,
        responseCategories,
        followUpStages,
        roomGrades,
        stayDurations
      ] = await Promise.all([
        getLeads(),
        getStudents(),
        getStudios(),
        getUsers(),
        getLeadStatus(),
        getLeadSources(),
        getResponseCategories(),
        getFollowUpStages(),
        getRoomGrades(),
        getStayDurations()
      ]);
      
      setData({ 
        leads: leads || [], 
        students: students || [], 
        studios: studios || [], 
        users: users || [] 
      });
      
      setFilterOptions({
        leadStatus: leadStatus || [],
        leadSources: leadSources || [],
        responseCategories: responseCategories || [],
        followUpStages: followUpStages || [],
        roomGrades: roomGrades || [],
        stayDurations: stayDurations || []
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date();
    
    if (customDateRange?.from && customDateRange?.to) {
      return { startDate: customDateRange.from, endDate: customDateRange.to };
    }
    
    // Handle numeric presets (days ago)
    if (!isNaN(parseInt(dateRange))) {
      const daysAgo = parseInt(dateRange);
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      return { startDate, endDate: now };
    }
    
    // Handle text presets
    switch (dateRange) {
      case "week":
        return { startDate: startOfWeek(now), endDate: endOfWeek(now) };
      case "month":
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case "quarter":
        return { startDate: startOfQuarter(now), endDate: endOfQuarter(now) };
      case "year":
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      default:
        // Fallback to last 30 days
        const startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        return { startDate, endDate: now };
    }
  };

  // Calculate metrics based on filtered data
  const metrics = useMemo((): ReportMetrics => {
    const { startDate, endDate } = getDateRange();

    // Filter data by date range
    const filteredLeads = data.leads.filter(lead => {
      const leadDate = new Date(lead.dateofinquiry || lead.created_at);
      return leadDate >= startDate && leadDate <= endDate;
    });

    const filteredStudents = data.students.filter(student => {
      const studentDate = new Date(student.checkin || student.created_at);
      return studentDate >= startDate && studentDate <= endDate;
    });

    // Calculate metrics
    const totalLeads = filteredLeads.length;
    const totalStudents = filteredStudents.length;
    const totalStudios = data.studios.length;
    const totalUsers = data.users.length;
    const conversionRate = totalLeads > 0 ? (totalStudents / totalLeads) * 100 : 0;
    
    const totalRevenue = filteredStudents.reduce((sum, student) => {
      return sum + (parseFloat(student.revenue) || 0);
    }, 0);
    
    const avgRevenue = totalStudents > 0 ? totalRevenue / totalStudents : 0;

    // Group by status
    const leadsByStatus = filteredLeads.reduce((acc, lead) => {
      const status = lead.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by source
    const leadsBySource = filteredLeads.reduce((acc, lead) => {
      const source = lead.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by response category
    const leadsByResponseCategory = filteredLeads.reduce((acc, lead) => {
      const category = lead.responsecategory || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by follow up stage
    const leadsByFollowUpStage = filteredLeads.reduce((acc, lead) => {
      const stage = lead.followupstage || 'Unknown';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group students by room grade
    const studentsByRoomGrade = filteredStudents.reduce((acc, student) => {
      const grade = student.room || 'Unknown';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group students by duration
    const studentsByDuration = filteredStudents.reduce((acc, student) => {
      const duration = student.duration || 'Unknown';
      acc[duration] = (acc[duration] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group studios by room grade
    const studiosByRoomGrade = data.studios.reduce((acc, studio) => {
      const grade = studio.roomGrade || 'Unknown';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Monthly trends for last 12 months
    const monthlyTrends = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthLeads = filteredLeads.filter(lead => {
        const leadDate = new Date(lead.dateofinquiry || lead.created_at);
        return leadDate.getMonth() === monthDate.getMonth() && 
               leadDate.getFullYear() === monthDate.getFullYear();
      }).length;

      const monthStudents = filteredStudents.filter(student => {
        const studentDate = new Date(student.checkin || student.created_at);
        return studentDate.getMonth() === monthDate.getMonth() && 
               studentDate.getFullYear() === monthDate.getFullYear();
      });

      const monthRevenue = monthStudents.reduce((sum, student) => {
        return sum + (parseFloat(student.revenue) || 0);
      }, 0);

      monthlyTrends.push({
        month: monthName,
        leads: monthLeads,
        students: monthStudents.length,
        revenue: monthRevenue
      });
    }

    return {
      totalLeads,
      totalStudents,
      totalStudios,
      totalUsers,
      conversionRate,
      totalRevenue,
      avgRevenue,
      leadsByStatus,
      leadsBySource,
      leadsByResponseCategory,
      leadsByFollowUpStage,
      studentsByRoomGrade,
      studentsByDuration,
      studiosByRoomGrade,
      monthlyTrends
    };
  }, [data, dateRange, customDateRange]);

  // Filter data based on current filters
  useEffect(() => {
    let filtered = [];
    const { startDate, endDate } = getDateRange();
    
    switch (reportType) {
      case "leads":
        filtered = data.leads;
        if (status !== "all") {
          filtered = filtered.filter(lead => lead.status === status);
        }
        if (source !== "all") {
          filtered = filtered.filter(lead => lead.source === source);
        }
        if (responseCategory !== "all") {
          filtered = filtered.filter(lead => lead.responsecategory === responseCategory);
        }
        if (followUpStage !== "all") {
          filtered = filtered.filter(lead => lead.followupstage === followUpStage);
        }
        if (assignedTo !== "all") {
          filtered = filtered.filter(lead => lead.assignedto === assignedTo);
        }
        if (roomGrade !== "all") {
          filtered = filtered.filter(lead => lead.roomgrade === roomGrade);
        }
        if (duration !== "all") {
          filtered = filtered.filter(lead => lead.duration === duration);
        }
        break;
      case "students":
        filtered = data.students;
        if (assignedStudio !== "all") {
          filtered = filtered.filter(student => student.assignedto === assignedStudio);
        }
        if (responseCategory !== "all") {
          filtered = filtered.filter(student => student.responsecategory === responseCategory);
        }
        if (followUpStage !== "all") {
          filtered = filtered.filter(student => student.followupstage === followUpStage);
        }
        if (roomGrade !== "all") {
          filtered = filtered.filter(student => student.room === roomGrade);
        }
        if (duration !== "all") {
          filtered = filtered.filter(student => student.duration === duration);
        }
        break;
      case "studios":
        filtered = data.studios;
        if (assignedTo !== "all") {
          filtered = filtered.filter(studio => studio.assignedto === assignedTo);
        }
        if (roomGrade !== "all") {
          filtered = filtered.filter(studio => studio.roomGrade === roomGrade);
        }
        break;
      case "users":
        filtered = data.users;
        break;
      default:
        filtered = data.leads;
    }

    // Apply date filter
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.dateofinquiry || item.checkin || item.created_at);
      return itemDate >= startDate && itemDate <= endDate;
    });

    setFilteredData(filtered);
  }, [data, reportType, dateRange, customDateRange, status, source, responseCategory, followUpStage, assignedTo, assignedStudio, roomGrade, duration]);

  const generateReport = () => {
    toast({
      title: "Report Generated",
      description: `${filteredData.length} records found for ${reportType} report`,
    });
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast({
        title: "No Data",
        description: "No data to export",
        variant: "destructive"
      });
      return;
    }

    const headers = Object.keys(filteredData[0]);
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `CSV file downloaded with ${filteredData.length} records`,
    });
  };

  const exportToJSON = () => {
    if (filteredData.length === 0) {
      toast({
        title: "No Data",
        description: "No data to export",
        variant: "destructive"
      });
      return;
    }

    const jsonContent = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `JSON file downloaded with ${filteredData.length} records`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Get unique values for dynamic filters
  const getUniqueValues = (field: string) => {
    const values = new Set();
    data.leads.forEach(lead => {
      if (lead[field]) values.add(lead[field]);
    });
    data.students.forEach(student => {
      if (student[field]) values.add(student[field]);
    });
    return Array.from(values).sort();
  };

  // Handle preset date range selection
  const handlePresetDateRange = (preset: string) => {
    setDateRange(preset);
    setCustomDateRange(undefined);
  };

  // Handle custom date range selection
  const handleCustomDateRange = (range: DateRange | undefined) => {
    setCustomDateRange(range);
    setDateRange("custom");
  };

  // Get display text for date range
  const getDateRangeDisplay = () => {
    if (customDateRange?.from && customDateRange?.to) {
      return `${format(customDateRange.from, 'MMM dd')} - ${format(customDateRange.to, 'MMM dd, yyyy')}`;
    }
    
    switch (dateRange) {
      case "7": return "Last 7 days";
      case "30": return "Last 30 days";
      case "90": return "Last 90 days";
      case "365": return "Last year";
      case "week": return "This week";
      case "month": return "This month";
      case "quarter": return "This quarter";
      case "year": return "This year";
      default: return "Last 30 days";
    }
  };

  // Student data functions
  const fetchStudentData = async () => {
    setStudentLoading(true);
    try {
      const [studentData, summary] = await Promise.all([
        getCompleteStudentData({ includeIncomplete: true }),
        getStudentDataSummary()
      ]);
      
      setCompleteStudentData(studentData);
      setStudentSummary(summary);
      
      toast({
        title: "Success",
        description: `Loaded ${studentData.length} student records with complete profile data`
      });
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student data",
        variant: "destructive"
      });
    } finally {
      setStudentLoading(false);
    }
  };

  const handleExportStudents = async () => {
    try {
      const csvData = await exportStudentData(completeStudentData, 'csv');
      const filename = `students_complete_data_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
      downloadFile(csvData, filename, 'text/csv');
      
      toast({
        title: "Export Successful",
        description: `Downloaded ${completeStudentData.length} student records`
      });
    } catch (error) {
      console.error('Error exporting student data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export student data",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading reports..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-[1440px] mx-auto px-6 py-8 animate-fade-in">
        <div className="space-y-6">
          {/* Header with title, subtitle, and back button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Reports & Analytics</h1>
              <p className="text-slate-600 mt-1">Generate comprehensive reports and export data</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/modules')}
              className="text-slate-600 hover:text-slate-900 border-slate-300 hover:border-slate-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="tourists" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Tourists
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Finance
          </TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Leads Reports</h2>
              <p className="text-slate-600 mt-1">Analyze lead performance and conversion metrics</p>
            </div>
            <Button onClick={fetchData} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview Dashboard</SelectItem>
                  <SelectItem value="leads">Leads Report</SelectItem>
                  <SelectItem value="students">Students Report</SelectItem>
                  <SelectItem value="studios">Studios Report</SelectItem>
                  <SelectItem value="users">Users Report</SelectItem>
                  <SelectItem value="revenue">Revenue Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Enhanced Date Range Filter */}
            <div>
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Select value={dateRange} onValueChange={handlePresetDateRange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="quarter">This quarter</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                  </SelectContent>
                </Select>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="px-3">
                      <CalendarIcon className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={customDateRange?.from}
                      selected={customDateRange}
                      onSelect={handleCustomDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {dateRange === "custom" && customDateRange?.from && (
                <p className="text-xs text-slate-500 mt-1">
                  {getDateRangeDisplay()}
                </p>
              )}
            </div>
            
            {/* Dynamic filters based on report type */}
            {reportType === "leads" && (
              <>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {filterOptions.leadStatus.map((status) => (
                        <SelectItem key={status.id} value={status.name}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {filterOptions.leadSources.map((source) => (
                        <SelectItem key={source.id} value={source.name}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Response Category</Label>
                  <Select value={responseCategory} onValueChange={setResponseCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {filterOptions.responseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Follow Up Stage</Label>
                  <Select value={followUpStage} onValueChange={setFollowUpStage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {filterOptions.followUpStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.name}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Room Grade</Label>
                  <Select value={roomGrade} onValueChange={setRoomGrade}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Room Grades</SelectItem>
                      {filterOptions.roomGrades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.name}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Durations</SelectItem>
                      {filterOptions.stayDurations.map((duration) => (
                        <SelectItem key={duration.id} value={duration.name}>
                          {duration.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {data.users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {reportType === "students" && (
              <>
                <div>
                  <Label>Room Grade</Label>
                  <Select value={roomGrade} onValueChange={setRoomGrade}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Room Grades</SelectItem>
                      {filterOptions.roomGrades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.name}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Durations</SelectItem>
                      {filterOptions.stayDurations.map((duration) => (
                        <SelectItem key={duration.id} value={duration.name}>
                          {duration.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assigned Studio</Label>
                  <Select value={assignedStudio} onValueChange={setAssignedStudio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Studios</SelectItem>
                      {data.studios.map((studio) => (
                        <SelectItem key={studio.id} value={studio.id}>
                          {studio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Response Category</Label>
                  <Select value={responseCategory} onValueChange={setResponseCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {filterOptions.responseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Follow Up Stage</Label>
                  <Select value={followUpStage} onValueChange={setFollowUpStage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {filterOptions.followUpStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.name}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {reportType === "studios" && (
              <>
                <div>
                  <Label>Room Grade</Label>
                  <Select value={roomGrade} onValueChange={setRoomGrade}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Room Grades</SelectItem>
                      {filterOptions.roomGrades.map((grade) => (
                        <SelectItem key={grade.id} value={grade.name}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {data.users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-4 mt-4">
            <Button onClick={generateReport} className="bg-gradient-to-r from-blue-600 to-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={exportToJSON}>
              <FileText className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Dashboard */}
      {reportType === "overview" && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Leads</p>
                    <p className="text-2xl font-bold text-blue-900">{metrics.totalLeads}</p>
                    <p className="text-xs text-blue-600">{getDateRangeDisplay()}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Students</p>
                    <p className="text-2xl font-bold text-green-900">{metrics.totalStudents}</p>
                    <p className="text-xs text-green-600">{getDateRangeDisplay()}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-purple-900">{metrics.conversionRate.toFixed(1)}%</p>
                    <p className="text-xs text-purple-600">Leads to Students</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-amber-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-amber-900">{formatCurrency(metrics.totalRevenue)}</p>
                    <p className="text-xs text-amber-600">{getDateRangeDisplay()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads by Status */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Leads by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.leadsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{status}</Badge>
                        <span className="text-sm text-slate-600">{count}</span>
                      </div>
                      <div className="flex-1 mx-4">
                        <Progress 
                          value={(count / metrics.totalLeads) * 100} 
                          className="h-2"
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {((count / metrics.totalLeads) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Leads by Source */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Leads by Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.leadsBySource).map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{source}</Badge>
                        <span className="text-sm text-slate-600">{count}</span>
                      </div>
                      <div className="flex-1 mx-4">
                        <Progress 
                          value={(count / metrics.totalLeads) * 100} 
                          className="h-2"
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {((count / metrics.totalLeads) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Categories */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Leads by Response Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.leadsByResponseCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{category}</Badge>
                        <span className="text-sm text-slate-600">{count}</span>
                      </div>
                      <div className="flex-1 mx-4">
                        <Progress 
                          value={(count / metrics.totalLeads) * 100} 
                          className="h-2"
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {((count / metrics.totalLeads) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Students by Room Grade */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Students by Room Grade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.studentsByRoomGrade).map(([grade, count]) => (
                    <div key={grade} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{grade}</Badge>
                        <span className="text-sm text-slate-600">{count}</span>
                      </div>
                      <div className="flex-1 mx-4">
                        <Progress 
                          value={(count / metrics.totalStudents) * 100} 
                          className="h-2"
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {((count / metrics.totalStudents) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Monthly Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.monthlyTrends.map((trend, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{trend.month}</TableCell>
                        <TableCell>{trend.leads}</TableCell>
                        <TableCell>{trend.students}</TableCell>
                        <TableCell>{formatCurrency(trend.revenue)}</TableCell>
                        <TableCell>
                          {trend.leads > 0 ? ((trend.students / trend.leads) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Detailed Reports */}
      {reportType !== "overview" && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Results</span>
              <Badge variant="secondary">{filteredData.length} records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading data...
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No data found for the selected filters</p>
                <p className="text-sm">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(filteredData[0]).slice(0, 10).map((key) => (
                        <TableHead key={key} className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.slice(0, 50).map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).slice(0, 10).map((value, i) => (
                          <TableCell key={i} className="max-w-xs truncate">
                            {typeof value === 'string' && value.includes('-') && !isNaN(Date.parse(value))
                              ? formatDate(value)
                              : typeof value === 'number' && value > 1000
                              ? formatCurrency(value)
                              : String(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredData.length > 50 && (
                  <div className="text-center py-4 text-slate-500">
                    <p>Showing first 50 of {filteredData.length} records</p>
                    <p className="text-sm">Export to see all data</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
        </TabsContent>

                   {/* Students Tab */}
           <TabsContent value="students" className="space-y-6">
             <div className="flex items-center justify-between">
               <div>
                 <h2 className="text-xl font-semibold text-slate-900">Students Reports</h2>
                 <p className="text-slate-600 mt-1">Analyze student enrollment and performance metrics</p>
               </div>
               <div className="flex items-center space-x-3">
                 <Button onClick={fetchStudentData} disabled={studentLoading} variant="outline">
                   <RefreshCw className={`w-4 h-4 mr-2 ${studentLoading ? 'animate-spin' : ''}`} />
                   Refresh Data
                 </Button>
                 <Button onClick={handleExportStudents} disabled={studentLoading} className="bg-green-600 hover:bg-green-700">
                   <Download className="w-4 h-4 mr-2" />
                   Export All Students
                 </Button>
               </div>
             </div>
             
             {/* Student Data Summary */}
             {studentSummary && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                   <CardContent className="p-6">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-slate-600">Total Students</p>
                         <p className="text-2xl font-bold text-slate-900">{studentSummary.total}</p>
                       </div>
                       <Users className="w-8 h-8 text-blue-600" />
                     </div>
                   </CardContent>
                 </Card>
                 
                 <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                   <CardContent className="p-6">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-slate-600">Complete Profiles</p>
                         <p className="text-2xl font-bold text-green-600">{studentSummary.withCompleteProfiles}</p>
                       </div>
                       <CheckCircle className="w-8 h-8 text-green-600" />
                     </div>
                   </CardContent>
                 </Card>
                 
                 <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                   <CardContent className="p-6">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-slate-600">Incomplete Profiles</p>
                         <p className="text-2xl font-bold text-orange-600">{studentSummary.withIncompleteProfiles}</p>
                       </div>
                       <AlertCircle className="w-8 h-8 text-orange-600" />
                     </div>
                   </CardContent>
                 </Card>
                 
                 <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                   <CardContent className="p-6">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-slate-600">Profile Completion</p>
                         <p className="text-2xl font-bold text-purple-600">
                           {studentSummary.total > 0 ? Math.round((studentSummary.withCompleteProfiles / studentSummary.total) * 100) : 0}%
                         </p>
                       </div>
                       <BarChart3 className="w-8 h-8 text-purple-600" />
                     </div>
                   </CardContent>
                 </Card>
               </div>
             )}
             
             {/* Student Data Table */}
             {completeStudentData.length > 0 && (
               <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Users className="w-5 h-5" />
                     Student Data with Complete Profiles
                   </CardTitle>
                   <p className="text-sm text-slate-600">
                     Showing {completeStudentData.length} students with comprehensive profile information
                   </p>
                 </CardHeader>
                 <CardContent>
                   <div className="overflow-x-auto">
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Name</TableHead>
                           <TableHead>Email</TableHead>
                           <TableHead>Country</TableHead>
                           <TableHead>Year of Study</TableHead>
                           <TableHead>Field of Study</TableHead>
                           <TableHead>Studio</TableHead>
                           <TableHead>Payment Plan</TableHead>
                           <TableHead>Profile Status</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {completeStudentData.slice(0, 10).map((student) => (
                           <TableRow key={student.id}>
                             <TableCell className="font-medium">{student.name}</TableCell>
                             <TableCell>{student.email}</TableCell>
                             <TableCell>{student.country || 'Not specified'}</TableCell>
                             <TableCell>{student.year_of_study || 'Not specified'}</TableCell>
                             <TableCell>{student.field_of_study || 'Not specified'}</TableCell>
                             <TableCell>{student.studio_name || 'Not assigned'}</TableCell>
                             <TableCell>{student.payment_plan_name || 'Not specified'}</TableCell>
                             <TableCell>
                               <Badge variant={student.is_complete ? 'default' : 'secondary'}>
                                 {student.is_complete ? 'Complete' : 'Incomplete'}
                               </Badge>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                     {completeStudentData.length > 10 && (
                       <div className="mt-4 text-center">
                         <p className="text-sm text-slate-600">
                           Showing first 10 of {completeStudentData.length} students. 
                           Use the export button to download all data.
                         </p>
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
             )}
             
             {/* No Data State */}
             {completeStudentData.length === 0 && !studentLoading && (
               <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                 <CardContent className="p-8">
                   <div className="text-center">
                     <Users className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                     <h3 className="text-lg font-semibold text-slate-900 mb-2">No Student Data</h3>
                     <p className="text-slate-600 mb-4">No students with complete profile information found</p>
                     <Button onClick={fetchStudentData} variant="outline">
                       <RefreshCw className="w-4 h-4 mr-2" />
                       Refresh Data
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             )}
           </TabsContent>

        {/* Tourists Tab */}
        <TabsContent value="tourists" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Tourists Reports</h2>
              <p className="text-slate-600 mt-1">Analyze tourist bookings and short-term stay metrics</p>
            </div>
            <Button onClick={fetchData} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
          
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
            <CardContent className="p-8">
              <div className="text-center">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Tourists Reports</h3>
                <p className="text-slate-600 mb-4">Comprehensive tourist analytics and reporting features</p>
                <p className="text-sm text-slate-500">Coming soon - We're building this section for you!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Finance Reports</h2>
              <p className="text-slate-600 mt-1">Analyze revenue, payments, and financial performance</p>
            </div>
            <Button onClick={fetchData} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
          
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
            <CardContent className="p-8">
              <div className="text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Finance Reports</h3>
                <p className="text-slate-600 mb-4">Comprehensive financial analytics and reporting features</p>
                <p className="text-sm text-slate-500">Coming soon - We're building this section for you!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Reports;
