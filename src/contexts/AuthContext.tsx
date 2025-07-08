import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authRateLimiter } from '../lib/rateLimiter';

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateLimitInfo, setRateLimitInfo] = useState({
    remainingAttempts: 5,
    resetTime: Date.now() + 60000
  });

  useEffect(() => {
    // Initialize auth state with Supabase session
    const initAuth = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        // Fetch user profile from your users table if needed
        setUser({
          id: data.user.id,
          name: data.user.user_metadata?.name || '',
          email: data.user.email || '',
          role: data.user.user_metadata?.role || '',
          avatar: data.user.user_metadata?.avatar_url || undefined,
        });
        } else {
        setUser(null);
        }
        setLoading(false);
    };
    initAuth();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || '',
          email: session.user.email || '',
          role: session.user.user_metadata?.role || '',
          avatar: session.user.user_metadata?.avatar_url || undefined,
        });
      } else {
        setUser(null);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
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
        if (!data.user.confirmed_at) {
          setUser(null);
          throw new Error('Please verify your email before logging in.');
        }
        const profile = await fetchUserProfile(data.user.id);
        setUser({
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
        // Insert into profiles table using upsert to handle duplicates
        await supabase.from('profiles').upsert([{ id: data.user.id, name, email, role }], { onConflict: 'id' });
        setUser({
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
      await supabase.auth.signOut();
      setUser(null);
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
      // Also update the profiles table
      if (userData.name) {
        await supabase.from('profiles').update({ name: userData.name }).eq('id', user.id);
      }
      setUser({ ...user, ...userData });
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
    loading,
    rateLimitInfo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
