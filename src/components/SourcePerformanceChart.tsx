import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Globe,
  Phone,
  Mail,
  MessageSquare,
  Share2
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SourceData {
  source: string;
  count: number;
  revenue: number;
  avgRevenue: number;
  conversionRate: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

interface SourcePerformanceChartProps {
  sourceData: Array<{ source: string; count: number; revenue: number }>;
  totalLeads: number;
}

const SourcePerformanceChart = ({ sourceData, totalLeads }: SourcePerformanceChartProps) => {
  const [metric, setMetric] = useState<'count' | 'revenue' | 'avgRevenue'>('count');

  // Define source icons and colors
  const sourceConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
    'Website': { 
      icon: <Globe className="w-4 h-4" />,
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    'Phone': { 
      icon: <Phone className="w-4 h-4" />,
      color: '#10B981',
      bgColor: '#ECFDF5'
    },
    'Email': { 
      icon: <Mail className="w-4 h-4" />,
      color: '#F59E0B',
      bgColor: '#FFFBEB'
    },
    'Social Media': { 
      icon: <Share2 className="w-4 h-4" />,
      color: '#8B5CF6',
      bgColor: '#F5F3FF'
    },
    'Referral': { 
      icon: <Users className="w-4 h-4" />,
      color: '#EF4444',
      bgColor: '#FEF2F2'
    },
    'Direct': { 
      icon: <Target className="w-4 h-4" />,
      color: '#6B7280',
      bgColor: '#F9FAFB'
    }
  };

  // Process data with additional metrics
  const processedData: SourceData[] = sourceData.map(item => {
    const avgRevenue = item.count > 0 ? item.revenue / item.count : 0;
    const conversionRate = totalLeads > 0 ? (item.count / totalLeads) * 100 : 0;
    const config = sourceConfig[item.source] || { 
      icon: <Globe className="w-4 h-4" />,
      color: '#6B7280',
      bgColor: '#F9FAFB'
    };
    
    return {
      source: item.source,
      count: item.count,
      revenue: item.revenue,
      avgRevenue: Math.round(avgRevenue),
      conversionRate: Math.round(conversionRate * 10) / 10,
      ...config
    };
  }).sort((a, b) => {
    switch (metric) {
      case 'count': return b.count - a.count;
      case 'revenue': return b.revenue - a.revenue;
      case 'avgRevenue': return b.avgRevenue - a.avgRevenue;
      default: return b.count - a.count;
    }
  });

  // Chart.js data
  const chartData = {
    labels: processedData.map(item => item.source),
    datasets: [
      {
        label: metric === 'count' ? 'Lead Count' : 
               metric === 'revenue' ? 'Revenue (£)' : 'Avg Revenue (£)',
        data: processedData.map(item => 
          metric === 'count' ? item.count : 
          metric === 'revenue' ? item.revenue : item.avgRevenue
        ),
        backgroundColor: processedData.map(item => item.color),
        borderColor: processedData.map(item => item.color),
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
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
            const source = context.label;
            const sourceData = processedData.find(item => item.source === source);
            
            if (metric === 'count') {
              return `${source}: ${value} leads (${sourceData?.conversionRate}% of total)`;
            } else if (metric === 'revenue') {
              return `${source}: £${value.toLocaleString()} total revenue`;
            } else {
              return `${source}: £${value} average per lead`;
            }
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
          callback: function(value: any) {
            if (metric === 'revenue' || metric === 'avgRevenue') {
              return `£${value.toLocaleString()}`;
            }
            return value;
          }
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

  const topPerformer = processedData[0];
  const totalRevenue = processedData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-50 border-green-200 text-green-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Source Performance</CardTitle>
              <p className="text-sm text-slate-500">
                Lead generation by source • £{totalRevenue.toLocaleString()} total revenue
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={metric === 'count' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('count')}
              className="flex items-center space-x-1"
            >
              <Users className="w-4 h-4" />
              <span>Leads</span>
            </Button>
            <Button
              variant={metric === 'revenue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('revenue')}
              className="flex items-center space-x-1"
            >
              <DollarSign className="w-4 h-4" />
              <span>Revenue</span>
            </Button>
            <Button
              variant={metric === 'avgRevenue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('avgRevenue')}
              className="flex items-center space-x-1"
            >
              <Target className="w-4 h-4" />
              <span>Avg</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Source Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedData.map((item) => (
            <div
              key={item.source}
              className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: item.bgColor, color: item.color }}
                >
                  {item.icon}
                </div>
                <div>
                  <div className="font-medium text-slate-900">{item.source}</div>
                  <div className="text-sm text-slate-500">{item.count} leads</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Revenue:</span>
                  <span className="font-medium text-slate-900">£{item.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Avg per lead:</span>
                  <span className="font-medium text-slate-900">£{item.avgRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Share:</span>
                  <span className="font-medium text-slate-900">{item.conversionRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Performer Highlight */}
        {topPerformer && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: topPerformer.bgColor, color: topPerformer.color }}
                >
                  {topPerformer.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Top Performing Source</h3>
                  <p className="text-sm text-slate-600">
                    {topPerformer.source} • {topPerformer.count} leads • £{topPerformer.revenue.toLocaleString()} revenue
                  </p>
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className="text-sm bg-green-100 text-green-800"
              >
                Best {metric === 'count' ? 'Volume' : metric === 'revenue' ? 'Revenue' : 'Value'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SourcePerformanceChart; 