import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useState } from 'react';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye
} from 'lucide-react';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface LeadStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

interface LeadStatusChartProps {
  statusData: Array<{ status: string; count: number }>;
  totalLeads: number;
}

const LeadStatusChart = ({ statusData, totalLeads }: LeadStatusChartProps) => {
  const [chartType, setChartType] = useState<'doughnut' | 'bar'>('doughnut');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Define status colors and icons
  const statusConfig: Record<string, { color: string; icon: React.ReactNode; bgColor: string }> = {
    'Hot': { 
      color: '#EF4444', 
      icon: <AlertCircle className="w-4 h-4" />,
      bgColor: '#FEF2F2'
    },
    'Warm': { 
      color: '#F59E0B', 
      icon: <Clock className="w-4 h-4" />,
      bgColor: '#FFFBEB'
    },
    'Cold': { 
      color: '#6B7280', 
      icon: <XCircle className="w-4 h-4" />,
      bgColor: '#F9FAFB'
    },
    'Converted': { 
      color: '#10B981', 
      icon: <CheckCircle className="w-4 h-4" />,
      bgColor: '#ECFDF5'
    },
    'Lost': { 
      color: '#8B5CF6', 
      icon: <XCircle className="w-4 h-4" />,
      bgColor: '#F5F3FF'
    },
    'Follow Up': { 
      color: '#3B82F6', 
      icon: <Eye className="w-4 h-4" />,
      bgColor: '#EFF6FF'
    }
  };

  // Process data with percentages and styling
  const processedData: LeadStatusData[] = statusData.map(item => {
    const percentage = totalLeads > 0 ? (item.count / totalLeads) * 100 : 0;
    const config = statusConfig[item.status] || { 
      color: '#6B7280', 
      icon: <Users className="w-4 h-4" />,
      bgColor: '#F9FAFB'
    };
    
    return {
      status: item.status,
      count: item.count,
      percentage: Math.round(percentage * 10) / 10,
      color: config.color,
      icon: config.icon
    };
  }).sort((a, b) => b.count - a.count);

  // Chart.js data for doughnut chart
  const doughnutData = {
    labels: processedData.map(item => item.status),
    datasets: [
      {
        data: processedData.map(item => item.count),
        backgroundColor: processedData.map(item => item.color),
        borderColor: processedData.map(item => item.color),
        borderWidth: 2,
        hoverBorderWidth: 4,
        hoverOffset: 10,
      },
    ],
  };

  // Chart.js data for bar chart
  const barData = {
    labels: processedData.map(item => item.status),
    datasets: [
      {
        label: 'Lead Count',
        data: processedData.map(item => item.count),
        backgroundColor: processedData.map(item => item.color),
        borderColor: processedData.map(item => item.color),
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / totalLeads) * 100).toFixed(1);
            return `${label}: ${value} leads (${percentage}%)`;
          }
        }
      },
    },
    cutout: '60%',
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            const percentage = ((value / totalLeads) * 100).toFixed(1);
            return `${value} leads (${percentage}%)`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    animation: {
      duration: 1000,
    },
  };

  const selectedStatusData = selectedStatus 
    ? processedData.find(item => item.status === selectedStatus)
    : null;

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-50 border-blue-200 text-blue-700">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Lead Status Distribution</CardTitle>
              <p className="text-sm text-slate-500">
                {totalLeads} total leads • {processedData.length} status types
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={chartType === 'doughnut' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('doughnut')}
              className="flex items-center space-x-1"
            >
              <PieChart className="w-4 h-4" />
              <span>Doughnut</span>
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="flex items-center space-x-1"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Bar</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="relative">
          <div className="h-80">
            {chartType === 'doughnut' ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <Bar data={barData} options={barOptions} />
            )}
          </div>
          
          {/* Center text for doughnut chart */}
          {chartType === 'doughnut' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{totalLeads}</div>
                <div className="text-sm text-slate-500">Total Leads</div>
              </div>
            </div>
          )}
        </div>

        {/* Status Legend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {processedData.map((item) => {
            const config = statusConfig[item.status] || { bgColor: '#F9FAFB' };
            const isSelected = selectedStatus === item.status;
            
            return (
              <div
                key={item.status}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedStatus(isSelected ? null : item.status)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: config.bgColor, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{item.status}</div>
                      <div className="text-sm text-slate-500">{item.count} leads</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{item.percentage}%</div>
                    <div className="text-xs text-slate-500">of total</div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Status Details */}
        {selectedStatusData && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="p-3 rounded-lg"
                  style={{ 
                    backgroundColor: statusConfig[selectedStatusData.status]?.bgColor || '#F9FAFB',
                    color: selectedStatusData.color 
                  }}
                >
                  {selectedStatusData.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedStatusData.status} Leads</h3>
                  <p className="text-sm text-slate-600">
                    {selectedStatusData.count} leads • {selectedStatusData.percentage}% of total
                  </p>
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className="text-sm"
                style={{ backgroundColor: selectedStatusData.color, color: 'white' }}
              >
                {selectedStatusData.status}
              </Badge>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              {processedData.find(item => item.status === 'Hot')?.count || 0}
            </div>
            <div className="text-xs text-slate-500">Hot Leads</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              {processedData.find(item => item.status === 'Converted')?.count || 0}
            </div>
            <div className="text-xs text-slate-500">Converted</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              {processedData.find(item => item.status === 'Follow Up')?.count || 0}
            </div>
            <div className="text-xs text-slate-500">Follow Up</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              {Math.round((processedData.find(item => item.status === 'Converted')?.percentage || 0) * 10) / 10}%
            </div>
            <div className="text-xs text-slate-500">Conversion Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadStatusChart; 