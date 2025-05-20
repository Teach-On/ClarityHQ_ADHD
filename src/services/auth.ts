import { supabase } from '../lib/supabase';
import type { User, AuthError, Provider } from '@supabase/supabase-js';
import { isValidUUID } from '../utils/validation';

export interface AuthResponse {
  user: User | null;
  error: AuthError | Error | null;
  errorCode?: string;
}

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    console.log('Attempting sign in for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Extract error code from Supabase error message or code
      let errorCode = error.code;
      if (error.message.includes('Invalid login credentials')) {
        errorCode = 'invalid_credentials';
      } else if (error.message.includes('Email not confirmed')) {
        errorCode = 'email_not_confirmed';
      }
      
      console.error('Sign in error:', errorCode, error.message);
      return { user: null, error, errorCode };
    }
    
    // Validate user ID if present
    if (data.user && !isValidUUID(data.user.id)) {
      console.warn('User has non-standard UUID format:', data.user.id);
      // We don't throw here, as this is a warning not an error
    }
    
    console.log('Sign in successful');
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Exception during sign in:', error);
    return { user: null, error: error as Error };
  }
};

export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    console.log('Initiating Google sign-in flow');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });

    if (error) throw error;
    console.log('Google auth redirect initiated');
    return { user: null, error: null }; // User will be null because of redirect
  } catch (error) {
    console.error('Error with Google sign-in:', error);
    return { user: null, error: error as Error };
  }
};

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    console.log('Attempting to sign up user:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    });

    if (error) throw error;
    
    // Validate user ID if present
    if (data.user && !isValidUUID(data.user.id)) {
      console.warn('User has non-standard UUID format:', data.user.id);
      // We don't throw here, as this is a warning not an error
    }
    
    console.log('Sign up successful, user created');
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error during sign up:', error);
    return { user: null, error: error as Error };
  }
};

export const resendConfirmationEmail = async (email: string): Promise<{ error: Error | null }> => {
  try {
    console.log('Resending confirmation email to:', email);
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    
    if (error) throw error;
    
    console.log('Confirmation email resent successfully');
    return { error: null };
  } catch (error) {
    console.error('Error resending confirmation email:', error);
    return { error: error as Error };
  }
};

export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    console.log('Signing out user');
    
    // Check if session exists before attempting to sign out
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.log('No active session found, skipping Supabase signOut call');
      // Clear local storage even if there's no session
      clearLocalStorage();
      return { error: null };
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear local storage after successful sign out
    clearLocalStorage();
    console.log('Sign out successful');
    return { error: null };
  } catch (error) {
    console.error('Error during sign out:', error);
    // Still clear local storage even if Supabase signOut fails
    clearLocalStorage();
    return { error: error as Error };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    console.log('Getting current user');
    
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    // Validate user ID if present
    if (data.user && data.user.id && !isValidUUID(data.user.id)) {
      console.warn('User has non-standard UUID format:', data.user.id);
      // We don't throw here because this could be a development environment
    }
    
    console.log('Current user retrieved:', !!data.user);
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const refreshSession = async (): Promise<{ success: boolean; error: Error | null }> => {
  try {
    console.log('Attempting to refresh session');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) throw error;
    
    console.log('Session refresh result:', !!data.session ? 'success' : 'no session');
    return { 
      success: !!data.session, 
      error: null 
    };
  } catch (error) {
    console.error('Error refreshing session:', error);
    return { 
      success: false, 
      error: error as Error 
    };
  }
};

// Helper function to clear local storage items
const clearLocalStorage = () => {
  console.log('Clearing local auth storage');
  
  // Clear Supabase auth data from localStorage
  localStorage.removeItem('sb-auth-token');
  localStorage.removeItem('supabase.auth.token');
  
  // Clear any application-specific auth data
  localStorage.removeItem('clarityhq-auth-storage');
  
  console.log('Local auth storage cleared');
};

export const clearAuthStorage = () => {
  console.log('Clearing auth storage');
  
  // Clear local storage first
  clearLocalStorage();
  
  // Attempt to sign out from Supabase, but handle errors gracefully
  try {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        supabase.auth.signOut().catch(err => {
          console.log('Error during force sign out, but continuing:', err);
        });
      } else {
        console.log('No active session to sign out from');
      }
    }).catch(err => {
      console.log('Error checking session, but continuing:', err);
    });
  } catch (err) {
    console.log('Exception during clearAuthStorage, but continuing:', err);
  }
  
  console.log('Auth storage cleared');
};