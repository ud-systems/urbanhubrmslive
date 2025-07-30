// Comprehensive Student Data Export Utility
// Provides complete student profile data for reports and downloads

import { supabase } from './supabaseClient';
import { errorHandler } from './errorHandler';

export interface CompleteStudentData {
  // Basic Student Information
  id: number;
  name: string;
  email: string;
  phone: string;
  room?: string;
  assignedto?: string;
  checkin?: string;
  checkout_date?: string;
  next_deep_clean_date?: string;
  revenue?: number;
  user_id?: string;
  academic_year_id?: number;
  deposit_paid?: boolean;
  duration_weeks?: number;
  payment_cycles?: number;
  payment_plan_id?: number;
  is_rebooker?: boolean;
  previous_academic_years?: string[];
  created_at?: string;
  updated_at?: string;

  // Comprehensive Profile Information (from student_applications)
  // Personal Information
  first_name?: string;
  last_name?: string;
  birthday?: string;
  age?: number;
  ethnicity?: string;
  gender?: string;
  ucas_id?: string;
  country?: string;
  
  // Contact Information
  mobile?: string;
  address_line_1?: string;
  address_line_2?: string;
  post_code?: string;
  town?: string;
  
  // Academic Information
  year_of_study?: string;
  field_of_study?: string;
  
  // Additional Information
  is_disabled?: boolean;
  is_smoker?: boolean;
  medical_requirements?: string;
  entry_into_uk?: string;
  
  // Payment Information
  wants_installments?: boolean;
  selected_installment_plan?: string;
  payment_installments?: string;
  data_consent?: boolean;
  
  // Guarantor Information
  guarantor_name?: string;
  guarantor_email?: string;
  guarantor_phone?: string;
  guarantor_date_of_birth?: string;
  guarantor_relationship?: string;
  
  // Document Information
  utility_bill_url?: string;
  utility_bill_filename?: string;
  utility_bill_uploaded_at?: string;
  identity_document_url?: string;
  identity_document_filename?: string;
  identity_document_uploaded_at?: string;
  bank_statement_url?: string;
  bank_statement_filename?: string;
  bank_statement_uploaded_at?: string;
  passport_url?: string;
  passport_filename?: string;
  passport_uploaded_at?: string;
  current_visa_url?: string;
  current_visa_filename?: string;
  current_visa_uploaded_at?: string;
  
  // Application Status
  current_step?: number;
  is_complete?: boolean;
  
  // Studio Information (joined)
  studio_name?: string;
  studio_view?: string;
  studio_floor?: string;
  studio_room_grade?: string;
  
  // Payment Plan Information (joined)
  payment_plan_name?: string;
  payment_plan_description?: string;
  
  // Academic Year Information (joined)
  academic_year_name?: string;
  academic_year_start_date?: string;
  academic_year_end_date?: string;
}

export interface ExportOptions {
  includeIncomplete?: boolean;
  includeDocuments?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: {
    room_grade?: string;
    payment_plan?: string;
    country?: string;
    year_of_study?: string;
    deposit_paid?: boolean;
  };
  format?: 'json' | 'csv' | 'excel';
}

