interface EnvironmentConfig {
  NODE_ENV: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  VITE_API_TIMEOUT: number;
  VITE_MAX_FILE_SIZE: number;
  VITE_ENABLE_ANALYTICS: boolean;
  VITE_ENABLE_DEBUG: boolean;
}

const config: EnvironmentConfig = {
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://ilgpcebjszrwbauvbmsy.supabase.co',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsZ3BjZWJqc3pyd2JhdXZibXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI3OTYsImV4cCI6MjA2Njg4ODc5Nn0.ctjQlU0LQId6cTTAEmRH_dqIn4CSmEw2ZRfCgHUwXO4',
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'Leads UrbanHub',
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  VITE_API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  VITE_MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '5242880'), // 5MB
  VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  VITE_ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true',
};

// Validate required environment variables (only if not provided via env vars)
const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !import.meta.env[varName] && !config[varName as keyof EnvironmentConfig]);

if (missingEnvVars.length > 0) {
  console.warn(`Missing environment variables: ${missingEnvVars.join(', ')}. Using fallback values.`);
}

export default config;

// Environment-specific configurations
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Feature flags
export const features = {
  analytics: config.VITE_ENABLE_ANALYTICS,
  debug: config.VITE_ENABLE_DEBUG && isDevelopment,
  bulkUpload: true,
  realTimeUpdates: true,
  exportData: true,
  userManagement: true,
  auditTrail: true, // ✅ Implemented audit trail
};

// API configuration
export const apiConfig = {
  timeout: config.VITE_API_TIMEOUT,
  retryAttempts: 3,
  retryDelay: 1000,
  maxFileSize: config.VITE_MAX_FILE_SIZE,
};

// App configuration
export const appConfig = {
  name: config.VITE_APP_NAME,
  version: config.VITE_APP_VERSION,
  maxUploadSize: '5MB',
  supportedFileTypes: ['csv', 'xlsx', 'xls'],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  search: {
    debounceDelay: 300,
    minSearchLength: 2,
  },
  notifications: {
    autoHideDuration: 5000,
    maxNotifications: 5,
  },
}; 