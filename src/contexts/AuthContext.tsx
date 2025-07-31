import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authRateLimiter } from '../lib/rateLimiter';
import type { Session } from '@supabase/supabase-js';
import { statePersistence } from '../lib/statePersistence';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  loading: boolean;
  rateLimitInfo: {
    remainingAttempts: number;
    resetTime: number;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Add simple debounce util at top-level (outside component)
function debounce(fn: (...args: any[]) => void, delay = 500) {
  let timer: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Helper to map Supabase session->User and update state only when changed
const mapSessionToUser = (session: Session | null): User | null => {
  if (!session?.user) {
    return null;
  }
  return {
    id: session.user.id,
    name: session.user.user_metadata?.name || '',
    email: session.user.email || '',
    role: session.user.user_metadata?.role || 'user',
    avatar: session.user.user_metadata?.avatar_url || undefined,
  };
};

// Enhanced session to user mapping that validates against database
const mapSessionToUserWithValidation = async (session: Session | null, fetchUserProfile: (id: string) => Promise<any>): Promise<User | null> => {
  if (!session?.user) {
    return null;
  }
  
  try {
    // Fetch user profile from database to validate approval status
    const profile = await fetchUserProfile(session.user.id);
    
    if (!profile || !profile.approved) {
      if (!import.meta.env.PROD) {
        console.warn('User session exists but profile not approved:', session.user.email);
      }
      return null;
    }
    
    return {
      id: session.user.id,
      name: profile.name || session.user.user_metadata?.name || '',
      email: session.user.email || '',
      role: profile.role || session.user.user_metadata?.role || 'user',
      avatar: session.user.user_metadata?.avatar_url || undefined,
    };
  } catch (error) {
    if (!import.meta.env.PROD) {
      console.error('Error validating user profile during session restoration:', error);
    }
    return null;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true); // Track if initial auth check is complete
  const [rateLimitInfo, setRateLimitInfo] = useState({
      remainingAttempts: 5,
      resetTime: Date.now() + 60000
  });

  // Enhanced user state setter with persistence
  const setUserWithPersistence = useCallback((newUser: User | null) => {
    setUser(newUser);
    
    try {
      // Save user state to persistence layer
      if (newUser) {
        statePersistence.saveState({
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            avatar: newUser.avatar
          }
        }, { key: 'urbanhub-auth-state', silent: true });
      } else {
        statePersistence.clearState('urbanhub-auth-state');
      }
    } catch (error) {
      if (!import.meta.env.PROD) {
        console.warn('Failed to persist user state:', error);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // First, try to restore user state from persistence
        try {
          const savedAuthState = statePersistence.loadState({ key: 'urbanhub-auth-state', silent: true });
          if (savedAuthState?.user && !statePersistence.isStateStale('urbanhub-auth-state')) {
            if (!import.meta.env.PROD) {
              console.log('🔄 Restoring user state from persistence:', savedAuthState.user);
            }
            setUser(savedAuthState.user);
            setLoading(false);
            setInitializing(false);
          }
        } catch (error) {
          if (!import.meta.env.PROD) {
            console.warn('Failed to restore user state from persistence:', error);
          }
        }

        // Then check for active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (!import.meta.env.PROD) {
            console.error('Error getting session:', sessionError);
          }
          if (mounted) {
            setUserWithPersistence(null);
            setLoading(false);
            setInitializing(false);
          }
          return;
        }
        
        if (session) {
          try {
            // Simple validation first - just check if user exists in database
            const profile = await fetchUserProfile(session.user.id);
            
            if (profile && profile.approved) {
              const user = {
                id: session.user.id,
                name: profile.name || session.user.user_metadata?.name || '',
                email: session.user.email || '',
                role: profile.role || 'user',
                avatar: session.user.user_metadata?.avatar_url || undefined,
              };
              
              if (mounted) {
                setUserWithPersistence(user);
                setLoading(false);
                setInitializing(false);
              }
            } else {
              if (!import.meta.env.PROD) {
                console.warn('User not approved or not found in database, clearing session...');
              }
              await supabase.auth.signOut();
              if (mounted) {
                setUserWithPersistence(null);
                setLoading(false);
                setInitializing(false);
              }
            }
          } catch (profileError) {
            if (!import.meta.env.PROD) {
              console.error('Error validating user profile:', profileError);
            }
            // Don't clear session for profile errors, just use basic session data
            const user = {
              id: session.user.id,
              name: session.user.user_metadata?.name || '',
              email: session.user.email || '',
              role: session.user.user_metadata?.role || 'user',
              avatar: session.user.user_metadata?.avatar_url || undefined,
            };
            
            if (mounted) {
              setUserWithPersistence(user);
              setLoading(false);
              setInitializing(false);
            }
          }
        } else {
          if (mounted) {
            setUserWithPersistence(null);
            setLoading(false);
            setInitializing(false);
          }
        }
      } catch (error) {
        if (!import.meta.env.PROD) {
          console.error('Auth initialization error:', error);
        }
        if (mounted) {
          setUserWithPersistence(null);
          setLoading(false);
          setInitializing(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          if (event === 'SIGNED_OUT') {
            setUserWithPersistence(null);
          } else {
            // For all other events, use simple mapping (don't re-validate on every change)
            setUserWithPersistence(mapSessionToUser(session));
          }
          setLoading(false);
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      if (error) {
        if (!import.meta.env.PROD) {
          console.error('Error fetching user profile:', error);
        }
        throw error;
      }
      return data;
    } catch (error) {
      if (!import.meta.env.PROD) {
        console.error('Failed to fetch user profile for ID:', userId, error);
      }
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    // Check rate limiting
    const rateLimitKey = `login:${email}`;
    if (!authRateLimiter.canMakeRequest(rateLimitKey)) {
      const remaining = authRateLimiter.getRemainingRequests(rateLimitKey);
      const resetTime = authRateLimiter.getResetTime(rateLimitKey);
      setRateLimitInfo({
        remainingAttempts: remaining,
        resetTime: resetTime
      });
      throw new Error(`Too many login attempts. Please try again later.`);
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        // Check if user is approved (no email confirmation required)
        const profile = await fetchUserProfile(data.user.id);
        if (!profile || !profile.approved) {
          setUser(null);
          throw new Error('Your account is pending admin approval. Please contact an administrator.');
        }
        setUserWithPersistence({
          id: data.user.id,
          name: profile.name || '',
          email: data.user.email || '',
          role: profile.role || '',
          avatar: data.user.user_metadata?.avatar_url || undefined,
        });
        
        // Reset rate limit on successful login
        authRateLimiter.clear(rateLimitKey);
        setRateLimitInfo({
          remainingAttempts: 5,
          resetTime: Date.now() + 60000
        });
      }
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: string) => {
    // Check rate limiting for signup
    const rateLimitKey = `signup:${email}`;
    if (!authRateLimiter.canMakeRequest(rateLimitKey)) {
      const remaining = authRateLimiter.getRemainingRequests(rateLimitKey);
      const resetTime = authRateLimiter.getResetTime(rateLimitKey);
      setRateLimitInfo({
        remainingAttempts: remaining,
        resetTime: resetTime
      });
      throw new Error(`Too many signup attempts. Please try again later.`);
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      });
      if (error) throw error;
      if (data.user) {
        // Insert into users table using upsert to handle duplicates
        await supabase.from('users').upsert([{ 
          id: data.user.id, 
          name, 
          email, 
          role,
          approved: true, // Auto-approve for now, can be changed to false for manual approval
          approved_at: new Date().toISOString()
        }], { onConflict: 'id' });
        setUserWithPersistence({
          id: data.user.id,
          name,
          email,
          role,
        });
        
        // Reset rate limit on successful signup
        authRateLimiter.clear(rateLimitKey);
        setRateLimitInfo({
          remainingAttempts: 5,
          resetTime: Date.now() + 60000
        });
      }
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        if (!import.meta.env.PROD) {
          console.error('Logout error:', error);
        }
      }
      setUserWithPersistence(null);
      // Clear all app state on logout
      statePersistence.clearAllState();
    } catch (error) {
      if (!import.meta.env.PROD) {
        console.error('Logout error:', error);
      }
      setUserWithPersistence(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) return;
    setLoading(true);
    try {
      // Update user metadata in Supabase
      const { data, error } = await supabase.auth.updateUser({
        data: userData,
      });
      if (error) throw error;
      // Also update the users table
      if (userData.name) {
        await supabase.from('users').update({ name: userData.name }).eq('id', user.id);
      }
      setUserWithPersistence({ ...user, ...userData });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateProfile,
    loading: loading || initializing, // Consider auth incomplete if still initializing
    rateLimitInfo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};