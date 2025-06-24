import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// These variables should come from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the environment variables are properly set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.');
}

// Auto-fix common URL format issues
const fixSupabaseUrl = (url: string): string => {
  if (!url) return '';
  
  // Remove any trailing slashes
  url = url.replace(/\/+$/, '');
  
  // Add https:// if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  
  return url;
};

const correctedUrl = fixSupabaseUrl(supabaseUrl || '');

export const supabase = createClient<Database>(
  correctedUrl,
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
    console.log('Using URL:', correctedUrl);
    
    // First check if we have valid URL and key
    if (!correctedUrl || !supabaseAnonKey) {
      console.error('Cannot connect to Supabase: Missing URL or anonymous key in environment variables');
      console.error('VITE_SUPABASE_URL:', correctedUrl || 'missing');
      console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'present' : 'missing');
      return false;
    }
    
    // Validate URL format
    try {
      const urlObj = new URL(correctedUrl);
      if (!urlObj.hostname.includes('supabase.co')) {
        console.error('URL does not appear to be a valid Supabase URL:', correctedUrl);
        return false;
      }
    } catch (urlError) {
      console.error('Invalid Supabase URL format:', urlError);
      console.error('Expected format: https://your-project-id.supabase.co');
      console.error('Received:', correctedUrl);
      return false;
    }
    
    try {
      // Test connection with a timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Basic connection test (doesn't require authentication)
      const { error: healthCheckError } = await supabase.from('user_preferences')
        .select('count')
        .limit(1)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (healthCheckError) {
        console.error('Supabase connection test failed with error:', healthCheckError);
        
        // Check for specific error types
        if (healthCheckError.message.includes('Failed to fetch')) {
          console.error('Network error: Unable to reach Supabase server');
          console.error('This could be due to:');
          console.error('1. Incorrect Supabase URL (missing https://)');
          console.error('2. Network connectivity issues');
          console.error('3. Supabase project is paused or disabled');
          console.error('4. Firewall blocking the connection');
        }
        
        return false;
      }
      
      // If health check passes, verify session if available
      const { data: sessionData } = await supabase.auth.getSession();
      const hasValidSession = !!sessionData.session;
      
      console.log('Session check result:', hasValidSession ? 'Valid session found' : 'No valid session');
      
      console.log('Supabase connection test successful');
      return true;
    } catch (fetchError) {
      // Handle fetch-specific errors more gracefully
      console.error('Supabase connection test failed: Network error');
      
      // Log more detailed error information for debugging
      if (fetchError.name === 'AbortError') {
        console.error('Connection timed out - check your network and Supabase URL');
      } else if (fetchError.cause && fetchError.cause.code === 'ECONNREFUSED') {
        console.error('Connection refused - verify your Supabase URL is correct and the service is running');
      } else if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        console.error('Network error or CORS issue - check your Supabase URL format and network connection');
        console.error('If the URL is missing https://, this will cause a "refused to connect" error');
        console.error('Make sure your .env file has: VITE_SUPABASE_URL=https://your-project.supabase.co');
      }
      
      console.log('Error details:', fetchError);
      return false;
    }
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

// Utility to check environment variables
export const checkSupabaseEnv = (): { isValid: boolean; message: string } => {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    return { 
      isValid: false, 
      message: 'Missing VITE_SUPABASE_URL in environment variables. Check your .env file.' 
    };
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { 
      isValid: false, 
      message: 'Missing VITE_SUPABASE_ANON_KEY in environment variables. Check your .env file.' 
    };
  }
  
  // Check for malformed URL
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  const fixedUrl = fixSupabaseUrl(rawUrl);
  
  try {
    new URL(fixedUrl);
  } catch (e) {
    return {
      isValid: false,
      message: `Invalid VITE_SUPABASE_URL format. Expected: https://your-project.supabase.co, got: ${rawUrl}`
    };
  }
  
  // Check if URL was auto-corrected
  if (rawUrl !== fixedUrl) {
    console.warn(`Auto-corrected Supabase URL from "${rawUrl}" to "${fixedUrl}"`);
    console.warn('Please update your .env file to use the correct format: https://your-project.supabase.co');
  }
  
  return { isValid: true, message: 'Supabase environment variables are valid' };
};