import { supabase } from './supabaseClient';
import { apiConfig } from '@/config/environment';
import { validateLead, validateStudent, validateStudio, validateStudioUpdate, validateUser, sanitizeString, sanitizeEmail, sanitizePhone, isValidEmail } from './validation';

// Simple cache for frequently accessed data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const clearCache = (pattern?: string) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

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
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to each operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), 15000)
      );
      
      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: wait 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// Case-insensitive configuration value normalization
const normalizeConfigValue = async (value: string, configType: 'status' | 'source' | 'responsecategory' | 'followupstage' | 'roomgrade' | 'duration') => {
  if (!value) return value;
  
  try {
    let configData;
    let tableName;
    
    switch (configType) {
      case 'status':
        configData = await getLeadStatus();
        tableName = 'lead_status';
        break;
      case 'source':
        configData = await getLeadSources();
        tableName = 'lead_sources';
        break;
      case 'responsecategory':
        configData = await getResponseCategories();
        tableName = 'response_categories';
        break;
      case 'followupstage':
        configData = await getFollowUpStages();
        tableName = 'follow_up_stages';
        break;
      case 'roomgrade':
        configData = await getRoomGrades();
        tableName = 'room_grades';
        break;
      case 'duration':
        configData = await getStayDurations();
        tableName = 'stay_durations';
        break;
      default:
        return value;
    }
    
    if (!configData || configData.length === 0) {
      return value;
    }
    
    // Find exact match first (case-sensitive)
    const exactMatch = configData.find(item => item.name === value);
    if (exactMatch) {
      return exactMatch.name;
    }
    
    // Find case-insensitive match
    const caseInsensitiveMatch = configData.find(item => 
      item.name.toLowerCase() === value.toLowerCase()
    );
    
    if (caseInsensitiveMatch) {
      return caseInsensitiveMatch.name; // Return the correct case from database
    }
    
    // If no match found, return original value (will be treated as new entry)
    return value;
  } catch (error) {
    console.warn(`Error normalizing ${configType} value "${value}":`, error);
    return value;
  }
};

// LEADS
export const getLeads = async () => {
  // Check cache first
  const cached = getCachedData('leads');
  if (cached) {
    return cached;
  }

  return withRetry(async () => {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) handleSupabaseError(error, 'Fetch leads');
    const result = data || [];
    setCachedData('leads', result);
    return result;
  });
};

export const createLead = async (lead) => {
  // Validate email before processing
  if (lead.email && !isValidEmail(lead.email)) {
    throw new Error(`Invalid email address: ${lead.email}. Please use a valid email domain.`);
  }

  // Normalize configuration values for case-insensitive matching
  const normalizedLead = {
    ...lead,
    status: await normalizeConfigValue(lead.status, 'status'),
    source: await normalizeConfigValue(lead.source, 'source'),
    responsecategory: await normalizeConfigValue(lead.responsecategory, 'responsecategory'),
    followupstage: await normalizeConfigValue(lead.followupstage, 'followupstage'),
    roomgrade: await normalizeConfigValue(lead.roomgrade, 'roomgrade'),
    duration: await normalizeConfigValue(lead.duration, 'duration'),
  };

  // Validate and sanitize input
  const validation = validateLead(normalizedLead);
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
  
  // Clear cache when data changes
  clearCache('leads');
  
  return data[0];
};

