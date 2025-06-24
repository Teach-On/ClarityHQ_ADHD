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
    console.log('🔍 Testing Supabase connection...');
    console.log('📍 Environment check:');
    console.log('  - URL from env:', import.meta.env.VITE_SUPABASE_URL);
    console.log('  - URL corrected:', correctedUrl);
    console.log('  - Key exists:', !!supabaseAnonKey);
    console.log('  - Key preview:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'missing');
    
    // First check if we have valid URL and key
    if (!correctedUrl || !supabaseAnonKey) {
      console.error('❌ Cannot connect to Supabase: Missing URL or anonymous key in environment variables');
      console.error('VITE_SUPABASE_URL:', correctedUrl || 'missing');
      console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'present' : 'missing');
      return false;
    }
    
    // Validate URL format
    try {
      const urlObj = new URL(correctedUrl);
      console.log('🌐 URL validation passed:', urlObj.href);
      if (!urlObj.hostname.includes('supabase.co')) {
        console.warn('⚠️ URL does not appear to be a valid Supabase URL:', correctedUrl);
        console.log('💡 Expected format: https://your-project-id.supabase.co');
        // Don't return false here, continue with connection test
      }
    } catch (urlError) {
      console.error('❌ Invalid Supabase URL format:', urlError);
      console.error('Expected format: https://your-project-id.supabase.co');
      console.error('Received:', correctedUrl);
      return false;
    }
    
    // Test Supabase API endpoint directly (skip the HEAD request to avoid CORS issues)
    console.log('🔌 Testing Supabase API endpoint...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced timeout to 8 seconds
      
      // Test the REST API endpoint with a simple query
      const { error: healthCheckError } = await supabase
        .from('user_preferences')
        .select('count')
        .limit(1)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (healthCheckError) {
        console.warn('⚠️ Database query returned error (this may be normal for logged out users):', healthCheckError);
        // Don't fail the connection test for RLS errors when user is not authenticated
        if (healthCheckError.code === 'PGRST116' || healthCheckError.message?.includes('RLS')) {
          console.log('✅ Connection successful (RLS preventing query is expected when not authenticated)');
          return true;
        }
        console.error('❌ Database connection failed:', healthCheckError);
        return false;
      }
      
      console.log('✅ Database query successful');
      
    } catch (apiError: any) {
      console.error('❌ Supabase API test failed:', apiError);
      
      if (apiError.name === 'AbortError') {
        console.warn('💡 Connection timed out - check your network and Supabase project status');
        return false;
      } else if (apiError.message?.includes('Failed to fetch')) {
        console.warn('💡 Network error - this might be a temporary issue');
        console.warn('   Possible causes:');
        console.warn('   1. Network connectivity issues');
        console.warn('   2. Supabase project is paused');
        console.warn('   3. Firewall blocking the connection');
        console.warn('   4. CORS configuration issues');
        return false;
      } else {
        console.warn('💡 API connection failed - check your API key and project status');
        return false;
      }
    }
    
    // Final verification - check if we can get session (this won't fail even if no user is logged in)
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('⚠️ Session check warning:', sessionError);
        // Don't fail the connection test for session errors
      } else {
        const hasValidSession = !!sessionData.session;
        console.log('🔐 Session check result:', hasValidSession ? 'Valid session found' : 'No valid session (normal for logged out users)');
      }
    } catch (sessionError) {
      console.warn('⚠️ Session check failed:', sessionError);
      // Don't fail the connection test for session errors
    }
    
    console.log('✅ Supabase connection test PASSED');
    return true;
    
  } catch (error: any) {
    console.error('💥 Supabase connection test failed with exception:', error);
    
    // Provide more specific error guidance
    if (error.message?.includes('Failed to fetch')) {
      console.warn('💡 Network fetch error detected. This usually indicates:');
      console.warn('   1. The Supabase project is paused or deleted');
      console.warn('   2. Network connectivity issues');
      console.warn('   3. Firewall/proxy blocking the connection');
    } else {
      console.warn('💡 Please check:');
      console.warn('   1. Your internet connection');
      console.warn('   2. Supabase project status in dashboard');
      console.warn('   3. .env file configuration');
      console.warn('   4. Firewall/proxy settings');
    }
    
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
  } catch (err: any) {
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