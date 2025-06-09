import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client - in a real app, these would come from environment variables
const supabaseUrl = 'https://iquwsfyqcqyvklbptb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxdXdzZnlxY29kcXl2a2xicHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MTMzMzEsImV4cCI6MjA2MTI4OTMzMX0.MnZGYhf4poFzDRpDzaIXq8tEA97tUEkPkNigiDleK8g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface User {
  id: string;
  email: string;
  user_metadata?: {
    [key: string]: any;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  // Get the current session and user on mount
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data?.session) {
          const { data: userData } = await supabase.auth.getUser();
          setAuthState({
            user: userData.user as User,
            isLoading: false,
            error: null
          });
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        setAuthState({
          user: null,
          isLoading: false,
          error: error as Error
        });
      }
    };

    getSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const { data } = await supabase.auth.getUser();
          setAuthState({
            user: data.user as User,
            isLoading: false,
            error: null
          });
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            error: null
          });
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      setAuthState({
        user: data.user as User,
        isLoading: false,
        error: null
      });

      return data;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error
      }));
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setAuthState({
        user: null,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error
      }));
      throw error;
    }
  }, []);

  // Get the current auth token
  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  }, []);

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    signIn,
    signOut,
    getToken
  };
}