export const updateLead = async (id, updates) => {
  // Normalize configuration values for case-insensitive matching
  const normalizedUpdates = {
    ...updates,
    status: updates.status ? await normalizeConfigValue(updates.status, 'status') : undefined,
    source: updates.source ? await normalizeConfigValue(updates.source, 'source') : undefined,
    responsecategory: updates.responsecategory ? await normalizeConfigValue(updates.responsecategory, 'responsecategory') : undefined,
    followupstage: updates.followupstage ? await normalizeConfigValue(updates.followupstage, 'followupstage') : undefined,
    roomgrade: updates.roomgrade ? await normalizeConfigValue(updates.roomgrade, 'roomgrade') : undefined,
    duration: updates.duration ? await normalizeConfigValue(updates.duration, 'duration') : undefined,
  };

  // Validate and sanitize input
  const validation = validateLead(normalizedUpdates);
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
  // Normalize configuration values for case-insensitive matching
  const normalizedUpdates = {
    ...updates,
    status: updates.status ? await normalizeConfigValue(updates.status, 'status') : undefined,
    source: updates.source ? await normalizeConfigValue(updates.source, 'source') : undefined,
    responsecategory: updates.responsecategory ? await normalizeConfigValue(updates.responsecategory, 'responsecategory') : undefined,
    followupstage: updates.followupstage ? await normalizeConfigValue(updates.followupstage, 'followupstage') : undefined,
    roomgrade: updates.roomgrade ? await normalizeConfigValue(updates.roomgrade, 'roomgrade') : undefined,
    duration: updates.duration ? await normalizeConfigValue(updates.duration, 'duration') : undefined,
  };

  // Validate updates for each lead
  const validation = validateLead(normalizedUpdates);
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
  // Check cache first
  const cached = getCachedData('students');
  if (cached) {
    return cached;
  }

  return withRetry(async () => {
    const { data, error } = await supabase.from('students').select('*');
    if (error) handleSupabaseError(error, 'Fetch students');
    const result = data || [];
    setCachedData('students', result);
    return result;
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
  // Normalize configuration values for case-insensitive matching
  const normalizedStudent = {
    ...student,
    room: student.room ? await normalizeConfigValue(student.room, 'roomgrade') : undefined,
    duration: student.duration ? await normalizeConfigValue(student.duration, 'duration') : undefined,
  };

  // Validate and sanitize input
  const validation = validateStudent(normalizedStudent);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data
  const sanitizedStudent = {
    ...validation.data,
    name: sanitizeString(validation.data.name),
    email: validation.data.email ? sanitizeEmail(validation.data.email) : '',
    phone: sanitizePhone(validation.data.phone),
  };

  const { data, error } = await supabase.from('students').insert([sanitizedStudent]).select();
  if (error) throw error;
  return data[0];
};

export const updateStudent = async (id, updates) => {
  // Normalize configuration values for case-insensitive matching
  const normalizedUpdates = {
    ...updates,
    room: updates.room ? await normalizeConfigValue(updates.room, 'roomgrade') : undefined,
    duration: updates.duration ? await normalizeConfigValue(updates.duration, 'duration') : undefined,
  };

  // Validate and sanitize input
  const validation = validateStudent(normalizedUpdates);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data
  const sanitizedUpdates = {
    ...validation.data,
    name: validation.data.name ? sanitizeString(validation.data.name) : undefined,
    email: validation.data.email ? sanitizeEmail(validation.data.email) : undefined,
    phone: validation.data.phone ? sanitizePhone(validation.data.phone) : undefined,
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
  // Normalize configuration values for case-insensitive matching
  let normalizedRoomGrade = studio.roomGrade;
  try {
    normalizedRoomGrade = await normalizeConfigValue(studio.roomGrade, 'roomgrade');
  } catch (error) {
    console.warn('Error normalizing room grade, using original value:', error);
  }
  
  const normalizedStudio = {
    ...studio,
    roomGrade: normalizedRoomGrade,
  };

  // Validate and sanitize input
  const validation = validateStudio(normalizedStudio);
  if (!validation.success) {
    console.error('Studio validation failed:', validation.errors);
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data
  const sanitizedStudio = {
    ...validation.data,
    name: sanitizeString(validation.data.name),
    id: sanitizeString(validation.data.id),
    view: validation.data.view ? sanitizeString(validation.data.view) : '',
    floor: validation.data.floor !== undefined ? validation.data.floor : 1, // Default to 1 if not provided
  };

  const { data, error } = await supabase.from('studios').insert([sanitizedStudio]).select();
  if (error) throw error;
  return data[0];
};

export const updateStudio = async (id, updates) => {
  // Normalize configuration values for case-insensitive matching
  const normalizedUpdates = {
    ...updates,
    roomGrade: updates.roomGrade ? await normalizeConfigValue(updates.roomGrade, 'roomgrade') : undefined,
  };

  // Validate and sanitize input (use update validation for partial updates)
  const validation = validateStudioUpdate(normalizedUpdates);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  // Sanitize data (only include fields that are present)
  const sanitizedUpdates = {
    ...(validation.data.name && { name: sanitizeString(validation.data.name) }),
    ...(validation.data.id && { id: sanitizeString(validation.data.id) }),
    ...(validation.data.view && { view: sanitizeString(validation.data.view) }),
    ...(validation.data.floor !== undefined && { floor: validation.data.floor }),
    ...(validation.data.roomGrade !== undefined && { roomGrade: validation.data.roomGrade }),
    ...(validation.data.occupied !== undefined && { occupied: validation.data.occupied }),
    ...(validation.data.occupiedby !== undefined && { occupiedby: validation.data.occupiedby }),
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

export const createRoomGrade = async (name, stock = 0, weekly_rate = 320) => {
  try {
    const { data, error } = await supabase.from('room_grades').insert([{ name, stock, weekly_rate }]).select();
    if (error) throw error;
    return data[0];
  } catch (error: any) {
    // If stock or weekly_rate column doesn't exist, try without them
    if (error.message?.includes('stock') || error.message?.includes('weekly_rate')) {
      const { data, error: fallbackError } = await supabase.from('room_grades').insert([{ name }]).select();
      if (fallbackError) throw fallbackError;
      return data[0];
    }
    throw error;
  }
};

export const updateRoomGrade = async (id, name, stock, weekly_rate = 320) => {
  try {
    const { data, error } = await supabase.from('room_grades').update({ name, stock, weekly_rate }).eq('id', id).select();
    if (error) throw error;
    return data[0];
  } catch (error: any) {
    // If stock or weekly_rate column doesn't exist, try without them
    if (error.message?.includes('stock') || error.message?.includes('weekly_rate')) {
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
  // 2. Insert into users table (if signUp succeeded)
  if (user) {
    const { data: profileData, error: profileError } = await supabase.from('users').upsert([
      { 
        id: user.id, 
        email: sanitizedData.email, 
        name: sanitizedData.name, 
        role: sanitizedData.role,
        approved: true,
        approved_at: new Date().toISOString()
      }
    ], { onConflict: 'id' }).select();
    if (profileError) throw profileError;

    // 3. Create user role in user_roles table
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: sanitizedData.role,
        is_active: true,
        assigned_at: new Date().toISOString()
      });

    if (roleError) throw roleError;

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

// STUDIO VIEWS
export const getStudioViews = async () => {
  return withRetry(async () => {
    try {
      const { data, error } = await supabase.from('studio_views').select('*').order('name');
      if (error) {
        console.warn('Studio views table might not exist yet:', error);
        // Return empty array if table doesn't exist
        return [];
      }
      console.log('Studio views fetched successfully:', data);
      return data || [];
    } catch (error) {
      console.warn('Error fetching studio views:', error);
      return [];
    }
  });
};

export const createStudioView = async (name) => {
  try {
    const { data, error } = await supabase.from('studio_views').insert([{ name }]).select();
    if (error) throw error;
    return data[0];
  } catch (error: any) {
    throw error;
  }
};

export const updateStudioView = async (id, name) => {
  try {
    const { data, error } = await supabase.from('studio_views').update({ name }).eq('id', id).select();
    if (error) throw error;
    return data[0];
  } catch (error: any) {
    throw error;
  }
};

export const deleteStudioView = async (id) => {
  const { error } = await supabase.from('studio_views').delete().eq('id', id);
  if (error) throw error;
};

// TOURIST FUNCTIONS
export const getTourists = async () => {
  try {
    const { data, error } = await supabase
      .from('tourists')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get tourists');
  }
};

export const createTourist = async (tourist) => {
  try {
    const sanitizedTourist = {
      name: sanitizeString(tourist.name),
      phone: sanitizePhone(tourist.phone),
      email: sanitizeEmail(tourist.email),
      room: sanitizeString(tourist.room),
      checkin: tourist.checkin,
      checkout: tourist.checkout,
      duration: sanitizeString(tourist.duration),
      revenue: parseFloat(tourist.revenue) || 0,
      assignedto: tourist.assignedto || null,
      notes: tourist.notes ? sanitizeString(tourist.notes) : null,
      status: tourist.status || 'active',
    };

    console.log('Sanitized tourist data:', sanitizedTourist);

    const { data, error } = await supabase
      .from('tourists')
      .insert([sanitizedTourist])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating tourist:', error);
      throw error;
    }
    
    console.log('Tourist created successfully:', data);
    clearCache('tourists');
    return data;
  } catch (error) {
    console.error('Error in createTourist:', error);
    handleSupabaseError(error, 'Create tourist');
    return null; // Return null instead of undefined
  }
};

export const updateTourist = async (id, updates) => {
  try {
    const sanitizedUpdates = {
      name: updates.name ? sanitizeString(updates.name) : undefined,
      phone: updates.phone ? sanitizePhone(updates.phone) : undefined,
      email: updates.email ? sanitizeEmail(updates.email) : undefined,
      room: updates.room ? sanitizeString(updates.room) : undefined,
      checkin: updates.checkin,
      checkout: updates.checkout,
      duration: updates.duration ? sanitizeString(updates.duration) : undefined,
      revenue: updates.revenue ? parseFloat(updates.revenue) : undefined,
      assignedto: updates.assignedto || null,
      notes: updates.notes ? sanitizeString(updates.notes) : undefined,
      status: updates.status || undefined,
    };

    const { data, error } = await supabase
      .from('tourists')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    clearCache('tourists');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update tourist');
  }
};

export const deleteTourist = async (id) => {
  try {
    const { error } = await supabase
      .from('tourists')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    clearCache('tourists');
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'Delete tourist');
  }
};

export const bulkDeleteTourists = async (ids) => {
  try {
    const { error } = await supabase
      .from('tourists')
      .delete()
      .in('id', ids);
    
    if (error) throw error;
    
    clearCache('tourists');
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'Bulk delete tourists');
  }
}; 

// Student User Account Management
export const createStudentUserAccount = async (studentData) => {
  try {
    const { name, email, phone } = studentData;
    const cleanEmail = sanitizeEmail(email);
    
    // Check if user already exists in both auth and users table
    // Using a try-catch to handle potential RLS policy issues gracefully
    let existingUser = null;
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', cleanEmail)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully
      
      if (!userError && userData) {
        existingUser = userData;
      }
    } catch (userQueryError) {
      console.warn('Could not check existing user, proceeding with creation:', userQueryError);
      // Continue with user creation if query fails
    }
    
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return {
        success: true,
        user: existingUser,
        defaultPassword: 'existing-user'
      };
    }
    
    // Generate a unique email-based password for students
    const emailPrefix = cleanEmail.split('@')[0];
    const defaultPassword = `${emailPrefix}2024!`;
    
    try {
      // Create user account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: defaultPassword,
        options: {
          emailRedirectTo: undefined, // No email confirmation
          data: {
            name: sanitizeString(name),
            role: 'student',
            phone: sanitizePhone(phone),
            approved: true
          }
        }
      });

      if (authError) {
        // If auth user already exists, try to get the existing user
        if (authError.message?.includes('already') || authError.status === 422) {
          console.log('Auth user might already exist, checking...');
          // User exists in auth but not in our users table, create profile only
        } else {
          throw authError;
        }
      }

      const userId = authData?.user?.id || `temp-${Date.now()}`;

      // Create user profile in users table with upsert
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          name: sanitizeString(name),
          email: cleanEmail,
          role: 'student',
          approved: true,
          approved_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (profileError) {
        console.warn('Profile creation warning:', profileError);
        // Try to get existing user
        const { data: fallbackUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .single();
        
        if (fallbackUser) {
          return {
            success: true,
            user: fallbackUser,
            defaultPassword: 'existing-user'
          };
        }
        throw profileError;
      }

      clearCache('users');
      
      return {
        success: true,
        user: userProfile,
        defaultPassword
      };

    } catch (innerError) {
      console.error('Error in auth/profile creation:', innerError);
      
      // Last resort: try to find existing user
      const { data: fallbackUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .single();
      
      if (fallbackUser) {
        return {
          success: true,
          user: fallbackUser,
          defaultPassword: 'existing-user'
        };
      }
      
      throw innerError;
    }
    
  } catch (error) {
    console.error('createStudentUserAccount error:', error);
    handleSupabaseError(error, 'Create student user account');
    return { success: false, error: error.message };
  }
};

// Create student with user account link
export const createStudentWithUserAccount = async (studentData) => {
  try {
    console.log('🔍 createStudentWithUserAccount called with:', studentData);
    
    // First create the user account
    const userAccount = await createStudentUserAccount(studentData);
    
    if (!userAccount?.success) {
      throw new Error('Failed to create user account');
    }

    // Prepare student data with proper payment plan mapping
    const studentWithUserId = {
      ...studentData,
      user_id: userAccount.user.id,
      // Ensure payment plan data is properly mapped
      payment_plan_id: studentData.payment_plan_id ? parseInt(studentData.payment_plan_id) : null,
      payment_cycles: studentData.payment_plan_id ? 
        (studentData.payment_cycles || 
         (studentData.payment_plan_id === 1 ? 3 : 
          studentData.payment_plan_id === 2 ? 4 : 
          studentData.payment_plan_id === 3 ? 10 : null)) : null,
      duration_weeks: studentData.duration_weeks || 
        (studentData.duration?.includes('45') ? 45 : 
         studentData.duration?.includes('51') ? 51 : null),
      deposit_paid: studentData.deposit_paid || false
    };

    console.log('📝 Student data prepared:', studentWithUserId);

    const createdStudent = await createStudent(studentWithUserId);
    
    if (!createdStudent) {
      throw new Error('Failed to create student record');
    }

    console.log('✅ Student created:', createdStudent);
    
    // Automatically create comprehensive application record with ALL student data
    if (createdStudent) {
      // Detect if this is a lead conversion based on presence of lead-specific data
      const source = studentData.source || studentData.notes || studentData.dateofinquiry ? 'lead' : 'direct';
      
      console.log('🔍 Detected source:', source);
      
      // Use the mapping utility for perfect data consistency
      const applicationData = {
        user_id: userAccount.user.id,
        ...(await mapStudentDataToApplication(studentData, source))
      };

      console.log('📋 Application data prepared:', applicationData);

      try {
        const createdApplication = await createStudentApplication(applicationData);
        console.log('✅ Application record created successfully:', createdApplication);
      } catch (appError) {
        console.warn('⚠️ Failed to create application record:', appError);
        // Don't fail the entire operation if application creation fails
      }
    }
    
    // Clear cache to ensure fresh data
    clearCache('students');
    clearCache('student_applications');
    
    return {
      success: true,
      student: createdStudent,
      user: userAccount.user,
      defaultPassword: userAccount.defaultPassword
    };
  } catch (error) {
    console.error('❌ createStudentWithUserAccount failed:', error);
    handleSupabaseError(error, 'Create student with user account');
  }
};

export const getStudentProfile = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Get student profile');
  }
};

export const updateStudentProfile = async (studentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;
    clearCache('students');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update student profile');
  }
};

