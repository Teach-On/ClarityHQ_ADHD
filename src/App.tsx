import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from './components/layout/Layout';
import { supabase, testSupabaseConnection, checkSupabaseEnv } from './lib/supabase';
import { useUserStore } from './stores/userStore';
import LoadingScreen from './components/common/LoadingScreen';

const GoalCompleteConfetti = lazy(() => import('./components/common/GoalCompleteConfetti'));
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Focus = lazy(() => import('./pages/Focus'));
const Settings = lazy(() => import('./pages/Settings'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
  </div>
);

const isValidUUID = (uuid: string): boolean => {
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') return true;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

function App() {
  const navigate = useNavigate();
  const { setUser, setPreferences, isAuthenticated, isLoading, setIsLoading, resetState } = useUserStore();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionErrorDetails, setConnectionErrorDetails] = useState<string>('');

  useEffect(() => {
    async function initializeAuth() {
      console.log('App: Initializing auth...');
      setIsLoading(true);

      const envCheck = checkSupabaseEnv();
      if (!envCheck.isValid) {
        console.error('App:', envCheck.message);
        setConnectionError(true);
        setConnectionErrorDetails(envCheck.message);
        setIsLoading(false);
        return;
      }

      // Test connection but don't fail the app if it fails
      // The Supabase client might still work for auth operations
      try {
        const isConnected = await testSupabaseConnection();
        if (!isConnected) {
          console.warn('Initial connection test failed, but continuing with auth initialization...');
          console.warn('The Supabase client may still work for authentication.');
          // Don't set connectionError here - continue with auth flow
        } else {
          console.log('✅ Supabase connection test passed');
        }
      } catch (error: unknown) {
        console.warn('Connection test threw an error, but continuing with auth initialization:', error);
        // Don't fail the app here - the actual auth operations might still work
      }

      const timeoutId = setTimeout(() => {
        console.log('App: Loading timeout reached');
        setLoadingTimeout(true);
      }, 15000); // Increased timeout to 15 seconds

      try {
        // Try to get initial session
        console.log('App: Getting initial session...');
        const { data: initialSession, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('App: Error getting initial session:', sessionError);
          setConnectionError(true);
          setConnectionErrorDetails(`Authentication error: ${sessionError.message}`);
          setIsLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        if (initialSession?.session?.user) {
          console.log('App: Initial session found');
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
              if (!isValidUUID(session.user.id)) {
                console.warn('App: User ID from session is not a valid UUID format, but continuing in development mode.');
              }
              setUser(session.user);

              try {
                console.log('App: Fetching user preferences');
                const { data: userPreferences, error } = await supabase
                  .from('user_preferences')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .maybeSingle();

                if (error) {
                  console.error('App: Error fetching user preferences:', error);
                  // Don't fail the app for preference errors - user can still use basic functionality
                  setHasCompletedOnboarding(false);
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
              } catch (error: unknown) {
                if (error instanceof Error) {
                  console.error('App: Error in preferences fetch try/catch:', error.message);
                } else {
                  console.error('App: Unknown error in preferences fetch');
                }
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
      } catch (error: unknown) {
        console.error('App: Error in auth initialization:', error);
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch')) {
            setConnectionErrorDetails('Network error: Unable to connect to Supabase. Please check your internet connection and try again.');
          } else {
            setConnectionErrorDetails(`Authentication error: ${error.message}`);
          }
        } else {
          setConnectionErrorDetails('Authentication error: Unknown error occurred');
        }
        setConnectionError(true);
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    }

    initializeAuth();
  }, [retryCount, setUser, setPreferences, setIsLoading, resetState, navigate]);

  const handleReset = () => {
    console.log('App: Performing hard reset');
    clearAuthStorage();
    resetState();
    setLoadingTimeout(false);
    setConnectionError(false);
    setConnectionErrorDetails('');
    navigate('/');
  };

  const handleRetry = () => {
    console.log('App: Retrying connection');
    setLoadingTimeout(false);
    setConnectionError(false);
    setConnectionErrorDetails('');
    setRetryCount(prev => prev + 1);
  };

  const clearAuthStorage = () => {
    import('./services/auth').then(({ clearAuthStorage }) => {
      clearAuthStorage();
    }).catch(err => {
      console.error('Failed to import clearAuthStorage:', err);
    });
  };

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
            ? <Onboarding 
                theme="light"
                habitReminders={true}
                showTasks={true}
                showHabits={true}
                showCalendar={true}
              />
            : <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } />
        <Route path="/" element={
          isAuthenticated 
            ? (hasCompletedOnboarding === false ? <Navigate to="/onboarding" replace /> : <Layout />)
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