// Get complete student data with all profile information
export const getCompleteStudentData = async (options: ExportOptions = {}): Promise<CompleteStudentData[]> => {
  try {
    console.log('🔍 Fetching complete student data with options:', options);

    // Build the base query
    let query = supabase
      .from('students')
      .select(`
        *,
        studios:assignedto (
          name,
          view,
          floor,
          roomGrade
        ),
        payment_plans:payment_plan_id (
          name,
          description
        ),
        academic_years:academic_year_id (
          name,
          start_date,
          end_date
        )
      `);

    // Apply filters
    if (options.filters?.room_grade) {
      query = query.eq('studios.roomGrade', options.filters.room_grade);
    }
    
    if (options.filters?.payment_plan) {
      query = query.eq('payment_plans.name', options.filters.payment_plan);
    }
    
    if (options.filters?.deposit_paid !== undefined) {
      query = query.eq('deposit_paid', options.filters.deposit_paid);
    }

    // Apply date range if provided
    if (options.dateRange) {
      query = query.gte('created_at', options.dateRange.start)
                   .lte('created_at', options.dateRange.end);
    }

    // Execute the query
    const { data: students, error: studentsError } = await query;

    if (studentsError) {
      throw studentsError;
    }

    console.log(`✅ Found ${students?.length || 0} students`);

    // Get application data for all students with user_id
    const userIds = students?.filter(s => s.user_id).map(s => s.user_id) || [];
    
    let applications: any[] = [];
    if (userIds.length > 0) {
      const { data: appData, error: appError } = await supabase
        .from('student_applications')
        .select('*')
        .in('user_id', userIds);

      if (appError) {
        console.warn('⚠️ Could not fetch application data:', appError);
      } else {
        applications = appData || [];
        console.log(`✅ Found ${applications.length} application records`);
      }
    }

    // Merge student and application data
    const completeData: CompleteStudentData[] = (students || []).map(student => {
      const application = applications.find(app => app.user_id === student.user_id);
      
      return {
        // Basic student information
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        room: student.room,
        assignedto: student.assignedto,
        checkin: student.checkin,
        checkout_date: student.checkout_date,
        next_deep_clean_date: student.next_deep_clean_date,
        revenue: student.revenue,
        user_id: student.user_id,
        academic_year_id: student.academic_year_id,
        deposit_paid: student.deposit_paid,
        duration_weeks: student.duration_weeks,
        payment_cycles: student.payment_cycles,
        payment_plan_id: student.payment_plan_id,
        is_rebooker: student.is_rebooker,
        previous_academic_years: student.previous_academic_years,
        created_at: student.created_at,
        updated_at: student.updated_at,

        // Studio information
        studio_name: student.studios?.name,
        studio_view: student.studios?.view,
        studio_floor: student.studios?.floor,
        studio_room_grade: student.studios?.roomGrade,

        // Payment plan information
        payment_plan_name: student.payment_plans?.name,
        payment_plan_description: student.payment_plans?.description,

        // Academic year information
        academic_year_name: student.academic_years?.name,
        academic_year_start_date: student.academic_years?.start_date,
        academic_year_end_date: student.academic_years?.end_date,

        // Application/profile information (if available)
        ...(application && {
          first_name: application.first_name,
          last_name: application.last_name,
          birthday: application.birthday,
          age: application.age,
          ethnicity: application.ethnicity,
          gender: application.gender,
          ucas_id: application.ucas_id,
          country: application.country,
          mobile: application.mobile,
          address_line_1: application.address_line_1,
          address_line_2: application.address_line_2,
          post_code: application.post_code,
          town: application.town,
          year_of_study: application.year_of_study,
          field_of_study: application.field_of_study,
          is_disabled: application.is_disabled,
          is_smoker: application.is_smoker,
          medical_requirements: application.medical_requirements,
          entry_into_uk: application.entry_into_uk,
          wants_installments: application.wants_installments,
          selected_installment_plan: application.selected_installment_plan,
          payment_installments: application.payment_installments,
          data_consent: application.data_consent,
          guarantor_name: application.guarantor_name,
          guarantor_email: application.guarantor_email,
          guarantor_phone: application.guarantor_phone,
          guarantor_date_of_birth: application.guarantor_date_of_birth,
          guarantor_relationship: application.guarantor_relationship,
          utility_bill_url: application.utility_bill_url,
          utility_bill_filename: application.utility_bill_filename,
          utility_bill_uploaded_at: application.utility_bill_uploaded_at,
          identity_document_url: application.identity_document_url,
          identity_document_filename: application.identity_document_filename,
          identity_document_uploaded_at: application.identity_document_uploaded_at,
          bank_statement_url: application.bank_statement_url,
          bank_statement_filename: application.bank_statement_filename,
          bank_statement_uploaded_at: application.bank_statement_uploaded_at,
          passport_url: application.passport_url,
          passport_filename: application.passport_filename,
          passport_uploaded_at: application.passport_uploaded_at,
          current_visa_url: application.current_visa_url,
          current_visa_filename: application.current_visa_filename,
          current_visa_uploaded_at: application.current_visa_uploaded_at,
          current_step: application.current_step,
          is_complete: application.is_complete
        })
      };
    });

    // Apply additional filters that require application data
    let filteredData = completeData;
    
    if (options.filters?.country) {
      filteredData = filteredData.filter(student => 
        student.country?.toLowerCase().includes(options.filters!.country!.toLowerCase())
      );
    }
    
    if (options.filters?.year_of_study) {
      filteredData = filteredData.filter(student => 
        student.year_of_study === options.filters!.year_of_study
      );
    }

    // Filter out incomplete profiles if requested
    if (!options.includeIncomplete) {
      filteredData = filteredData.filter(student => 
        student.is_complete || student.first_name // At least has basic info
      );
    }

    console.log(`✅ Returning ${filteredData.length} complete student records`);
    return filteredData;

  } catch (error) {
               console.error('❌ Error fetching complete student data:', error);
           errorHandler.captureError(error, { context: 'Get complete student data' });
           return [];
  }
};