// Student Application System Functions

// Get application options for dropdowns
export const getApplicationOptions = async () => {
  try {
    // Get all options from the unified application_options table
    const { data: allOptions, error } = await supabase
      .from('application_options')
      .select('*')
      .eq('active', true)
      .order('category')
      .order('sort_order');

    if (error) throw error;

    // Group options by category
    const optionsByCategory = allOptions.reduce((acc, option) => {
      if (!acc[option.category]) {
        acc[option.category] = [];
      }
      acc[option.category].push(option);
      return acc;
    }, {});

    return {
      ethnicities: optionsByCategory['ethnicity'] || [],
      genders: optionsByCategory['gender'] || [],
      countries: optionsByCategory['country'] || [],
      years: optionsByCategory['year_of_study'] || [],
      entries: optionsByCategory['entry_uk'] || [],
      installments: optionsByCategory['payment_installment'] || []
    };
  } catch (error) {
    handleSupabaseError(error, 'Get application options');
  }
};

// Get application options by category using the RPC function
export const getApplicationOptionsByCategory = async (category: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_application_options', { category_name: category });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, `Get application options for category: ${category}`);
    return [];
  }
};

// Helper functions for specific categories
export const getEthnicityOptions = async () => {
  return await getApplicationOptionsByCategory('ethnicity');
};

export const getGenderOptions = async () => {
  return await getApplicationOptionsByCategory('gender');
};

export const getCountryOptions = async () => {
  return await getApplicationOptionsByCategory('country');
};

export const getYearOfStudyOptions = async () => {
  return await getApplicationOptionsByCategory('year_of_study');
};

export const getEntryUKOptions = async () => {
  return await getApplicationOptionsByCategory('entry_uk');
};

export const getPaymentInstallmentOptions = async () => {
  return await getApplicationOptionsByCategory('payment_installment');
};

// Get student application
export const getStudentApplication = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('student_applications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Get student application');
  }
};

// Create student application
export const createStudentApplication = async (applicationData) => {
  try {
    console.log('📝 Creating student application with data:', applicationData);
    
    const { data, error } = await supabase
      .from('student_applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating student application:', error);
      throw error;
    }
    
    console.log('✅ Student application created successfully:', data);
    clearCache('student_applications');
    return data;
  } catch (error) {
    console.error('❌ createStudentApplication failed:', error);
    handleSupabaseError(error, 'Create student application');
  }
};

