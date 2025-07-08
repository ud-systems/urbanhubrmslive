import { Lead, Student, Studio } from '@/types';

export interface AnalyticsMetrics {
  // Lead metrics
  totalLeads: number;
  newLeads: number;
  hotLeads: number;
  coldLeads: number;
  convertedLeads: number;
  deadLeads: number;
  conversionRate: number;
  averageLeadValue: number;
  
  // Student metrics
  totalStudents: number;
  activeStudents: number;
  averageStayDuration: number;
  averageRevenue: number;
  occupancyRate: number;
  
  // Studio metrics
  totalStudios: number;
  occupiedStudios: number;
  vacantStudios: number;
  occupancyRate: number;
  
  // Time-based metrics
  leadsThisWeek: number;
  leadsThisMonth: number;
  leadsThisYear: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  
  // Growth metrics
  leadGrowthRate: number;
  revenueGrowthRate: number;
  conversionGrowthRate: number;
}

export interface TrendData {
  period: string;
  leads: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export interface SourcePerformance {
  source: string;
  totalLeads: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
  averageRevenue: number;
  costPerLead?: number;
  roi?: number;
}

export interface PredictiveMetrics {
  projectedLeads: number;
  projectedRevenue: number;
  projectedConversions: number;
  confidence: number;
  factors: string[];
}

export class AnalyticsEngine {
  static calculateMetrics(
    leads: Lead[],
    students: Student[],
    studios: Studio[],
    dateRange?: { from: Date; to: Date }
  ): AnalyticsMetrics {
    // Filter data by date range if provided
    const filterByDate = (items: any[], dateField: string) => {
      if (!dateRange) return items;
      return items.filter(item => {
        const itemDate = new Date(item[dateField] || item.created_at);
        return itemDate >= dateRange.from && itemDate <= dateRange.to;
      });
    };

    const filteredLeads = filterByDate(leads, 'dateofinquiry');
    const filteredStudents = filterByDate(students, 'checkin');

    // Calculate lead metrics
    const totalLeads = filteredLeads.length;
    const newLeads = filteredLeads.filter(l => l.status === 'New').length;
    const hotLeads = filteredLeads.filter(l => l.status === 'Hot').length;
    const coldLeads = filteredLeads.filter(l => l.status === 'Cold').length;
    const convertedLeads = filteredLeads.filter(l => l.status === 'Converted').length;
    const deadLeads = filteredLeads.filter(l => l.status === 'Dead').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    
    const totalLeadRevenue = filteredLeads.reduce((sum, lead) => sum + (parseFloat(lead.revenue) || 0), 0);
    const averageLeadValue = totalLeads > 0 ? totalLeadRevenue / totalLeads : 0;

    // Calculate student metrics
    const totalStudents = filteredStudents.length;
    const activeStudents = filteredStudents.filter(s => {
      const checkout = s.checkout ? new Date(s.checkout) : null;
      return !checkout || checkout > new Date();
    }).length;
    
    const totalStudentRevenue = filteredStudents.reduce((sum, student) => sum + (parseFloat(student.revenue) || 0), 0);
    const averageRevenue = totalStudents > 0 ? totalStudentRevenue / totalStudents : 0;

    // Calculate studio metrics
    const totalStudios = studios.length;
    const occupiedStudios = studios.filter(s => s.occupied).length;
    const vacantStudios = totalStudios - occupiedStudios;
    const studioOccupancyRate = totalStudios > 0 ? (occupiedStudios / totalStudios) * 100 : 0;

    // Calculate time-based metrics
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const leadsThisWeek = leads.filter(l => {
      const leadDate = new Date(l.dateofinquiry || l.created_at);
      return leadDate >= weekAgo;
    }).length;

    const leadsThisMonth = leads.filter(l => {
      const leadDate = new Date(l.dateofinquiry || l.created_at);
      return leadDate >= monthAgo;
    }).length;

    const leadsThisYear = leads.filter(l => {
      const leadDate = new Date(l.dateofinquiry || l.created_at);
      return leadDate >= yearAgo;
    }).length;

    const revenueThisWeek = students.filter(s => {
      const studentDate = new Date(s.checkin || s.created_at);
      return studentDate >= weekAgo;
    }).reduce((sum, s) => sum + (parseFloat(s.revenue) || 0), 0);

    const revenueThisMonth = students.filter(s => {
      const studentDate = new Date(s.checkin || s.created_at);
      return studentDate >= monthAgo;
    }).reduce((sum, s) => sum + (parseFloat(s.revenue) || 0), 0);

    const revenueThisYear = students.filter(s => {
      const studentDate = new Date(s.checkin || s.created_at);
      return studentDate >= yearAgo;
    }).reduce((sum, s) => sum + (parseFloat(s.revenue) || 0), 0);

    // Calculate growth rates (comparing to previous period)
    const previousWeekLeads = leads.filter(l => {
      const leadDate = new Date(l.dateofinquiry || l.created_at);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return leadDate >= twoWeeksAgo && leadDate < weekAgo;
    }).length;

    const previousWeekRevenue = students.filter(s => {
      const studentDate = new Date(s.checkin || s.created_at);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return studentDate >= twoWeeksAgo && studentDate < weekAgo;
    }).reduce((sum, s) => sum + (parseFloat(s.revenue) || 0), 0);

    const leadGrowthRate = previousWeekLeads > 0 ? ((leadsThisWeek - previousWeekLeads) / previousWeekLeads) * 100 : 0;
    const revenueGrowthRate = previousWeekRevenue > 0 ? ((revenueThisWeek - previousWeekRevenue) / previousWeekRevenue) * 100 : 0;

    return {
      totalLeads,
      newLeads,
      hotLeads,
      coldLeads,
      convertedLeads,
      deadLeads,
      conversionRate,
      averageLeadValue,
      totalStudents,
      activeStudents,
      averageStayDuration: 0, // TODO: Calculate based on checkin/checkout dates
      averageRevenue,
      occupancyRate: studioOccupancyRate,
      totalStudios,
      occupiedStudios,
      vacantStudios,
      leadsThisWeek,
      leadsThisMonth,
      leadsThisYear,
      revenueThisWeek,
      revenueThisMonth,
      revenueThisYear,
      leadGrowthRate,
      revenueGrowthRate,
      conversionGrowthRate: 0 // TODO: Calculate conversion rate growth
    };
  }

