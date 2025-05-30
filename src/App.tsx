import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from './components/layout/Layout';
import { supabase, testSupabaseConnection, checkSupabaseEnv } from './lib/supabase';
import { useUserStore } from './stores/userStore';
import LoadingScreen from './components/common/LoadingScreen';

// Lazy load components with heavier dependencies
const GoalCompleteConfetti = lazy(() => import('./components/common/GoalCompleteConfetti'));

// Lazy load all pages for better code splitting
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Focus = lazy(() => import('./pages/Focus'));
const Settings = lazy(() => import('./pages/Settings'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

// Fallback loading component
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
  </div>
);

// Utility function to validate UUID format - simplified version to prevent validation errors
const isValidUUID = (uuid: string): boolean => {
  // In development mode, be more permissive
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    return true;
  }
  
  // In production, use strict validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

function App() {
  const navigate = useNavigate();
  const { user, setUser, preferences, setPreferences, isAuthenticated, isLoading, setIsLoading, resetState } = useUserStore();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionErrorDetails, setConnectionErrorDetails] = useState<string>('');

  useEffect(() => {
    async function initializeAuth() {
      console.log('App: Initializing auth...');
      setIsLoading(true);
      
      // Check environment variables before attempting connection
      const envCheck = checkSupabaseEnv();
      if (!envCheck.isValid) {
        console.error('App:', envCheck.message);
        setConnectionError(true);
        setConnectionErrorDetails(envCheck.message);
        setIsLoading(false);
        return;
      }
      
      // First test the Supabase connection
      try {
        const isConnected = await testSupabaseConnection();
        if (!isConnected) {
          console.error('Failed to connect to Supabase');
          setConnectionError(true);
          setConnectionErrorDetails('Unable to connect to Supabase. Check your credentials and network connection.');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error testing Supabase connection:', error);
        setConnectionError(true);
        setConnectionErrorDetails(`Network error when connecting to Supabase: ${error.message || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }
      
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('App: Loading timeout reached');
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout
      
      try {
        // Get initial session
        const { data: initialSession } = await supabase.auth.getSession();
        
        // If we have a session initially, set the user
        if (initialSession?.session?.user) {
          console.log('App: Initial session found');
          
          // In development, we want to be more permissive with UUID validation
          if (!isValidUUID(initialSession.session.user.id)) {
            console.warn('App: User ID is not a valid UUID format, but continuing in development mode.');
          }
          
          setUser(initialSession.session.user);
        } else {
          console.log('App: No initial session found');
          resetState();
          clearTimeout(timeoutId);
          setIsLoading(false);
          return;
        }
        
        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('App: Auth state changed:', event);
            
            if (event === 'SIGNED_OUT') {
              console.log('App: User signed out');
              resetState();
              setIsLoading(false);
              clearTimeout(timeoutId);
              return;
            }
            
            if (session?.user) {
              console.log('App: Setting user from session');
              
              // In development, we want to be more permissive with UUID validation
              if (!isValidUUID(session.user.id)) {
                console.warn('App: User ID from session is not a valid UUID format, but continuing in development mode.');
              }
              
              setUser(session.user);
              
              // Fetch user preferences
              try {
                console.log('App: Fetching user preferences');
                const { data: userPreferences, error } = await supabase
                  .from('user_preferences')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .maybeSingle();
                
                if (error) {
                  console.error('App: Error fetching user preferences:', error);
                  // Continue even if preferences fetch fails
                }
                
                if (userPreferences) {
                  console.log('App: User preferences found');
                  setPreferences(userPreferences);
                  setHasCompletedOnboarding(true);
                } else {
                  console.log('App: No user preferences found, needs onboarding');
                  setPreferences(null);
                  setHasCompletedOnboarding(false);
                }
              } catch (error) {
                console.error('App: Error in preferences fetch try/catch:', error);
                // Continue even if preferences fetch fails
                setHasCompletedOnboarding(false);
              }
            } else {
              console.log('App: No user in session, resetting state');
              resetState();
            }
            
            console.log('App: Auth initialization completed');
            setIsLoading(false);
            clearTimeout(timeoutId);
          }
        );
        
        return () => {
          console.log('App: Cleaning up auth subscription');
          subscription.unsubscribe();
          clearTimeout(timeoutId);
        };
      } catch (error) {
        console.error('App: Error in auth initialization:', error);
        setConnectionErrorDetails(`Authentication error: ${error.message || 'Unknown error'}`);
        setConnectionError(true);
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    }
    
    initializeAuth();
  }, [retryCount, setUser, setPreferences, setIsLoading, resetState]);
  
  const handleReset = () => {
    console.log('App: Performing hard reset');
    // Clear all auth data and state
    clearAuthStorage();
    resetState();
    setLoadingTimeout(false);
    setConnectionError(false);
    setConnectionErrorDetails('');
    
    // Redirect to landing page
    navigate('/');
  };
  
  const handleRetry = () => {
    console.log('App: Retrying connection');
    setLoadingTimeout(false);
    setConnectionError(false);
    setConnectionErrorDetails('');
    setRetryCount(prev => prev + 1);
  };
  
  // Import clearAuthStorage only when needed to avoid circular dependencies
  const clearAuthStorage = () => {
    import('./services/auth').then(({ clearAuthStorage }) => {
      clearAuthStorage();
    }).catch(err => {
      console.error('Failed to import clearAuthStorage:', err);
    });
  };
  
  // If loading takes too long, provide an escape route
  if (isLoading) {
    return (
      <div>
        <LoadingScreen />
        {(loadingTimeout || connectionError) && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 text-center shadow-lg dark:bg-slate-800">
            <p className="mb-2 text-slate-700 dark:text-slate-300">
              {connectionError 
                ? (connectionErrorDetails || "Unable to connect to the server. Please check your network connection and Supabase configuration.") 
                : "This is taking longer than expected"}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                Go to Landing Page
              </button>
              <button
                onClick={handleRetry}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/onboarding" element={
          isAuthenticated && hasCompletedOnboarding === false 
            ? <Onboarding /> 
            : <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } />
        <Route path="/" element={
          isAuthenticated 
            ? (hasCompletedOnboarding === false ? <Navigate to="/onboarding\" replace /> : <Layout />)
            : <Navigate to="/login" replace />
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="focus" element={<Focus />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Suspense fallback={null}>
        <GoalCompleteConfetti />
      </Suspense>
    </Suspense>
  );
}

export default App;