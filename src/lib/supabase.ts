import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// These variables should come from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.');
}

export const supabase = createClient<Database>(
  supabaseUrl || '',  // Provide fallbacks to prevent null errors
  supabaseAnonKey || '', 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'clarityhq-auth-storage',
    },
    global: {
      headers: {
        'x-client-info': 'clarityhq/0.1.0'
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Utility function to log RLS-related info for debugging
export const debugRLS = async () => {
  try {
    console.group('RLS Debug Info');
    
    // Check authentication state
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Authenticated:', !!sessionData.session);
    if (sessionData.session) {
      console.log('User ID:', sessionData.session.user.id);
    }
    
    // Test a basic query
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('count')
      .limit(1);
    
    console.log('Test query result:', testData ? 'Success' : 'Failed');
    if (testError) {
      console.error('Test query error:', testError);
    }
    
    console.groupEnd();
    
    return {
      authenticated: !!sessionData.session,
      userId: sessionData.session?.user.id,
      testQuerySuccess: !!testData
    };
  } catch (err) {
    console.error('Error in RLS debugging:', err);
    return { error: err };
  }
};

// Helper function to check if Supabase connection is working
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Supabase connection...');
    
    // First check if we have valid URL and key
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Cannot connect to Supabase: Missing URL or anonymous key in environment variables');
      return false;
    }
    
    // Basic connection test (doesn't require authentication)
    const { error: healthCheckError } = await supabase.from('user_preferences').select('count').limit(1).throwOnError();
    
    if (healthCheckError) {
      console.error('Supabase connection test failed with error:', healthCheckError);
      return false;
    }
    
    // If health check passes, verify session if available
    const { data: sessionData } = await supabase.auth.getSession();
    const hasValidSession = !!sessionData.session;
    
    console.log('Session check result:', hasValidSession ? 'Valid session found' : 'No valid session');
    
    console.log('Supabase connection test successful');
    return true;
  } catch (err) {
    console.error('Supabase connection test failed with exception:', err);
    return false;
  }
};

// Utility to help debug any Supabase-related issues
export const debugSupabaseSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return { 
        hasSession: false, 
        error: error.message
      };
    }
    
    // Check if token is about to expire and refresh if needed
    if (data.session) {
      const expiresAt = data.session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = expiresAt - now;
      
      console.log(`Session expires in ${timeLeft} seconds`);
      
      // If token expires in less than 5 minutes (300 seconds), refresh it
      if (timeLeft < 300) {
        console.log('Token expiring soon, refreshing...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Error refreshing token:', refreshError);
        } else {
          console.log('Token refreshed successfully');
        }
      }
    }
    
    return { 
      hasSession: !!data.session,
      sessionExpires: data.session?.expires_at,
      user: data.session?.user ? {
        id: data.session.user.id,
        email: data.session.user.email,
        hasMetadata: !!data.session.user.user_metadata
      } : null
    };
  } catch (err) {
    console.error('Exception getting session:', err);
    return { 
      hasSession: false, 
      error: err.message
    };
  }
};