  static calculateTrends(
    leads: Lead[],
    students: Student[],
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    months: number = 12
  ): TrendData[] {
    const trends: TrendData[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const periodLeads = leads.filter(lead => {
        const leadDate = new Date(lead.dateofinquiry || lead.created_at);
        return leadDate >= periodStart && leadDate <= periodEnd;
      });

      const periodStudents = students.filter(student => {
        const studentDate = new Date(student.checkin || student.created_at);
        return studentDate >= periodStart && studentDate <= periodEnd;
      });

      const periodConversions = periodLeads.filter(l => l.status === 'Converted').length;
      const periodRevenue = periodStudents.reduce((sum, s) => sum + (parseFloat(s.revenue) || 0), 0);
      const periodConversionRate = periodLeads.length > 0 ? (periodConversions / periodLeads.length) * 100 : 0;

      trends.push({
        period: periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        leads: periodLeads.length,
        conversions: periodConversions,
        revenue: periodRevenue,
        conversionRate: periodConversionRate
      });
    }

    return trends;
  }

  static calculateSourcePerformance(leads: Lead[]): SourcePerformance[] {
    const sourceMap = new Map<string, SourcePerformance>();

    leads.forEach(lead => {
      const source = lead.source || 'Unknown';
      const revenue = parseFloat(lead.revenue) || 0;
      const isConverted = lead.status === 'Converted';

      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          source,
          totalLeads: 0,
          conversions: 0,
          conversionRate: 0,
          totalRevenue: 0,
          averageRevenue: 0
        });
      }

