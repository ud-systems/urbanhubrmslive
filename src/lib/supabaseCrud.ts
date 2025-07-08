import { supabase } from './supabaseClient';
import { apiConfig } from '@/config/environment';
import { validateLead, validateStudent, validateStudio, validateUser, sanitizeString, sanitizeEmail, sanitizePhone } from './validation';

// Enhanced error handling wrapper
const handleSupabaseError = (error: any, operation: string) => {
  const errorMessage = error?.message || 'An unknown error occurred';
  const enhancedError = new Error(`${operation} failed: ${errorMessage}`);
  enhancedError.name = 'SupabaseError';
  // Store original error in a custom property for compatibility
  (enhancedError as any).originalError = error;
  throw enhancedError;
};

// Retry wrapper for network resilience
const withRetry = async (operation: () => Promise<any>, maxRetries = 3) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  throw lastError;
};

// LEADS
export const getLeads = async () => {
  return withRetry(async () => {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) handleSupabaseError(error, 'Fetch leads');
    return data || [];
  });
};

export const createLead = async (lead) => {
  // Validate and sanitize input
  const validation = validateLead(lead);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data
  const sanitizedLead = {
    ...validation.data,
    name: sanitizeString(validation.data.name),
    email: validation.data.email ? sanitizeEmail(validation.data.email) : '',
    phone: sanitizePhone(validation.data.phone),
    notes: validation.data.notes ? sanitizeString(validation.data.notes) : '',
  };

  const { data, error } = await supabase.from('leads').insert([sanitizedLead]).select();
  if (error) throw error;
  return data[0];
};

