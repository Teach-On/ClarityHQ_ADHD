import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, signUp, signInWithGoogle, resendConfirmationEmail, clearAuthStorage, refreshSession } from '../services/auth';
import { motion } from 'framer-motion';
import { Brain, Mail, RefreshCw, AlertTriangle, ExternalLink, Code } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { supabase } from '../lib/supabase';
import { isValidUUID } from '../utils/validation';
import ErrorMessage from '../components/common/ErrorMessage';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailResendSuccess, setEmailResendSuccess] = useState(false);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  const navigate = useNavigate();
  const { setUser, setPreferences } = useUserStore();
  
  // Check if running as installed PWA and handle recovery params
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone) {
      setIsPWA(true);
    }
    
    // Check URL params
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('recovery') === 'needed') {
      setError('Your session has expired or encountered an error. Please sign in again.');
      setRecoveryAttempted(true);
      
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    if (searchParams.get('debug') === 'true') {
      setDebugMode(true);
      // Clean up URL but keep debug parameter
      window.history.replaceState(null, '', window.location.pathname + '?debug=true');
    }
    
    // For stackblitz environment, pre-fill test credentials
    if (window.location.hostname.includes('stackblitz')) {
      setEmail('test@example.com');
      setPassword('password123');
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedsEmailConfirmation(false);
    setEmailResendSuccess(false);
    setIsLoading(true);
    
    try {
      // First clear any potentially corrupt auth state
      if (recoveryAttempted) {
        clearAuthStorage();
      }
      
      // Debug info
      if (debugMode) {
        console.log(`Attempting to ${isSignUp ? 'sign up' : 'sign in'} with:`, { 
          email, 
          passwordLength: password.length,
          host: window.location.hostname
        });
      }
      
      const { user, error, errorCode } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        // Handle specific error codes
        if (errorCode === 'invalid_credentials') {
          throw new Error('Invalid email or password. Please try again.');
        } else if (errorCode === 'email_not_confirmed') {
          setNeedsEmailConfirmation(true);
          throw new Error('Please check your email inbox and confirm your account before signing in.');
        } else {
          throw error;
        }
      }
      
      if (user) {
        if (debugMode) {
          console.log('Authentication successful, redirecting to dashboard');
        }
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendConfirmation = async () => {
    if (!email || isResendingEmail) return;
    
    setIsResendingEmail(true);
    try {
      const { error } = await resendConfirmationEmail(email);
      
      if (error) {
        throw error;
      }
      
      setEmailResendSuccess(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend confirmation email');
    } finally {
      setIsResendingEmail(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Clear any potentially corrupt auth state
      if (recoveryAttempted) {
        clearAuthStorage();
      }
      
      if (debugMode) {
        console.log('Initiating Google sign-in');
      }
      
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };
  
  const handleSessionRecovery = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (debugMode) {
        console.log('Attempting session recovery');
      }
      
      // First try to refresh the session
      const { success, error } = await refreshSession();
      
      if (success) {
        if (debugMode) {
          console.log('Session recovery successful');
        }
        // If refresh worked, redirect to dashboard
        navigate('/dashboard');
        return;
      }
      
      // If refresh failed, clear storage and ask user to sign in again
      clearAuthStorage();
      setError('Please sign in again to continue.');
      setRecoveryAttempted(true);
    } catch (err) {
      setError('Unable to recover your session. Please sign in again.');
      clearAuthStorage();
    } finally {
      setIsLoading(false);
    }
  };
  
  // For quick development testing - automatically fill email/password
  const fillTestCredentials = () => {
    setEmail('test@example.com');
    setPassword('password123');
  };
  
  // Development bypass login for testing
  const handleDevBypass = async () => {
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
      setIsLoading(true);
      
      // Create a mock user for testing with a valid UUID format
      const mockUser = {
        id: '12345678-1234-5678-1234-567812345678',
        email: 'dev@test.com',
        user_metadata: {
          full_name: 'Test User'
        }
      };
      
      // Set the mock user in the store
      setUser(mockUser);
      
      // Create mock preferences
      const mockPreferences = {
        id: '87654321-4321-8765-4321-876543210987',
        user_id: mockUser.id,
        theme: 'light',
        habit_reminders: true,
        task_view_mode: 'list',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setPreferences(mockPreferences);
      
      // Create a mock session in localStorage to maintain the session
      localStorage.setItem('clarityhq-auth-storage', JSON.stringify({
        access_token: 'mock-token-for-dev-testing',
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        user: mockUser
      }));
      
      console.log('DEV MODE: Using bypass login with mock user');
      
      setTimeout(() => {
        setIsLoading(false);
        navigate('/dashboard');
      }, 800);
    } else {
      setError('Test login is only available in development mode');
    }
  };
  
  // Developer tools section for debugging
  const renderDevTools = () => {
    if (!debugMode) return null;
    
    return (
      <div className="mt-8 rounded-md bg-slate-100 p-4 dark:bg-slate-800">
        <h3 className="mb-2 text-sm font-semibold">Debug Tools</h3>
        <div className="space-y-2">
          <button 
            onClick={clearAuthStorage}
            className="w-full rounded-md bg-slate-200 px-3 py-1.5 text-xs text-slate-800 dark:bg-slate-700 dark:text-slate-200"
          >
            Clear Auth Storage
          </button>
          <button 
            onClick={fillTestCredentials}
            className="w-full rounded-md bg-slate-200 px-3 py-1.5 text-xs text-slate-800 dark:bg-slate-700 dark:text-slate-200"
          >
            Fill Test Credentials
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="w-full rounded-md bg-slate-200 px-3 py-1.5 text-xs text-slate-800 dark:bg-slate-700 dark:text-slate-200"
          >
            Reload Page
          </button>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Environment: {import.meta.env.MODE}</span>
            <span>Host: {window.location.hostname}</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Show developer bypass option
  const renderDevBypass = () => {
    if (!(import.meta.env.DEV || import.meta.env.MODE === 'development')) return null;
    
    return (
      <div className="mt-4 rounded-md bg-amber-50 p-4 dark:bg-amber-900/20">
        <h3 className="flex items-center font-medium text-amber-800 dark:text-amber-300">
          <Code className="mr-2 h-5 w-5" />
          Development Mode
        </h3>
        <p className="mt-1 mb-3 text-sm text-amber-700 dark:text-amber-400">
          Skip authentication to test the app quickly
        </p>
        <button
          onClick={handleDevBypass}
          className="w-full rounded-md border border-amber-300 bg-amber-100 py-2 text-center text-sm font-medium text-amber-800 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-800/40 dark:text-amber-300 dark:hover:bg-amber-800/60"
        >
          Test App (Bypass Login)
        </button>
      </div>
    );
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-1 flex-col justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 justify-center">
              <Brain className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">ClarityHQ</h1>
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-white text-center">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 text-center">
              {isSignUp
                ? 'Already have an account? '
                : "Don't have an account? "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setNeedsEmailConfirmation(false);
                  setEmailResendSuccess(false);
                  if (debugMode) {
                    console.log(`Switched to ${!isSignUp ? 'sign up' : 'sign in'} mode`);
                  }
                }}
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus-visible:underline"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
          
          {error && (
            <ErrorMessage message={error} />
          )}
          
          {needsEmailConfirmation && (
            <div className="mb-4">
              <button
                onClick={handleResendConfirmation}
                disabled={isResendingEmail}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
              >
                {isResendingEmail ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-1" />
                    Sending...
                  </>
                ) : (
                  <>
                    Resend confirmation email
                  </>
                )}
              </button>
            </div>
          )}
          
          {recoveryAttempted && !needsEmailConfirmation && (
            <div className="mb-4">
              <button
                onClick={handleSessionRecovery}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
              >
                Try automatic recovery
              </button>
            </div>
          )}
          
          {emailResendSuccess && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300"
            >
              Confirmation email sent! Please check your inbox.
            </motion.div>
          )}
          
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
              </svg>
              Continue with Google
            </button>
            
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
              <span className="mx-4 flex-shrink text-sm text-slate-400 dark:text-slate-500">or</span>
              <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="mt-4 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-1 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input mt-1 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full inline-flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    {isSignUp ? 'Create account' : 'Sign in with email'}
                  </span>
                )}
              </button>
            </div>
          </form>
          
          {/* Development mode bypass login option */}
          {renderDevBypass()}
          
          {debugMode && (
            <div className="mt-8">
              <Link 
                to="/?debug=true" 
                className="text-xs text-slate-500 hover:text-slate-600 flex items-center justify-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Go to landing page (debug mode)
              </Link>
            </div>
          )}
          
          {/* Debug tools for development */}
          {renderDevTools()}
        </div>
      </div>
      
      {!isPWA && (
        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 md:hidden">
          <div className="text-center text-white">
            <p className="text-sm font-medium">For the best experience</p>
            <p className="text-lg font-bold">Add to Home Screen</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;