// Update student application
export const updateStudentApplication = async (applicationId, updates) => {
  try {
    const { data, error } = await supabase
      .from('student_applications')
      .update(updates)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    clearCache('student_applications');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update student application');
  }
};

// Submit student application
export const submitStudentApplication = async (applicationId) => {
  try {
    const { data, error } = await supabase
      .from('student_applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    clearCache('student_applications');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Submit student application');
  }
};

// Get application documents
export const getApplicationDocuments = async (applicationId) => {
  try {
    const { data, error } = await supabase
      .from('application_documents')
      .select('*')
      .eq('application_id', applicationId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get application documents');
  }
};

// Upload application document
export const uploadApplicationDocument = async (documentData) => {
  try {
    const { applicationId, documentType, file, fileName } = documentData;
    
    // Validate file
    if (!file || file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File too large or invalid');
    }

    // Get file extension
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    // Generate secure file path
    const { data: { user } } = await supabase.auth.getUser();
    const filePath = `${user.id}/${documentType}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('application-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Save document record to database
    const { data, error } = await supabase
      .from('application_documents')
      .insert({
        application_id: applicationId,
        document_type: documentType,
        file_name: fileName,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type
      })
      .select()
      .single();

    if (error) throw error;
    clearCache('application_documents');
    return { success: true, document: data };
  } catch (error) {
    handleSupabaseError(error, 'Upload application document');
  }
};

// Delete application document
export const deleteApplicationDocument = async (documentId) => {
  try {
    // First get the document to get the file path
    const { data: document, error: fetchError } = await supabase
      .from('application_documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    if (document.file_path) {
      const { error: storageError } = await supabase.storage
        .from('application-documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;
    }

    // Delete from database
    const { error } = await supabase
      .from('application_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
    clearCache('application_documents');
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'Delete application document');
  }
};

// Update application progress
export const updateApplicationProgress = async (applicationId, stepNumber, stepName, isCompleted, dataSnapshot = null) => {
  try {
    const { data, error } = await supabase
      .from('application_progress')
      .upsert({
        application_id: applicationId,
        step_number: stepNumber,
        step_name: stepName,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        data_snapshot: dataSnapshot
      })
      .select()
      .single();

    if (error) throw error;
    clearCache('application_progress');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update application progress');
  }
};

// Get application progress
export const getApplicationProgress = async (applicationId) => {
  try {
    const { data, error } = await supabase
      .from('application_progress')
      .select('*')
      .eq('application_id', applicationId)
      .order('step_number');

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get application progress');
  }
};

// Get signed URL for document viewing
export const getDocumentUrl = async (filePath, expirySeconds = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from('application-documents')
      .createSignedUrl(filePath, expirySeconds);

    if (error) throw error;
    return { success: true, url: data.signedUrl };
  } catch (error) {
    handleSupabaseError(error, 'Get document URL');
  }
};

// Update document status
export const updateDocumentStatus = async (documentId, status, reviewNotes = null) => {
  try {
    const { data, error } = await supabase
      .from('application_documents')
      .update({
        status: status,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;
    clearCache('application_documents');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update document status');
  }
};

// Admin functions
export const getAllStudentApplications = async () => {
  try {
    const { data, error } = await supabase
      .from('student_applications')
      .select(`
        *,
        application_documents(*),
        application_progress(*)
      `)
      .order('id', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get all student applications');
  }
};

export const reviewApplication = async (applicationId, status, reviewNotes = null) => {
  try {
    const { data, error } = await supabase
      .from('student_applications')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;
    clearCache('student_applications');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Review application');
  }
};

// =====================================================
// FINANCE & ACCOUNTS MODULE
// =====================================================

export const getInvoices = async () => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        student:students!invoices_student_fk(id, name, email, phone),
        tourist:tourists!invoices_tourist_fk(id, name, email, phone)
      `)
      .order('id', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get invoices');
    return [];
  }
};

export const createInvoice = async (invoiceData) => {
  try {
    const sanitizedInvoice = {
      student_id: invoiceData.student_id || null,
      tourist_id: invoiceData.tourist_id || null,
      payment_plan_id: invoiceData.payment_plan_id,
      amount: parseFloat(invoiceData.amount) || 0,
      currency: invoiceData.currency || 'GBP',
      status: invoiceData.status || 'pending',
      due_date: invoiceData.due_date,
      notes: invoiceData.notes ? sanitizeString(invoiceData.notes) : null,
      invoice_number: invoiceData.invoice_number || `INV-${Date.now()}`,
      description: invoiceData.description ? sanitizeString(invoiceData.description) : null,
      issued_date: invoiceData.issued_date || new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('invoices')
      .insert([sanitizedInvoice])
      .select()
      .single();

    if (error) throw error;
    clearCache('invoices');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Create invoice');
  }
};

// Auto-create invoice when student is created
export const createStudentInvoice = async (studentData) => {
  try {
    const invoiceData = {
      student_id: studentData.id,
      amount: studentData.revenue || 0,
      currency: 'GBP',
      description: `Accommodation fees for ${studentData.name}`,
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      status: 'pending',
      invoice_number: `INV-STU-${studentData.id}-${Date.now()}`,
      issued_date: new Date().toISOString().split('T')[0]
    };

    return await createInvoice(invoiceData);
  } catch (error) {
    console.error('Error creating student invoice:', error);
    throw error;
  }
};

// Auto-create invoice when tourist is created
export const createTouristInvoice = async (touristData) => {
  try {
    const invoiceData = {
      tourist_id: touristData.id,
      amount: touristData.revenue || 0,
      currency: 'GBP',
      description: `Short-term stay fees for ${touristData.name}`,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days for tourists
      status: 'pending',
      invoice_number: `INV-TOU-${touristData.id}-${Date.now()}`,
      issued_date: new Date().toISOString().split('T')[0]
    };

    return await createInvoice(invoiceData);
  } catch (error) {
    console.error('Error creating tourist invoice:', error);
    throw error;
  }
};

export const updateInvoice = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    clearCache('invoices');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update invoice');
  }
};

export const deleteInvoice = async (id) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
    clearCache('invoices');
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'Delete invoice');
  }
};

export const getPayments = async () => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(invoice_number, amount)
      `)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get payments');
    return [];
  }
};

export const createPayment = async (paymentData) => {
  try {
    const sanitizedPayment = {
      invoice_id: paymentData.invoice_id,
      amount: parseFloat(paymentData.amount) || 0,
      payment_method: sanitizeString(paymentData.payment_method),
      transaction_id: paymentData.transaction_id ? sanitizeString(paymentData.transaction_id) : null,
      status: paymentData.status || 'completed',
      notes: paymentData.notes ? sanitizeString(paymentData.notes) : null
    };

    const { data, error } = await supabase
      .from('payments')
      .insert([sanitizedPayment])
      .select()
      .single();

    if (error) throw error;
    clearCache('payments');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Create payment');
  }
};

export const getPaymentPlans = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_plans')
      .select(`
        *,
        academic_year:academic_years(*)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get payment plans');
    return [];
  }
};

export const getPaymentPlanStats = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_plan_stats')
      .select('*')
      .order('payment_cycles');

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get payment plan stats');
    return [];
  }
};

