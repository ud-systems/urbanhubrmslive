import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Users, DollarSign, Target, Calendar, Filter, TrendingDown } from "lucide-react";
import { useState, useMemo } from "react";
import LeadStatusChart from "./LeadStatusChart";
import SourcePerformanceChart from "./SourcePerformanceChart";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Lead {
  id: number;
  name: string;
  status: string;
  source: string;
  revenue: number;
  dateofinquiry: string;
  assignedto: string;
}

interface Student {
  id: number;
  name: string;
  revenue: number;
  duration: string;
  assignedto: string;
  dateofinquiry: string;
}

interface AnalyticsProps {
  leads: Lead[];
  students: Student[];
}

const Analytics = ({ leads, students }: AnalyticsProps) => {
  const [timeFilter, setTimeFilter] = useState("all");

  // Filter data based on time selection
  const filteredData = useMemo(() => {
    const now = new Date();
    const filterDate = new Date();

    switch (timeFilter) {
      case "7days":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        filterDate.setDate(now.getDate() - 30);
        break;
      case "3months":
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        filterDate.setFullYear(now.getFullYear(), 0, 1);
        break;
      default:
        filterDate.setFullYear(1900, 0, 1); // All time
    }

    const filteredLeads = leads.filter(lead => {
      if (!lead.dateofinquiry) return false;
      const leadDate = new Date(lead.dateofinquiry);
      return leadDate >= filterDate;
    });

    const filteredStudents = students.filter(student => {
      if (!student.dateofinquiry) return false;
      const studentDate = new Date(student.dateofinquiry);
      return studentDate >= filterDate;
    });

    return { leads: filteredLeads, students: filteredStudents };
  }, [leads, students, timeFilter]);

  // Calculate key metrics based on filtered data
  const metrics = useMemo(() => {
    const { leads: filteredLeads, students: filteredStudents } = filteredData;
    
    const totalLeads = filteredLeads.length;
    const hotLeads = filteredLeads.filter(l => l.status === "Hot").length;
    const convertedLeads = filteredLeads.filter(l => l.status === "Converted").length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";
    const totalRevenue = [...filteredLeads, ...filteredStudents].reduce((sum, item) => sum + (item.revenue || 0), 0);
    const avgRevenuePerLead = totalLeads > 0 ? Math.round(totalRevenue / totalLeads) : 0;

    // Calculate growth compared to previous period
    const getPreviousPeriodData = () => {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      switch (timeFilter) {
        case "7days":
          startDate.setDate(now.getDate() - 14);
          endDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(now.getDate() - 60);
          endDate.setDate(now.getDate() - 30);
          break;
        case "3months":
          startDate.setMonth(now.getMonth() - 6);
          endDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1, 0, 1);
          endDate.setFullYear(now.getFullYear() - 1, 11, 31);
          break;
        default:
          return { leads: 0, revenue: 0 };
      }

      const previousLeads = leads.filter(lead => {
        if (!lead.dateofinquiry) return false;
        const leadDate = new Date(lead.dateofinquiry);
        return leadDate >= startDate && leadDate <= endDate;
      });

      const previousStudents = students.filter(student => {
        if (!student.dateofinquiry) return false;
        const studentDate = new Date(student.dateofinquiry);
        return studentDate >= startDate && studentDate <= endDate;
      });

      const previousRevenue = [...previousLeads, ...previousStudents].reduce((sum, item) => sum + (item.revenue || 0), 0);
      
      return { leads: previousLeads.length, revenue: previousRevenue };
    };

    const previousData = getPreviousPeriodData();
    const leadGrowth = previousData.leads > 0 ? ((totalLeads - previousData.leads) / previousData.leads * 100).toFixed(1) : "0";
    const revenueGrowth = previousData.revenue > 0 ? ((totalRevenue - previousData.revenue) / previousData.revenue * 100).toFixed(1) : "0";

    return {
      totalLeads,
      hotLeads,
      convertedLeads,
      conversionRate,
      totalRevenue,
      avgRevenuePerLead,
      leadGrowth: parseFloat(leadGrowth),
      revenueGrowth: parseFloat(revenueGrowth)
    };
  }, [filteredData, leads, students, timeFilter]);

  // Source performance data
  const sourceData = useMemo(() => {
    return filteredData.leads.reduce((acc, lead) => {
      const existing = acc.find(item => item.source === lead.source);
      if (existing) {
        existing.count += 1;
        existing.revenue += (lead.revenue || 0);
      } else {
        acc.push({ source: lead.source, count: 1, revenue: (lead.revenue || 0) });
      }
      return acc;
    }, [] as Array<{ source: string; count: number; revenue: number }>);
  }, [filteredData.leads]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    return filteredData.leads.reduce((acc, lead) => {
      const existing = acc.find(item => item.status === lead.status);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ status: lead.status, count: 1 });
      }
      return acc;
    }, [] as Array<{ status: string; count: number }>);
  }, [filteredData.leads]);

  // Generate real monthly trend data
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Get data for the last 12 months
    const monthlyStats = months.map((month, index) => {
      const monthIndex = (currentMonth - 11 + index + 12) % 12;
      const year = currentMonth - 11 + index < 0 ? currentYear - 1 : currentYear;
      
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0);
      
      const monthLeads = filteredData.leads.filter(lead => {
        if (!lead.dateofinquiry) return false;
        const leadDate = new Date(lead.dateofinquiry);
        return leadDate >= monthStart && leadDate <= monthEnd;
      });
      
      const monthStudents = filteredData.students.filter(student => {
        if (!student.dateofinquiry) return false;
        const studentDate = new Date(student.dateofinquiry);
        return studentDate >= monthStart && studentDate <= monthEnd;
      });
      
      const conversions = monthLeads.filter(lead => lead.status === "Converted").length;
      const revenue = [...monthLeads, ...monthStudents].reduce((sum, item) => sum + (item.revenue || 0), 0);
      
      return {
        month,
        leads: monthLeads.length,
        conversions,
        revenue
      };
    });
    
    return monthlyStats;
  }, [filteredData, timeFilter]);



  // Show skeleton if no data is available yet
  if (!leads || !students) {
    return <LoadingSpinner fullScreen text="Loading analytics..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Analytics & Reports</h2>
          <p className="text-slate-600 mt-1">Insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalLeads}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge 
                variant="secondary" 
                className={`${
                  metrics.leadGrowth >= 0 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}
              >
                {metrics.leadGrowth >= 0 ? "+" : ""}{metrics.leadGrowth}%
              </Badge>
              <p className="text-xs text-slate-500">vs previous period</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Hot Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{metrics.hotLeads}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                High Priority
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{metrics.conversionRate}%</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {metrics.convertedLeads} converted
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">£{metrics.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge 
                variant="secondary" 
                className={`${
                  metrics.revenueGrowth >= 0 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}
              >
                {metrics.revenueGrowth >= 0 ? "+" : ""}{metrics.revenueGrowth}%
              </Badge>
              <p className="text-xs text-slate-500">vs previous period</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Performance */}
      <SourcePerformanceChart 
        sourceData={sourceData} 
        totalLeads={metrics.totalLeads} 
      />

      {/* Lead Status Distribution */}
      <LeadStatusChart 
        statusData={statusData} 
        totalLeads={metrics.totalLeads} 
      />

      {/* Monthly Trend */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Monthly Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'leads' ? `${value} leads` : 
                  name === 'conversions' ? `${value} conversions` : 
                  `£${value}`,
                  name === 'leads' ? 'Total Leads' : 
                  name === 'conversions' ? 'Conversions' : 'Revenue'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="leads" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="leads"
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                stroke="#10B981" 
                strokeWidth={3}
                name="conversions"
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#F59E0B" 
                strokeWidth={3}
                name="revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {sourceData.length > 0 ? sourceData.sort((a, b) => b.count - a.count)[0]?.source : "N/A"}
              </div>
              <p className="text-slate-600">
                {sourceData.length > 0 ? sourceData.sort((a, b) => b.count - a.count)[0]?.count : 0} leads generated
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Average Revenue per Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                £{metrics.avgRevenuePerLead.toLocaleString()}
              </div>
              <p className="text-slate-600">Per lead value</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{filteredData.students.length}</div>
              <p className="text-slate-600">Currently enrolled</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
