import { supabase } from './supabaseClient';

// Fix authentication token issues
export const clearCorruptedSession = async () => {
  try {
    console.log('🔧 Clearing corrupted authentication session...');
    
    // Clear local storage auth data
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-ilgpcebjszrwbauvbmsy-auth-token');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Sign out from Supabase to clear server-side session
    await supabase.auth.signOut();
    
    console.log('✅ Authentication session cleared');
    
    // Redirect to login
    window.location.href = '/signin';
  } catch (error) {
    console.error('Error clearing session:', error);
    // Force page reload as fallback
    window.location.reload();
  }
};

// Auto-fix authentication issues
export const autoFixAuthErrors = () => {
  // Listen for auth errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const errorMessage = args.join(' ');
    
    // Check for refresh token errors
    if (errorMessage.includes('Invalid Refresh Token') || 
        errorMessage.includes('Refresh Token Not Found')) {
      console.warn('🚨 Detected authentication error, clearing session...');
      clearCorruptedSession();
      return;
    }
    
    // Suppress common non-critical errors to reduce console noise
    if (errorMessage.includes('Error fetching users') ||
        errorMessage.includes('Studio views fetched successfully')) {
      // These are handled gracefully by the UI, no need to spam console
      return;
    }
    
    // Call original console.error
    originalConsoleError.apply(console, args);
  };
};

export default { clearCorruptedSession, autoFixAuthErrors }; 