export const createPaymentPlan = async (planData) => {
  try {
    const sanitizedPlan = {
      name: sanitizeString(planData.name),
      description: planData.description ? sanitizeString(planData.description) : null,
      amount: parseFloat(planData.amount) || 0,
      currency: planData.currency || 'GBP',
      duration_weeks: parseInt(planData.duration_weeks) || 45,
      payment_cycles: parseInt(planData.payment_cycles) || 3,
      academic_year_id: planData.academic_year_id || null,
      is_active: planData.is_active !== false
    };

    const { data, error } = await supabase
      .from('payment_plans')
      .insert([sanitizedPlan])
      .select()
      .single();

    if (error) throw error;
    clearCache('payment_plans');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Create payment plan');
  }
};

// =====================================================
// ACADEMIC YEARS & COMPREHENSIVE STUDENT SYSTEM
// =====================================================

// Academic Years CRUD
export const getAcademicYears = async () => {
  try {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get academic years');
    return [];
  }
};

export const getCurrentAcademicYear = async () => {
  try {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('is_current', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Get current academic year');
    return null;
  }
};

export const createAcademicYear = async (yearData) => {
  try {
    const sanitizedYear = {
      year_code: sanitizeString(yearData.year_code),
      start_date: yearData.start_date,
      end_date: yearData.end_date,
      weeks_45_start: yearData.weeks_45_start,
      weeks_45_end: yearData.weeks_45_end,
      weeks_51_start: yearData.weeks_51_start,
      weeks_51_end: yearData.weeks_51_end,
      is_active: yearData.is_active !== false,
      is_current: yearData.is_current === true
    };

    const { data, error } = await supabase
      .from('academic_years')
      .insert([sanitizedYear])
      .select()
      .single();

    if (error) throw error;
    clearCache('academic_years');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Create academic year');
  }
};

// Enhanced Payment Plan functions
export const getPaymentPlan = async (planId: number) => {
  try {
    const { data, error } = await supabase
      .from('payment_plans')
      .select(`
        *,
        academic_year:academic_years(*)
      `)
      .eq('id', planId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Get payment plan');
    return null;
  }
};

export const getStudentsByPaymentCycles = async (paymentCycles: number) => {
  try {
    // Use direct query for now - the function might have permission issues
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        student_payment_progress!inner(
          paid_installments,
          total_installments
        )
      `)
      .eq('payment_cycles', paymentCycles)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    // Fallback to simple query if join fails
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('payment_cycles', paymentCycles)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (fallbackError) {
      handleSupabaseError(fallbackError, 'Get students by payment cycles');
      return [];
    }
  }
};

// Student Payment Progress CRUD
export const getStudentPaymentProgress = async (paymentCycles?: number, studentId?: number) => {
  try {
    let query = supabase
      .from('student_payment_progress')
      .select(`
        *,
        student:students(*),
        payment_plan:payment_plans(*)
      `);

    if (paymentCycles) {
      // Get students with this payment cycle and then get their payment progress
      const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('payment_cycles', paymentCycles);
      
      if (students && students.length > 0) {
        const studentIds = students.map(s => s.id);
        query = query.in('student_id', studentIds);
      } else {
        return []; // No students with this payment cycle
      }
    }
    
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get student payment progress');
    return [];
  }
};

export const createStudentPaymentProgress = async (progressData) => {
  try {
    const sanitizedProgress = {
      student_id: parseInt(progressData.student_id),
      payment_plan_id: parseInt(progressData.payment_plan_id),
      total_installments: parseInt(progressData.total_installments),
      paid_installments: parseInt(progressData.paid_installments) || 0,
      total_amount: parseFloat(progressData.total_amount),
      paid_amount: parseFloat(progressData.paid_amount) || 0,
      deposit_amount: parseFloat(progressData.deposit_amount) || 99.00,
      deposit_paid: progressData.deposit_paid === true,
      deposit_paid_date: progressData.deposit_paid_date || null,
      next_payment_due: progressData.next_payment_due || null
    };

    const { data, error } = await supabase
      .from('student_payment_progress')
      .insert([sanitizedProgress])
      .select()
      .single();

    if (error) throw error;
    clearCache('student_payment_progress');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Create student payment progress');
  }
};

export const updateStudentPaymentProgress = async (progressId: number, updates) => {
  try {
    const sanitizedUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('student_payment_progress')
      .update(sanitizedUpdates)
      .eq('id', progressId)
      .select()
      .single();

    if (error) throw error;
    clearCache('student_payment_progress');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update student payment progress');
  }
};

// Audit Trail CRUD
export const createAuditTrailEntry = async (auditData) => {
  try {
    const sanitizedAudit = {
      entity_type: sanitizeString(auditData.entity_type),
      entity_id: parseInt(auditData.entity_id),
      action: sanitizeString(auditData.action),
      field_name: auditData.field_name ? sanitizeString(auditData.field_name) : null,
      old_value: auditData.old_value ? JSON.stringify(auditData.old_value) : null,
      new_value: auditData.new_value ? JSON.stringify(auditData.new_value) : null,
      user_id: auditData.user_id || null,
      user_role: auditData.user_role ? sanitizeString(auditData.user_role) : null,
      user_name: auditData.user_name ? sanitizeString(auditData.user_name) : null,
      ip_address: auditData.ip_address || null,
      user_agent: auditData.user_agent ? sanitizeString(auditData.user_agent) : null
    };

    const { data, error } = await supabase
      .from('audit_trail')
      .insert([sanitizedAudit])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Create audit trail entry');
  }
};

export const getAuditTrail = async (entityType?: string, entityId?: number, userId?: string) => {
  try {
    let query = supabase
      .from('audit_trail')
      .select('*');

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    
    if (entityId) {
      query = query.eq('entity_id', entityId);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100); // Limit to last 100 entries

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get audit trail');
    return [];
  }
};

export const getStudentRecentActivity = async (studentId: number) => {
  try {
    const { data, error } = await supabase
      .from('audit_trail')
      .select('*')
      .eq('entity_type', 'student')
      .eq('entity_id', studentId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get student recent activity');
    return [];
  }
};

// Enhanced Student CRUD with audit trail
export const createStudentWithAudit = async (studentData, currentUser) => {
  try {
    // Get current academic year
    const currentAcademicYear = await getCurrentAcademicYear();
    
    const sanitizedStudent = {
      name: sanitizeString(studentData.name),
      email: sanitizeString(studentData.email),
      phone: sanitizeString(studentData.phone),
      room: studentData.room ? sanitizeString(studentData.room) : null,
      duration: studentData.duration ? sanitizeString(studentData.duration) : null,
      assignedto: studentData.assignedto ? sanitizeString(studentData.assignedto) : null,
      checkin: studentData.checkin || null,
      revenue: parseFloat(studentData.revenue) || 0,
      user_id: studentData.user_id || null,
      academic_year_id: currentAcademicYear?.id || null,
      deposit_paid: currentUser?.role !== 'student', // Auto-set based on user role
      duration_weeks: parseInt(studentData.duration_weeks) || null,
      payment_cycles: parseInt(studentData.payment_cycles) || null,
      payment_plan_id: studentData.payment_plan_id || null
    };

    const { data, error } = await supabase
      .from('students')
      .insert([sanitizedStudent])
      .select()
      .single();

    if (error) throw error;

    // Create audit trail entry
    await createAuditTrailEntry({
      entity_type: 'student',
      entity_id: data.id,
      action: 'created',
      new_value: sanitizedStudent,
      user_id: currentUser?.id,
      user_role: currentUser?.role,
      user_name: currentUser?.name || currentUser?.email
    });

    clearCache('students');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Create student with audit');
  }
};

export const updateStudentWithAudit = async (studentId: number, updates, currentUser) => {
  try {
    // Get current student data for audit trail
    const { data: currentStudent } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    const sanitizedUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('students')
      .update(sanitizedUpdates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;

    // Create audit trail entries for each changed field
    Object.keys(updates).forEach(async (field) => {
      if (currentStudent && currentStudent[field] !== updates[field]) {
        await createAuditTrailEntry({
          entity_type: 'student',
          entity_id: studentId,
          action: 'updated',
          field_name: field,
          old_value: currentStudent[field],
          new_value: updates[field],
          user_id: currentUser?.id,
          user_role: currentUser?.role,
          user_name: currentUser?.name || currentUser?.email
        });
      }
    });

    clearCache('students');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update student with audit');
  }
};

// =====================================================
// CLEANING MODULE
// =====================================================

export const getCleaningSchedules = async () => {
  try {
    // First get cleaning schedules with studios and tasks
    const { data: schedules, error: schedulesError } = await supabase
      .from('cleaning_schedules')
      .select(`
        *,
        studio:studios!studio_id(id, name, floor, view),
        tasks:cleaning_tasks(*)
      `)
      .order('scheduled_date', { ascending: true });

    if (schedulesError) throw schedulesError;

    // Then get users (cleaners) separately
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'cleaner');

    if (usersError) {
      console.warn('Could not fetch users:', usersError);
    }

              // Merge the data
          const schedulesWithCleaners = schedules?.map(schedule => ({
            ...schedule,
            cleaner: (schedule.assigned_cleaner_id || schedule.cleaner_id)
              ? users?.find(user => user.id === (schedule.assigned_cleaner_id || schedule.cleaner_id)) || null
              : null
          })) || [];

    return schedulesWithCleaners;
  } catch (error) {
    handleSupabaseError(error, 'Get cleaning schedules');
    return [];
  }
};

export const getCleaningScheduleById = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from('cleaning_schedules')
      .select(`
        *,
        studio:studios!studio_id(id, name, floor, view, roomgrade),
        cleaner:users!assigned_cleaner_id(id, name, email, role),
        tasks:cleaning_tasks(*),
        reservation_student:students!reservation_id(id, name, email),
        reservation_tourist:tourists!reservation_id(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Get cleaning schedule');
    return null;
  }
};

export const createCleaningSchedule = async (scheduleData: any) => {
  try {
    // Core fields that definitely exist
    const sanitizedSchedule: any = {
      studio_id: scheduleData.studio_id,
      scheduled_date: scheduleData.scheduled_date,
      cleaning_type: scheduleData.cleaning_type || 'checkout',
      status: 'scheduled',
      notes: scheduleData.notes ? sanitizeString(scheduleData.notes) : null
    };

    // Add optional fields only if they have values (to avoid column missing errors)
    if (scheduleData.reservation_type) {
      sanitizedSchedule.reservation_type = scheduleData.reservation_type;
    }
    if (scheduleData.reservation_id) {
      sanitizedSchedule.reservation_id = scheduleData.reservation_id;
    }
    if (scheduleData.scheduled_time) {
      sanitizedSchedule.scheduled_time = scheduleData.scheduled_time;
    }
    if (scheduleData.priority) {
      sanitizedSchedule.priority = scheduleData.priority;
    }
    if (scheduleData.assigned_cleaner_id) {
      // Try both possible column names
      sanitizedSchedule.assigned_cleaner_id = scheduleData.assigned_cleaner_id;
    }
    if (scheduleData.special_requirements) {
      sanitizedSchedule.special_requirements = sanitizeString(scheduleData.special_requirements);
    }

    // Try inserting with full data first
    let data, error;
    const insertResult = await supabase
      .from('cleaning_schedules')
      .insert([sanitizedSchedule])
      .select()
      .single();
    
    data = insertResult.data;
    error = insertResult.error;

    // If insert failed due to missing columns, try with minimal required fields
    if (error && error.message?.includes('column') && error.message?.includes('does not exist')) {
      console.warn('⚠️ Some columns missing, trying minimal insert:', error.message);
      
      const minimalSchedule = {
        studio_id: scheduleData.studio_id,
        scheduled_date: scheduleData.scheduled_date,
        cleaning_type: scheduleData.cleaning_type || 'checkout',
        status: 'scheduled'
      };

      const minimalResult = await supabase
        .from('cleaning_schedules')
        .insert([minimalSchedule])
        .select()
        .single();
      
      data = minimalResult.data;
      error = minimalResult.error;
    }

    if (error) throw error;
    
    // If no cleaner assigned, auto-assign one
    if (!sanitizedSchedule.assigned_cleaner_id && data) {
      const { data: autoAssignResult } = await supabase
        .rpc('auto_assign_cleaner', { 
          schedule_date: sanitizedSchedule.scheduled_date,
          schedule_time: sanitizedSchedule.scheduled_time || '10:00'
        });
      
      if (autoAssignResult) {
        await updateCleaningSchedule(data.id, { assigned_cleaner_id: autoAssignResult });
      }
    }

    clearCache('cleaning_schedules');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Create cleaning schedule');
  }
};

export const updateCleaningSchedule = async (id: number, updates: any) => {
  try {
    const sanitizedUpdates = Object.keys(updates).reduce((acc, key) => {
      if (typeof updates[key] === 'string' && ['notes', 'special_requirements'].includes(key)) {
        acc[key] = sanitizeString(updates[key]);
      } else {
        acc[key] = updates[key];
      }
      return acc;
    }, {} as any);

    const { data, error } = await supabase
      .from('cleaning_schedules')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    clearCache('cleaning_schedules');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update cleaning schedule');
  }
};

export const deleteCleaningSchedule = async (id: number) => {
  try {
    const { error } = await supabase
      .from('cleaning_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    clearCache('cleaning_schedules');
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'Delete cleaning schedule');
  }
};

export const getCleaningTasks = async (scheduleId?: number) => {
  try {
    let query = supabase
      .from('cleaning_tasks')
      .select(`
        *,
        cleaner:users!completed_by(id, name, email)
      `)
      .order('created_at', { ascending: true });

    if (scheduleId) {
      query = query.eq('schedule_id', scheduleId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get cleaning tasks');
    return [];
  }
};

export const createCleaningTask = async (taskData: any) => {
  try {
    const sanitizedTask = {
      schedule_id: taskData.schedule_id,
      task_name: sanitizeString(taskData.task_name),
      description: taskData.description ? sanitizeString(taskData.description) : null,
      estimated_minutes: taskData.estimated_minutes || 15
    };

    const { data, error } = await supabase
      .from('cleaning_tasks')
      .insert([sanitizedTask])
      .select()
      .single();

    if (error) throw error;
    clearCache('cleaning_tasks');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Create cleaning task');
  }
};

export const updateCleaningTask = async (id: number, updates: any) => {
  try {
    const sanitizedUpdates = Object.keys(updates).reduce((acc, key) => {
      if (typeof updates[key] === 'string' && ['task_name', 'description', 'notes'].includes(key)) {
        acc[key] = sanitizeString(updates[key]);
      } else {
        acc[key] = updates[key];
      }
      return acc;
    }, {} as any);

    // If marking as completed, set completion timestamp
    if (sanitizedUpdates.is_completed === true && !sanitizedUpdates.completed_at) {
      sanitizedUpdates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('cleaning_tasks')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    clearCache('cleaning_tasks');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update cleaning task');
  }
};

export const deleteCleaningTask = async (id: number) => {
  try {
    const { error } = await supabase
      .from('cleaning_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    clearCache('cleaning_tasks');
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'Delete cleaning task');
  }
};

export const getCleaningSupplies = async () => {
  try {
    const { data, error } = await supabase
      .from('cleaning_supplies')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get cleaning supplies');
    return [];
  }
};

export const createCleaningSupply = async (supplyData) => {
  try {
    const sanitizedSupply = {
      name: sanitizeString(supplyData.name),
      description: supplyData.description ? sanitizeString(supplyData.description) : null,
      quantity: parseInt(supplyData.quantity) || 0,
      unit: sanitizeString(supplyData.unit),
      reorder_level: parseInt(supplyData.reorder_level) || 5,
      supplier: supplyData.supplier ? sanitizeString(supplyData.supplier) : null,
      cost_per_unit: supplyData.cost_per_unit ? parseFloat(supplyData.cost_per_unit) : null
    };

    const { data, error } = await supabase
      .from('cleaning_supplies')
      .insert([sanitizedSupply])
      .select()
      .single();

    if (error) throw error;
    clearCache('cleaning_supplies');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Create cleaning supply');
  }
};

export const updateCleaningSupply = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('cleaning_supplies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    clearCache('cleaning_supplies');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update cleaning supply');
  }
};

export const deleteCleaningSupply = async (id) => {
  try {
    const { error } = await supabase
      .from('cleaning_supplies')
      .delete()
      .eq('id', id);

    if (error) throw error;
    clearCache('cleaning_supplies');
    return { success: true };
  } catch (error) {
    handleSupabaseError(error, 'Delete cleaning supply');
  }
};

// =============================================
// MAINTENANCE REQUESTS CRUD OPERATIONS
// =============================================

export const getMaintenanceRequests = async () => {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        student:students(id, name, email, room),
        studio:studios(id, name, floor, view)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get maintenance requests');
  }
};

export const getMaintenanceRequestsByStudent = async (studentId: number) => {
  try {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        *,
        studio:studios(id, name, floor, view)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'Get student maintenance requests');
  }
};

export const createMaintenanceRequest = async (requestData) => {
  try {
    const sanitizedRequest = {
      student_id: parseInt(requestData.student_id),
      studio_id: requestData.studio_id,
      title: sanitizeString(requestData.title),
      description: sanitizeString(requestData.description),
      category: requestData.category || 'general',
      priority: requestData.priority || 'medium',
      status: requestData.status || 'pending',
      urgency: requestData.urgency || 'normal'
    };

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert([sanitizedRequest])
      .select(`
        *,
        student:students(id, name, email, room),
        studio:studios(id, name, floor, view)
      `)
      .single();

    if (error) throw error;
    clearCache('maintenance_requests');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Create maintenance request');
  }
};

export const updateMaintenanceRequest = async (id, updates) => {
  try {
    const sanitizedUpdates: any = {};
    
    if (updates.title) sanitizedUpdates.title = sanitizeString(updates.title);
    if (updates.description) sanitizedUpdates.description = sanitizeString(updates.description);
    if (updates.category) sanitizedUpdates.category = updates.category;
    if (updates.priority) sanitizedUpdates.priority = updates.priority;
    if (updates.status) sanitizedUpdates.status = updates.status;
    if (updates.urgency) sanitizedUpdates.urgency = updates.urgency;
    if (updates.assigned_to) sanitizedUpdates.assigned_to = updates.assigned_to;
    if (updates.resolution_notes) sanitizedUpdates.resolution_notes = sanitizeString(updates.resolution_notes);
    if (updates.resolved_at) sanitizedUpdates.resolved_at = updates.resolved_at;

    const { data, error } = await supabase
      .from('maintenance_requests')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select(`
        *,
        student:students(id, name, email, room),
        studio:studios(id, name, floor, view)
      `)
      .single();

    if (error) throw error;
    clearCache('maintenance_requests');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Update maintenance request');
  }
};

export const deleteMaintenanceRequest = async (id) => {
  try {
    const { error } = await supabase
      .from('maintenance_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
    clearCache('maintenance_requests');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'Delete maintenance request');
  }
};

// ===========================
// CLEANING SYSTEM CRUD OPERATIONS
// ===========================

export const getCleaningStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const schedulesData = await supabase.from('cleaning_schedules').select('*');

    if (schedulesData.error) throw schedulesData.error;

    const schedules = schedulesData.data || [];

    return {
      totalSchedules: schedules.length,
      completedToday: schedules.filter(s => 
        s.scheduled_date === today && s.status === 'completed'
      ).length,
      pendingToday: schedules.filter(s => 
        s.scheduled_date === today && s.status === 'scheduled'
      ).length,
      overdueSchedules: schedules.filter(s => 
        s.scheduled_date < today && s.status !== 'completed'
      ).length,
      inProgressCount: schedules.filter(s => s.status === 'in_progress').length,
      upcomingCleanings: schedules.filter(s => 
        s.scheduled_date > today && s.status === 'scheduled'
      ).length,
      cleanStudios: 0, // Not available without cleaning_status column
      dirtyStudios: 0, // Not available without cleaning_status column
      needsCleaningStudios: 0 // Not available without cleaning_status column
    };
  } catch (error) {
    handleSupabaseError(error, 'Get cleaning stats');
    return {
      totalSchedules: 0,
      completedToday: 0,
      pendingToday: 0,
      overdueSchedules: 0,
      inProgressCount: 0,
      upcomingCleanings: 0,
      cleanStudios: 0,
      dirtyStudios: 0,
      needsCleaningStudios: 0
    };
  }
};