      const performance = sourceMap.get(source)!;
      performance.totalLeads++;
      if (isConverted) performance.conversions++;
      performance.totalRevenue += revenue;
    });

    // Calculate derived metrics
    sourceMap.forEach(performance => {
      performance.conversionRate = performance.totalLeads > 0 ? 
        (performance.conversions / performance.totalLeads) * 100 : 0;
      performance.averageRevenue = performance.totalLeads > 0 ? 
        performance.totalRevenue / performance.totalLeads : 0;
    });

    return Array.from(sourceMap.values()).sort((a, b) => b.totalLeads - a.totalLeads);
  }

  static predictMetrics(
    leads: Lead[],
    students: Student[],
    months: number = 3
  ): PredictiveMetrics {
    // Simple linear regression for prediction
    const trends = this.calculateTrends(leads, students, 'monthly', 6);
    
    if (trends.length < 3) {
      return {
        projectedLeads: 0,
        projectedRevenue: 0,
        projectedConversions: 0,
        confidence: 0,
        factors: ['Insufficient data for prediction']
      };
    }

    // Calculate trend lines
    const leadTrend = this.calculateLinearTrend(trends.map(t => t.leads));
    const revenueTrend = this.calculateLinearTrend(trends.map(t => t.revenue));
    const conversionTrend = this.calculateLinearTrend(trends.map(t => t.conversionRate));

    // Project future values
    const projectedLeads = Math.max(0, Math.round(leadTrend.slope * months + leadTrend.intercept));
    const projectedRevenue = Math.max(0, revenueTrend.slope * months + revenueTrend.intercept);
    const projectedConversions = Math.max(0, Math.round(conversionTrend.slope * months + conversionTrend.intercept));

    // Calculate confidence based on R-squared
    const confidence = Math.min(95, Math.max(0, 
      (leadTrend.rSquared + revenueTrend.rSquared + conversionTrend.rSquared) / 3 * 100
    ));

    const factors = [];
    if (leadTrend.slope > 0) factors.push('Growing lead volume');
    if (revenueTrend.slope > 0) factors.push('Increasing revenue trend');
    if (conversionTrend.slope > 0) factors.push('Improving conversion rates');
    if (factors.length === 0) factors.push('Stable performance');

    return {
      projectedLeads,
      projectedRevenue,
      projectedConversions,
      confidence,
      factors
    };
  }

  private static calculateLinearTrend(values: number[]): {
    slope: number;
    intercept: number;
    rSquared: number;
  } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = values.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, yi, i) => {
      const yPred = slope * x[i] + intercept;
      return sum + Math.pow(yi - yPred, 2);
    }, 0);
    const ssTot = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

    return { slope, intercept, rSquared };
  }

  static generateInsights(metrics: AnalyticsMetrics, trends: TrendData[]): string[] {
    const insights: string[] = [];

    // Conversion insights
    if (metrics.conversionRate < 10) {
      insights.push('Low conversion rate detected. Consider reviewing lead qualification process.');
    } else if (metrics.conversionRate > 30) {
      insights.push('Excellent conversion rate! Your lead qualification is working well.');
    }

    // Growth insights
    if (metrics.leadGrowthRate > 20) {
      insights.push('Strong lead growth detected. Consider scaling successful marketing channels.');
    } else if (metrics.leadGrowthRate < -10) {
      insights.push('Declining lead volume. Review marketing strategies and lead sources.');
    }

    // Revenue insights
    if (metrics.revenueGrowthRate > 15) {
      insights.push('Revenue growing strongly. Consider expanding successful offerings.');
    } else if (metrics.revenueGrowthRate < -5) {
      insights.push('Revenue declining. Review pricing strategy and value proposition.');
    }

    // Occupancy insights
    if (metrics.occupancyRate > 90) {
      insights.push('High occupancy rate. Consider expanding studio inventory.');
    } else if (metrics.occupancyRate < 60) {
      insights.push('Low occupancy rate. Review pricing and marketing strategies.');
    }

    // Trend insights
    if (trends.length >= 3) {
      const recentTrends = trends.slice(-3);
      const avgConversionRate = recentTrends.reduce((sum, t) => sum + t.conversionRate, 0) / 3;
      
      if (avgConversionRate > metrics.conversionRate) {
        insights.push('Recent conversion rates are improving. Current strategies are effective.');
      } else if (avgConversionRate < metrics.conversionRate) {
        insights.push('Recent conversion rates declining. Review recent changes.');
      }
    }

    return insights;
  }
} 