// Export student data in different formats
export const exportStudentData = async (
  data: CompleteStudentData[], 
  format: 'json' | 'csv' | 'excel' = 'csv'
): Promise<string | Blob> => {
  try {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return convertToCSV(data);
      
      case 'excel':
        return await convertToExcel(data);
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error('❌ Error exporting student data:', error);
    throw error;
  }
};

// Convert data to CSV format
const convertToCSV = (data: CompleteStudentData[]): string => {
  if (data.length === 0) return '';

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  
  // Create CSV header
  const csvHeader = headers.map(header => `"${header}"`).join(',');
  
  // Create CSV rows
  const csvRows = data.map(item => {
    return headers.map(header => {
      const value = item[header as keyof CompleteStudentData];
      // Handle null, undefined, and objects
      if (value === null || value === undefined) return '""';
      if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [csvHeader, ...csvRows].join('\n');
};

// Convert data to Excel format (simplified - returns CSV for now)
const convertToExcel = async (data: CompleteStudentData[]): Promise<Blob> => {
  const csv = convertToCSV(data);
  return new Blob([csv], { type: 'text/csv' });
};

// Get student data summary for dashboard
export const getStudentDataSummary = async (): Promise<{
  total: number;
  withCompleteProfiles: number;
  withIncompleteProfiles: number;
  byCountry: Record<string, number>;
  byYearOfStudy: Record<string, number>;
  byRoomGrade: Record<string, number>;
  byPaymentPlan: Record<string, number>;
}> => {
  try {
    const completeData = await getCompleteStudentData({ includeIncomplete: true });
    
    const summary = {
      total: completeData.length,
      withCompleteProfiles: completeData.filter(s => s.is_complete).length,
      withIncompleteProfiles: completeData.filter(s => !s.is_complete).length,
      byCountry: {} as Record<string, number>,
      byYearOfStudy: {} as Record<string, number>,
      byRoomGrade: {} as Record<string, number>,
      byPaymentPlan: {} as Record<string, number>
    };

    completeData.forEach(student => {
      // Count by country
      if (student.country) {
        summary.byCountry[student.country] = (summary.byCountry[student.country] || 0) + 1;
      }
      
      // Count by year of study
      if (student.year_of_study) {
        summary.byYearOfStudy[student.year_of_study] = (summary.byYearOfStudy[student.year_of_study] || 0) + 1;
      }
      
      // Count by room grade
      if (student.studio_room_grade) {
        summary.byRoomGrade[student.studio_room_grade] = (summary.byRoomGrade[student.studio_room_grade] || 0) + 1;
      }
      
      // Count by payment plan
      if (student.payment_plan_name) {
        summary.byPaymentPlan[student.payment_plan_name] = (summary.byPaymentPlan[student.payment_plan_name] || 0) + 1;
      }
    });

    return summary;
  } catch (error) {
    console.error('❌ Error getting student data summary:', error);
    return {
      total: 0,
      withCompleteProfiles: 0,
      withIncompleteProfiles: 0,
      byCountry: {},
      byYearOfStudy: {},
      byRoomGrade: {},
      byPaymentPlan: {}
    };
  }
};

// Download file utility
export const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default {
  getCompleteStudentData,
  exportStudentData,
  getStudentDataSummary,
  downloadFile
}; 