import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getLeads, 
  getStudents, 
  getTourists, 
  getStudios, 
  getRoomGrades, 
  getStayDurations, 
  getLeadSources, 
  getLeadStatus, 
  getFollowUpStages, 
  getResponseCategories, 
  getStudioViews, 
  getUsers 
} from '@/lib/supabaseCrud';
import { logError, logWarn } from '@/lib/logger';

// Query keys for consistent caching
export const QUERY_KEYS = {
  leads: ['leads'],
  students: ['students'],
  tourists: ['tourists'],
  studios: ['studios'],
  roomGrades: ['roomGrades'],
  stayDurations: ['stayDurations'],
  leadSources: ['leadSources'],
  leadStatus: ['leadStatus'],
  followUpStages: ['followUpStages'],
  responseCategories: ['responseCategories'],
  studioViews: ['studioViews'],
  users: ['users']
} as const;

// Common query options
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// Core data hooks
export const useLeads = () => {
  return useQuery({
    queryKey: QUERY_KEYS.leads,
    queryFn: async () => {
      try {
        return await getLeads();
      } catch (error) {
        logError('useLeads', 'Failed to fetch leads', error);
        throw error;
      }
    },
    ...defaultQueryOptions,
  });
};

export const useStudents = () => {
  return useQuery({
    queryKey: QUERY_KEYS.students,
    queryFn: async () => {
      try {
        return await getStudents();
      } catch (error) {
        logError('useStudents', 'Failed to fetch students', error);
        throw error;
      }
    },
    ...defaultQueryOptions,
  });
};

export const useTourists = () => {
  return useQuery({
    queryKey: QUERY_KEYS.tourists,
    queryFn: async () => {
      try {
        return await getTourists();
      } catch (error) {
        logError('useTourists', 'Failed to fetch tourists', error);
        throw error;
      }
    },
    ...defaultQueryOptions,
  });
};

export const useStudios = () => {
  return useQuery({
    queryKey: QUERY_KEYS.studios,
    queryFn: async () => {
      try {
        return await getStudios();
      } catch (error) {
        logError('useStudios', 'Failed to fetch studios', error);
        throw error;
      }
    },
    ...defaultQueryOptions,
  });
};

// Configuration data hooks (longer cache time as they change less frequently)
const configQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 15 * 60 * 1000, // 15 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
};

export const useRoomGrades = () => {
  return useQuery({
    queryKey: QUERY_KEYS.roomGrades,
    queryFn: getRoomGrades,
    ...configQueryOptions,
  });
};

export const useStayDurations = () => {
  return useQuery({
    queryKey: QUERY_KEYS.stayDurations,
    queryFn: getStayDurations,
    ...configQueryOptions,
  });
};

export const useLeadSources = () => {
  return useQuery({
    queryKey: QUERY_KEYS.leadSources,
    queryFn: getLeadSources,
    ...configQueryOptions,
  });
};

export const useLeadStatus = () => {
  return useQuery({
    queryKey: QUERY_KEYS.leadStatus,
    queryFn: getLeadStatus,
    ...configQueryOptions,
  });
};

export const useFollowUpStages = () => {
  return useQuery({
    queryKey: QUERY_KEYS.followUpStages,
    queryFn: getFollowUpStages,
    ...configQueryOptions,
  });
};

export const useResponseCategories = () => {
  return useQuery({
    queryKey: QUERY_KEYS.responseCategories,
    queryFn: getResponseCategories,
    ...configQueryOptions,
  });
};

export const useStudioViews = () => {
  return useQuery({
    queryKey: QUERY_KEYS.studioViews,
    queryFn: getStudioViews,
    ...configQueryOptions,
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.users,
    queryFn: async () => {
      try {
        return await getUsers();
      } catch (error) {
        logError('useUsers', 'Failed to fetch users', error);
        throw error;
      }
    },
    ...defaultQueryOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes (users change less frequently)
  });
};

// Combined hook for all system data with parallel fetching
export const useSystemData = () => {
  const leads = useLeads();
  const students = useStudents();
  const tourists = useTourists();
  const studios = useStudios();
  const roomGrades = useRoomGrades();
  const stayDurations = useStayDurations();
  const leadSources = useLeadSources();
  const leadStatus = useLeadStatus();
  const followUpStages = useFollowUpStages();
  const responseCategories = useResponseCategories();
  const studioViews = useStudioViews();
  const users = useUsers();

  const isLoading = 
    leads.isLoading || 
    students.isLoading || 
    tourists.isLoading || 
    studios.isLoading ||
    roomGrades.isLoading ||
    stayDurations.isLoading ||
    leadSources.isLoading ||
    leadStatus.isLoading ||
    followUpStages.isLoading ||
    responseCategories.isLoading ||
    studioViews.isLoading ||
    users.isLoading;

  const isError = 
    leads.isError || 
    students.isError || 
    tourists.isError || 
    studios.isError ||
    roomGrades.isError ||
    stayDurations.isError ||
    leadSources.isError ||
    leadStatus.isError ||
    followUpStages.isError ||
    responseCategories.isError ||
    studioViews.isError ||
    users.isError;

  const error = leads.error || students.error || tourists.error || studios.error || 
               roomGrades.error || stayDurations.error || leadSources.error || 
               leadStatus.error || followUpStages.error || responseCategories.error || 
               studioViews.error || users.error;

  return {
    // Data
    leads: leads.data || [],
    students: students.data || [],
    tourists: tourists.data || [],
    studios: studios.data || [],
    roomGrades: roomGrades.data || [],
    stayDurations: stayDurations.data || [],
    leadSources: leadSources.data || [],
    leadStatus: leadStatus.data || [],
    followUpStages: followUpStages.data || [],
    responseCategories: responseCategories.data || [],
    studioViews: studioViews.data || [],
    users: users.data || [],
    
    // Derived data
    salespeople: (users.data || []).filter(u => u.role === "salesperson"),
    
    // Status
    isLoading,
    isError,
    error,
    
    // Individual query states for granular control
    queries: {
      leads,
      students,
      tourists,
      studios,
      roomGrades,
      stayDurations,
      leadSources,
      leadStatus,
      followUpStages,
      responseCategories,
      studioViews,
      users
    }
  };
};

// Utility hook for invalidating queries after mutations
export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  return {
    invalidateLeads: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leads }),
    invalidateStudents: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students }),
    invalidateTourists: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tourists }),
    invalidateStudios: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studios }),
    invalidateUsers: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}; 