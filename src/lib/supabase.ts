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
        console.error('⚠️ URL does not appear to be a valid Supabase URL:', correctedUrl);
        console.log('💡 Expected format: https://your-project-id.supabase.co');
        return false;
      }
    } catch (urlError) {
      console.error('❌ Invalid Supabase URL format:', urlError);
      console.error('Expected format: https://your-project-id.supabase.co');
      console.error('Received:', correctedUrl);
      return false;
    }
    
    // Test direct URL accessibility
    console.log('🌍 Testing direct URL access...');
    try {
      const directResponse = await fetch(correctedUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });
      console.log('📡 Direct URL response status:', directResponse.status);
      
      if (!directResponse.ok) {
        console.error('❌ Direct URL access failed with status:', directResponse.status);
        if (directResponse.status === 404) {
          console.warn('💡 This might indicate:');
          console.warn('   1. The Supabase project does not exist');
          console.warn('   2. The project URL is incorrect');
          console.warn('   3. The project has been deleted');
        }
        return false;
      }
    } catch (directError) {
      console.error('❌ Direct URL test failed:', directError);
      console.warn('💡 This might indicate:');
      console.warn('   1. Network connectivity issues');
      console.warn('   2. Firewall blocking the connection');
      console.warn('   3. Supabase project is paused or disabled');
      console.warn('   4. DNS resolution issues');
      return false;
    }
    
    // Test Supabase API endpoint
    console.log('🔌 Testing Supabase API endpoint...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Test the REST API endpoint
      const apiResponse = await fetch(`${correctedUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('📊 API endpoint response status:', apiResponse.status);
      
      if (!apiResponse.ok) {
        console.error('❌ API endpoint failed with status:', apiResponse.status);
        if (apiResponse.status === 401) {
          console.warn('💡 This indicates an invalid or expired API key');
        } else if (apiResponse.status === 403) {
          console.warn('💡 This indicates insufficient permissions or project issues');
        }
        return false;
      }
      
      console.log('✅ Supabase API endpoint is accessible');
      
    } catch (apiError) {
      console.error('❌ Supabase API test failed:', apiError);
      
      if (apiError.name === 'AbortError') {
        console.warn('💡 Connection timed out - check your network and Supabase project status');
      } else {
        console.warn('💡 API connection failed - check your API key and project status');
      }
      return false;
    }
    
    // Test a simple query
    console.log('📝 Testing database query...');
    try {
      const { error: healthCheckError } = await supabase.from('user_preferences')
        .select('count')
        .limit(1);
      
      if (healthCheckError) {
        console.error('❌ Database query failed:', healthCheckError);
        console.warn('💡 This might indicate:');
        console.warn('   1. Database tables are not set up');
        console.warn('   2. RLS policies are too restrictive');
        console.warn('   3. API key lacks necessary permissions');
        return false;
      }
      
      console.log('✅ Database query successful');
      
    } catch (queryError) {
      console.error('❌ Database query test failed:', queryError);
      return false;
    }
    
    // Final verification
    const { data: sessionData } = await supabase.auth.getSession();
    const hasValidSession = !!sessionData.session;
    
    console.log('🔐 Session check result:', hasValidSession ? 'Valid session found' : 'No valid session (normal for logged out users)');
    console.log('✅ Supabase connection test PASSED');
    
    return true;
    
  } catch (error) {
    console.error('💥 Supabase connection test failed with exception:', error);
    console.warn('💡 Please check:');
    console.warn('   1. Your internet connection');
    console.warn('   2. Supabase project status in dashboard');
    console.warn('   3. .env file configuration');
    console.warn('   4. Firewall/proxy settings');
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