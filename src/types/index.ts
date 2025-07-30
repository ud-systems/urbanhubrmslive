// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'salesperson' | 'accountant' | 'cleaner' | 'student';
  avatar?: string;
  email_verified?: boolean;
  approved?: boolean;
  approved_at?: string;
  approved_by?: string;
  created_at?: string;
  updated_at?: string;
  user_metadata?: {
    name?: string;
    role?: string;
    avatar_url?: string;
  };
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

// Student types - Updated to match actual database structure
export interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  room?: string; // Database uses 'room' not 'roomgrade'
  duration?: string;
  assignedto?: string;
  checkin?: string;
  checkout_date?: string; // Calculated checkout date
  next_deep_clean_date?: string; // Scheduled deep clean date
  revenue?: number;
  user_id?: string;
  // New comprehensive fields
  academic_year_id?: number;
  deposit_paid?: boolean;
  duration_weeks?: number; // 45 or 51
  payment_cycles?: number; // 3, 4, or 10
  payment_plan_id?: number;
  is_rebooker?: boolean;
  previous_academic_years?: string[];
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
  roomGrade?: string; // Database uses 'roomGrade' not 'roomgrade'
  // Removed fields that don't exist in database: created_at, updated_at
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
  room?: string; // Database uses 'room' not 'roomgrade'
  duration?: string;
  assignedto?: string;
  checkin?: string;
  revenue?: number;
  // Removed fields that don't exist in database: checkout, notes, dateofinquiry
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

// Cleaning System Types
export interface CleaningSchedule {
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
  estimated_duration?: number; // minutes
  notes?: string;
  special_requirements?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  
  // Related data
  studio?: Studio;
  cleaner?: User;
  reservation_student?: Student;
  reservation_tourist?: Tourist;
  tasks?: CleaningTask[];
}

export interface CleaningTask {
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

export interface CleaningSupplyUsage {
  id: number;
  schedule_id: number;
  supply_name: string;
  quantity_used: number;
  unit: string;
  cost?: number;
  recorded_at: string;
  recorded_by?: string;
}

export interface CleaningStats {
  totalSchedules: number;
  completedToday: number;
  pendingToday: number;
  overdueSchedules: number;
  inProgressCount: number;
  upcomingCleanings: number;
  cleanStudios: number;
  dirtyStudios: number;
  needsCleaningStudios: number;
}

export interface CleaningFormData {
  studio_id: string;
  scheduled_date: string;
  scheduled_time?: string;
  cleaning_type: 'checkout' | 'deep_clean' | 'maintenance' | 'emergency';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_cleaner_id?: string;
  estimated_duration?: number;
  notes?: string;
  special_requirements?: string;
}

export interface CleaningTaskFormData {
  task_name: string;
  description?: string;
  estimated_minutes?: number;
}

// Enhanced User interface for cleaning assignments
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'salesperson' | 'accountant' | 'cleaner' | 'student';
  avatar?: string;
  approved?: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Cleaner-specific fields
  cleaning_assignments?: CleaningSchedule[];
  daily_workload?: number;
}

// Tourist interface with checkout date
export interface Tourist {
  id: number;
  name: string;
  email: string;
  phone: string;
  checkin: string;
  checkout: string;
  duration?: string;
  revenue?: number;
  assignedto?: string;
  room?: string;
  created_at?: string;
  updated_at?: string;
}

// Academic Year types
export interface AcademicYear {
  id: number;
  year_code: string; // e.g., '25/26', '26/27'
  start_date: string;
  end_date: string;
  weeks_45_start: string;
  weeks_45_end: string;
  weeks_51_start: string;
  weeks_51_end: string;
  is_active: boolean;
  is_current: boolean;
  created_at?: string;
  updated_at?: string;
}

// Payment Plan types (updated structure)
export interface PaymentPlan {
  id: number;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  duration_weeks: number; // 45 or 51
  payment_cycles: number; // 3, 4, or 10
  academic_year_id?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Related data
  academic_year?: AcademicYear;
}

// Student Payment Progress types
export interface StudentPaymentProgress {
  id: number;
  student_id: number;
  payment_plan_id: number;
  total_installments: number;
  paid_installments: number;
  total_amount: number;
  paid_amount: number;
  deposit_amount: number;
  deposit_paid: boolean;
  deposit_paid_date?: string;
  next_payment_due?: string;
  created_at?: string;
  updated_at?: string;
  // Related data
  student?: Student;
  payment_plan?: PaymentPlan;
}

// Audit Trail types
export interface AuditTrailEntry {
  id: number;
  entity_type: string; // 'student', 'application', 'payment', 'document', etc.
  entity_id: number;
  action: string; // 'created', 'updated', 'deleted', 'uploaded', 'assigned', etc.
  field_name?: string;
  old_value?: string;
  new_value?: string;
  user_id?: string;
  user_role?: string;
  user_name?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Student Application types (updated with deposit_paid)
export interface StudentApplication {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  age: number;
  ethnicity: string;
  gender: string;
  ucas_id: string;
  country: string;
  email: string;
  mobile: string;
  address_line_1: string;
  address_line_2: string;
  post_code: string;
  town: string;
  year_of_study: string;
  field_of_study: string;
  is_disabled: boolean;
  is_smoker: boolean;
  medical_requirements: string;
  entry_into_uk: string;
  wants_installments: boolean;
  selected_installment_plan: string;
  payment_installments: string;
  data_consent: boolean;
  deposit_paid: boolean;
  
  // Guarantor Information
  guarantor_name: string;
  guarantor_email: string;
  guarantor_phone: string;
  guarantor_date_of_birth: string;
  guarantor_relationship: string;
  
  // Document Uploads
  utility_bill_url: string;
  utility_bill_filename: string;
  utility_bill_uploaded_at?: string;
  identity_document_url: string;
  identity_document_filename: string;
  identity_document_uploaded_at?: string;
  bank_statement_url: string;
  bank_statement_filename: string;
  bank_statement_uploaded_at?: string;
  passport_url: string;
  passport_filename: string;
  passport_uploaded_at?: string;
  current_visa_url: string;
  current_visa_filename: string;
  current_visa_uploaded_at?: string;
  
  current_step: number;
  is_complete: boolean;
  created_at?: string;
  updated_at?: string;
} 