export const getCleanerWorkload = async (cleanerId: string, date?: string) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('cleaning_schedules')
      .select('*')
      .eq('assigned_cleaner_id', cleanerId)
      .eq('scheduled_date', targetDate)
      .in('status', ['scheduled', 'in_progress']);

    if (error) throw error;
    
    const totalMinutes = (data || []).reduce((total, schedule) => 
      total + (schedule.estimated_duration || 120), 0
    );

    return {
      assignedTasks: data?.length || 0,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10
    };
  } catch (error) {
    handleSupabaseError(error, 'Get cleaner workload');
    return { assignedTasks: 0, totalMinutes: 0, totalHours: 0 };
  }
};

export const calculateStudentCheckoutDate = async (studentId: number) => {
  try {
    const { data, error } = await supabase
      .rpc('calculate_checkout_date', {
        checkin_date: null,
        duration_text: null
      });

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Calculate student checkout date');
    return null;
  }
};

export const updateStudentCheckoutDates = async () => {
  try {
    const { data, error } = await supabase
      .rpc('update_student_checkout_dates');

    if (error) throw error;
    clearCache('students');
    return data; // Returns number of updated students
  } catch (error) {
    handleSupabaseError(error, 'Update student checkout dates');
    return 0;
  }
};

export const startCleaningTask = async (scheduleId: number) => {
  try {
    const updates = {
      status: 'in_progress',
      started_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('cleaning_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    clearCache('cleaning_schedules');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Start cleaning task');
  }
};

export const completeCleaningTask = async (scheduleId: number, notes?: string) => {
  try {
    const updates = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      ...(notes && { notes: sanitizeString(notes) })
    };

    const { data, error } = await supabase
      .from('cleaning_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    clearCache('cleaning_schedules');
    return data;
  } catch (error) {
    handleSupabaseError(error, 'Complete cleaning task');
  }
};

// Data Mapping Utility for Perfect Consistency
const mapStudentDataToApplication = async (studentData: any, source: 'lead' | 'direct' | 'conversion' = 'direct') => {
  console.log('🔍 mapStudentDataToApplication called with:', { studentData, source });
  
  // Use full name instead of splitting
  const fullName = studentData.name || '';
  console.log('📝 Full name:', fullName);
  
  // Calculate age from birthday if provided
  const calculateAge = (birthday: string) => {
    if (!birthday) return 0;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get payment plan name if payment_plan_id is provided
  let paymentPlanName = '';
  if (studentData.payment_plan_id) {
    try {
      console.log('💳 Fetching payment plan name for ID:', studentData.payment_plan_id);
      const { data: paymentPlan } = await supabase
        .from('payment_plans')
        .select('name')
        .eq('id', studentData.payment_plan_id)
        .single();
      paymentPlanName = paymentPlan?.name || '';
      console.log('💳 Payment plan name:', paymentPlanName);
    } catch (error) {
      console.warn('Failed to fetch payment plan name:', error);
    }
  }

  // Map data based on source
  const mappedData: any = {
    // Personal Information (mapped from student data) - Use full names
    first_name: fullName, // Store full name in first_name field
    last_name: '', // Keep empty for full name approach
    email: studentData.email || '',
    mobile: studentData.phone || '',
    birthday: studentData.birthday || '',
    age: studentData.age || calculateAge(studentData.birthday || ''),
    ethnicity: studentData.ethnicity || '',
    gender: studentData.gender || '',
    ucas_id: studentData.ucas_id || '',
    country: studentData.country || '',
    
    // Contact Information (mapped from student data)
    address_line_1: studentData.address_line_1 || '',
    address_line_2: studentData.address_line_2 || '',
    post_code: studentData.post_code || '',
    town: studentData.town || '',
    
    // Academic Information (mapped from student data)
    year_of_study: studentData.year_of_study || '',
    field_of_study: studentData.field_of_study || '',
    
    // Additional Information (mapped from student data)
    is_disabled: studentData.is_disabled || false,
    is_smoker: studentData.is_smoker || false,
    medical_requirements: studentData.medical_requirements || '',
    entry_into_uk: studentData.entry_into_uk || '',
    
    // Payment Information (mapped from student data) - Include payment plan name
    wants_installments: studentData.wants_installments || false,
    selected_installment_plan: paymentPlanName || studentData.selected_installment_plan || '',
    payment_installments: studentData.payment_installments || '',
    data_consent: studentData.data_consent || false,
    deposit_paid: studentData.deposit_paid || false,
    
    // Guarantor Information (mapped from student data)
    guarantor_name: studentData.guarantor_name || '',
    guarantor_email: studentData.guarantor_email || '',
    guarantor_phone: studentData.guarantor_phone || '',
    guarantor_date_of_birth: studentData.guarantor_date_of_birth || '',
    guarantor_relationship: studentData.guarantor_relationship || '',
    
    // Document Uploads (mapped from student data)
    utility_bill_url: studentData.utility_bill_url || '',
    utility_bill_filename: studentData.utility_bill_filename || '',
    identity_document_url: studentData.identity_document_url || '',
    identity_document_filename: studentData.identity_document_filename || '',
    bank_statement_url: studentData.bank_statement_url || '',
    bank_statement_filename: studentData.bank_statement_filename || '',
    passport_url: studentData.passport_url || '',
    passport_filename: studentData.passport_filename || '',
    current_visa_url: studentData.current_visa_url || '',
    current_visa_filename: studentData.current_visa_filename || '',
    
    // Application metadata
    current_step: 1,
    is_complete: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Source-specific mappings
  if (source === 'lead') {
    // Additional lead-specific mappings
    mappedData['source'] = studentData.source || '';
    mappedData['lead_notes'] = studentData.notes || '';
    mappedData['date_of_inquiry'] = studentData.dateofinquiry || '';
    console.log('📋 Lead-specific data mapped:', {
      source: mappedData['source'],
      lead_notes: mappedData['lead_notes'],
      date_of_inquiry: mappedData['date_of_inquiry']
    });
  }

  console.log('✅ Final mapped data:', mappedData);
  return mappedData;
};

// Enhanced profile completion calculation based on student_applications table
export const calculateProfileCompletion = async (userId: string) => {
  try {
    const { data: application, error } = await supabase
      .from('student_applications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !application) {
      return 0;
    }

    // Define all required fields for profile completion
    const requiredFields = [
      'first_name', 'birthday', 'age', 'ethnicity', 'gender', 'ucas_id', 'country',
      'email', 'mobile', 'address_line_1', 'address_line_2', 'post_code', 'town',
      'year_of_study', 'field_of_study', 'medical_requirements', 'entry_into_uk',
      'payment_installments', 'guarantor_name', 'guarantor_email', 'guarantor_phone',
      'guarantor_date_of_birth', 'guarantor_relationship'
    ];
    
    // Count filled fields
    const filledFields = requiredFields.filter(field => {
      const value = application[field];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    }).length;
    
    // Calculate document completion (5 documents, 6% each = 30% total)
    const documents = [
      application.utility_bill_url,
      application.identity_document_url,
      application.bank_statement_url,
      application.passport_url,
      application.current_visa_url
    ].filter(Boolean);
    
    const documentCompletion = Math.min(documents.length * 6, 30);
    const fieldCompletion = (filledFields / requiredFields.length) * 70;
    
    return Math.min(Math.round(fieldCompletion + documentCompletion), 100);
  } catch (error) {
    console.error('Error calculating profile completion:', error);
    return 0;
  }
};

// Test function to verify data mapping and database insertion
export const testDataMapping = async () => {
  try {
    console.log('🧪 Testing data mapping...');
    
    // Test data
    const testStudentData = {
      name: 'John Doe',
      phone: '1234567890',
      email: 'john@test.com',
      payment_plan_id: 1,
      source: 'Website',
      notes: 'Test lead conversion',
      dateofinquiry: '2024-01-01'
    };
    
    console.log('📋 Test student data:', testStudentData);
    
    // Test mapping function
    const mappedData = await mapStudentDataToApplication(testStudentData, 'lead');
    console.log('✅ Mapped data:', mappedData);
    
    // Test database insertion (without user_id for now)
    const testApplicationData = {
      user_id: 'test-user-id',
      ...mappedData
    };
    
    console.log('📝 Testing database insertion...');
    const result = await createStudentApplication(testApplicationData);
    console.log('✅ Database insertion result:', result);
    
    return { success: true, mappedData, result };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
};