export const updateLead = async (id, updates) => {
  // Validate and sanitize input
  const validation = validateLead(updates);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data
  const sanitizedUpdates = {
    ...validation.data,
    name: validation.data.name ? sanitizeString(validation.data.name) : undefined,
    email: validation.data.email ? sanitizeEmail(validation.data.email) : undefined,
    phone: validation.data.phone ? sanitizePhone(validation.data.phone) : undefined,
    notes: validation.data.notes ? sanitizeString(validation.data.notes) : undefined,
  };

  const { data, error } = await supabase.from('leads').update(sanitizedUpdates).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteLead = async (id) => {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
};

export const bulkUpdateLeads = async (ids, updates) => {
  // Validate updates for each lead
  const validation = validateLead(updates);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data
  const sanitizedUpdates = {
    ...validation.data,
    name: validation.data.name ? sanitizeString(validation.data.name) : undefined,
    email: validation.data.email ? sanitizeEmail(validation.data.email) : undefined,
    phone: validation.data.phone ? sanitizePhone(validation.data.phone) : undefined,
    notes: validation.data.notes ? sanitizeString(validation.data.notes) : undefined,
  };

  const { error } = await supabase.from('leads').update(sanitizedUpdates).in('id', ids);
  if (error) throw error;
};

export const bulkDeleteLeads = async (ids) => {
  const { error } = await supabase.from('leads').delete().in('id', ids);
  if (error) throw error;
};

// STUDENTS
export const getStudents = async () => {
  return withRetry(async () => {
    const { data, error } = await supabase.from('students').select('*');
    if (error) handleSupabaseError(error, 'Fetch students');
    return data || [];
  });
};

// Debug function to check students table schema
export const debugStudentsSchema = async () => {
  const { data, error } = await supabase.from('students').select('*').limit(1);
  if (error) {
    console.error('Error fetching students schema:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Students table columns:', Object.keys(data[0]));
  }
};

// Debug function to check studios table schema
export const debugStudiosSchema = async () => {
  const { data, error } = await supabase.from('studios').select('*').limit(1);
  if (error) {
    console.error('Error fetching studios schema:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Studios table columns:', Object.keys(data[0]));
    console.log('Sample studio data:', data[0]);
  } else {
    console.log('No studios found in database');
  }
};

export const createStudent = async (student) => {
  // Validate and sanitize input
  const validation = validateStudent(student);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data
  const sanitizedStudent = {
    ...validation.data,
    name: sanitizeString(validation.data.name),
    email: validation.data.email ? sanitizeEmail(validation.data.email) : '',
    phone: sanitizePhone(validation.data.phone),
    notes: validation.data.notes ? sanitizeString(validation.data.notes) : '',
  };

  const { data, error } = await supabase.from('students').insert([sanitizedStudent]).select();
  if (error) throw error;
  return data[0];
};

export const updateStudent = async (id, updates) => {
  // Validate and sanitize input
  const validation = validateStudent(updates);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data
  const sanitizedUpdates = {
    ...validation.data,
    name: validation.data.name ? sanitizeString(validation.data.name) : undefined,
    email: validation.data.email ? sanitizeEmail(validation.data.email) : undefined,
    phone: validation.data.phone ? sanitizePhone(validation.data.phone) : undefined,
    notes: validation.data.notes ? sanitizeString(validation.data.notes) : undefined,
  };

  const { data, error } = await supabase.from('students').update(sanitizedUpdates).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteStudent = async (id) => {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw error;
};

export const bulkDeleteStudents = async (ids) => {
  const { error } = await supabase.from('students').delete().in('id', ids);
  if (error) throw error;
};

// STUDIOS
export const getStudios = async () => {
  return withRetry(async () => {
    const { data, error } = await supabase.from('studios').select('*');
    if (error) handleSupabaseError(error, 'Fetch studios');
    return data || [];
  });
};

export const createStudio = async (studio) => {
  // Validate and sanitize input
  const validation = validateStudio(studio);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data
  const sanitizedStudio = {
    ...validation.data,
    name: sanitizeString(validation.data.name),
    id: sanitizeString(validation.data.id),
    view: validation.data.view ? sanitizeString(validation.data.view) : '',
  };

  const { data, error } = await supabase.from('studios').insert([sanitizedStudio]).select();
  if (error) throw error;
  return data[0];
};

export const updateStudio = async (id, updates) => {
  // Validate and sanitize input
  const validation = validateStudio(updates);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data
  const sanitizedUpdates = {
    ...validation.data,
    name: validation.data.name ? sanitizeString(validation.data.name) : undefined,
    id: validation.data.id ? sanitizeString(validation.data.id) : undefined,
    view: validation.data.view ? sanitizeString(validation.data.view) : undefined,
  };

  const { data, error } = await supabase.from('studios').update(sanitizedUpdates).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteStudio = async (id) => {
  const { error } = await supabase.from('studios').delete().eq('id', id);
  if (error) throw error;
};

// ROOM GRADES
export const getRoomGrades = async () => {
  return withRetry(async () => {
    const { data, error } = await supabase.from('room_grades').select('*').order('name');
    if (error) handleSupabaseError(error, 'Fetch room grades');
    return data || [];
  });
};

export const createRoomGrade = async (name, stock = 0) => {
  try {
    const { data, error } = await supabase.from('room_grades').insert([{ name, stock }]).select();
    if (error) throw error;
    return data[0];
  } catch (error: any) {
    // If stock column doesn't exist, try without it
    if (error.message?.includes('stock')) {
      const { data, error: fallbackError } = await supabase.from('room_grades').insert([{ name }]).select();
      if (fallbackError) throw fallbackError;
      return data[0];
    }
    throw error;
  }
};

export const updateRoomGrade = async (id, name, stock) => {
  try {
    const { data, error } = await supabase.from('room_grades').update({ name, stock }).eq('id', id).select();
    if (error) throw error;
    return data[0];
  } catch (error: any) {
    // If stock column doesn't exist, try without it
    if (error.message?.includes('stock')) {
      const { data, error: fallbackError } = await supabase.from('room_grades').update({ name }).eq('id', id).select();
      if (fallbackError) throw fallbackError;
      return data[0];
    }
    throw error;
  }
};

export const deleteRoomGrade = async (id) => {
  const { error } = await supabase.from('room_grades').delete().eq('id', id);
  if (error) throw error;
};

// STAY DURATIONS
export const getStayDurations = async () => {
  const { data, error } = await supabase.from('stay_durations').select('*').order('name');
  if (error) throw error;
  return data;
};

export const createStayDuration = async (name) => {
  const { data, error } = await supabase.from('stay_durations').insert([{ name }]).select();
  if (error) throw error;
  return data[0];
};

export const updateStayDuration = async (id, name) => {
  const { data, error } = await supabase.from('stay_durations').update({ name }).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteStayDuration = async (id) => {
  const { error } = await supabase.from('stay_durations').delete().eq('id', id);
  if (error) throw error;
};

// LEAD SOURCES
export const getLeadSources = async () => {
  const { data, error } = await supabase.from('lead_sources').select('*').order('name');
  if (error) throw error;
  return data;
};

export const createLeadSource = async (name) => {
  const { data, error } = await supabase.from('lead_sources').insert([{ name }]).select();
  if (error) throw error;
  return data[0];
};

export const updateLeadSource = async (id, name) => {
  const { data, error } = await supabase.from('lead_sources').update({ name }).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteLeadSource = async (id) => {
  const { error } = await supabase.from('lead_sources').delete().eq('id', id);
  if (error) throw error;
};

// RESPONSE CATEGORIES
export const getResponseCategories = async () => {
  const { data, error } = await supabase.from('response_categories').select('*').order('name');
  if (error) throw error;
  return data;
};

export const createResponseCategory = async (name) => {
  const { data, error } = await supabase.from('response_categories').insert([{ name }]).select();
  if (error) throw error;
  return data[0];
};

export const updateResponseCategory = async (id, name) => {
  const { data, error } = await supabase.from('response_categories').update({ name }).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteResponseCategory = async (id) => {
  const { error } = await supabase.from('response_categories').delete().eq('id', id);
  if (error) throw error;
};

// USERS
export const getUsers = async () => {
  return withRetry(async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) handleSupabaseError(error, 'Fetch users');
    return data || [];
  });
};

export const createUserWithProfile = async (email, password, name, role) => {
  // Validate user data
  const validation = validateUser({ email, password, name, role });
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data
  const sanitizedData = {
    ...validation.data,
    name: sanitizeString(validation.data.name),
    email: sanitizeEmail(validation.data.email),
  };

  // 1. Create user in Supabase Auth (frontend-safe)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: sanitizedData.email,
    password: sanitizedData.password
  });
  if (authError) throw authError;
  const user = authData.user;
  // 2. Insert into profiles table (if signUp succeeded)
  if (user) {
    const { data: profileData, error: profileError } = await supabase.from('profiles').upsert([
      { id: user.id, email: sanitizedData.email, name: sanitizedData.name, role: sanitizedData.role }
    ], { onConflict: 'id' }).select();
    if (profileError) throw profileError;
    return profileData[0];
  } else {
    // If user is null, likely needs email confirmation
    return null;
  }
};

// LEAD STATUS
export const getLeadStatus = async () => {
  const { data, error } = await supabase.from('lead_status').select('*').order('name');
  if (error) throw error;
  return data;
};

export const createLeadStatus = async (name) => {
  const { data, error } = await supabase.from('lead_status').insert([{ name }]).select();
  if (error) throw error;
  return data[0];
};

export const updateLeadStatus = async (id, name) => {
  const { data, error } = await supabase.from('lead_status').update({ name }).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteLeadStatus = async (id) => {
  const { error } = await supabase.from('lead_status').delete().eq('id', id);
  if (error) throw error;
};

// FOLLOW UP STAGES
export const getFollowUpStages = async () => {
  const { data, error } = await supabase.from('follow_up_stages').select('*').order('name');
  if (error) throw error;
  return data;
};

export const createFollowUpStage = async (name) => {
  const { data, error } = await supabase.from('follow_up_stages').insert([{ name }]).select();
  if (error) throw error;
  return data[0];
};

export const updateFollowUpStage = async (id, name) => {
  const { data, error } = await supabase.from('follow_up_stages').update({ name }).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

export const deleteFollowUpStage = async (id) => {
  const { error } = await supabase.from('follow_up_stages').delete().eq('id', id);
  if (error) throw error;
}; 