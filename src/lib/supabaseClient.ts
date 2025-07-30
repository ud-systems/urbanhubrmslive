import { createClient } from '@supabase/supabase-js';

// Use environment variables - required for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  throw new Error('Supabase configuration is incomplete. Please check your .env file.');
}

// Check if we're using placeholder values
if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-anon-key')) {
  console.warn('⚠️  Using placeholder Supabase credentials. Please update your .env file with actual values.');
}
 
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 5 // Reduced to prevent overwhelming
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'urbanhub-leads-crm'
    }
  },
  db: {
    schema: 'public'
  }
});

// Test connection on startup
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('leads').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
};

// Health check function for monitoring connection status
export const checkConnectionHealth = async () => {
  try {
    const startTime = Date.now();
    const { data, error } = await supabase.from('leads').select('id').limit(1);
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.warn('⚠️ Connection health check failed:', error.message);
      return { healthy: false, responseTime, error: error.message };
    }
    
    console.log(`✅ Connection healthy (${responseTime}ms)`);
    return { healthy: true, responseTime };
  } catch (error) {
    console.error('❌ Connection health check error:', error);
    return { healthy: false, responseTime: null, error: error.message };
  }
}; 