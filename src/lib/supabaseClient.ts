import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ilgpcebjszrwbauvbmsy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsZ3BjZWJqc3pyd2JhdXZibXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTI3OTYsImV4cCI6MjA2Njg4ODc5Nn0.ctjQlU0LQId6cTTAEmRH_dqIn4CSmEw2ZRfCgHUwXO4';

// Validate environment variables in production
if (import.meta.env.PROD) {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('Missing required environment variables for Supabase configuration');
    throw new Error('Supabase configuration is incomplete. Please check your environment variables.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}); 