// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'salesperson' | 'manager';
  avatar?: string;
  email_verified?: boolean;
  approved?: boolean;
  approved_at?: string;
  approved_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Lead types
export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  responsecategory?: string;
  followupstage?: string;
  roomgrade?: string;
  duration?: string;
  assignedto?: string;
  revenue?: number;
  notes?: string;
  dateofinquiry?: string;
  created_at?: string;
  updated_at?: string;
}

// Student types
export interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  roomgrade?: string;
  duration?: string;
  assignedto?: string;
  checkin?: string;
  checkout?: string;
  revenue?: number;
  notes?: string;
  dateofinquiry?: string;
  created_at?: string;
  updated_at?: string;
}

// Studio types
export interface Studio {
  id: string;
  name: string;
  view: string;
  floor: number;
  occupied: boolean;
  occupiedby: number | null;
  roomgrade?: string;
  created_at?: string;
  updated_at?: string;
}

// Configuration types
export interface LeadStatus {
  id: number;
  name: string;
  color?: string;
  created_at?: string;
}

export interface ResponseCategory {
  id: number;
  name: string;
  created_at?: string;
}

export interface FollowUpStage {
  id: number;
  name: string;
  created_at?: string;
}

export interface RoomGrade {
  id: number;
  name: string;
  price?: number;
  created_at?: string;
}

export interface StayDuration {
  id: number;
  name: string;
  created_at?: string;
}

export interface LeadSource {
  id: number;
  name: string;
  created_at?: string;
}

// Analytics types
export interface AnalyticsData {
  totalLeads: number;
  hotLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue: number;
  avgRevenuePerLead: number;
  leadGrowth: number;
  revenueGrowth: number;
}

export interface SourcePerformance {
  source: string;
  count: number;
  revenue: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  leads: number;
  conversions: number;
  revenue: number;
}

// Report types
export interface ReportData {
  leads: Lead[];
  students: Student[];
  studios: Studio[];
  users: User[];
}

export interface FilterOptions {
  leadStatus: LeadStatus[];
  leadSources: LeadSource[];
  responseCategories: ResponseCategory[];
  followUpStages: FollowUpStage[];
  roomGrades: RoomGrade[];
  stayDurations: StayDuration[];
}

// Form types
export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  responsecategory?: string;
  followupstage?: string;
  roomgrade?: string;
  duration?: string;
  assignedto?: string;
  revenue?: number;
  notes?: string;
  dateofinquiry?: string;
}

export interface StudentFormData {
  name: string;
  email: string;
  phone: string;
  roomgrade?: string;
  duration?: string;
  assignedto?: string;
  checkin?: string;
  checkout?: string;
  revenue?: number;
  notes?: string;
  dateofinquiry?: string;
}

export interface StudioFormData {
  name: string;
  view: string;
  floor: number;
  roomgrade?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Notification types
export interface Notification {
  id: number;
  type: string;
  message: string;
  user: string;
  timestamp: string;
  icon: any;
  color: string;
}

// Bulk operation types
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    reason: string;
    data?: any;
  }>;
}

// Date range type
export interface DateRange {
  from: Date;
  to: Date;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

// Studio statistics
export interface StudioStats {
  total: number;
  occupied: number;
  vacant: number;
  occupancyRate: number;
}

// User management types
export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface BulkUserData {
  name: string;
  email: string;
  password: string;
  role: string;
}

// CSV upload types
export interface CsvUploadData {
  type: 'leads' | 'students' | 'studios' | 'users';
  data: any[];
  preview: any[];
}

// Search and filter types
export interface SearchFilters {
  status?: string;
  source?: string;
  responseCategory?: string;
  followUpStage?: string;
  assignedTo?: string;
  assignedStudio?: string;
  roomGrade?: string;
  duration?: string;
  dateRange?: DateRange;
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: SearchFilters;
  includeHeaders?: boolean;
}

// Settings types
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
} 