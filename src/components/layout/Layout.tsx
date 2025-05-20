import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNavigation from './MobileNavigation';
import InstallPrompt from './InstallPrompt';
import PullToRefresh from './PullToRefresh';
import { getCurrentUser } from '../../services/auth';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore';
import { testSupabaseConnection } from '../../lib/supabase';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { user } = useUserStore();
  
  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        console.log('Layout: No user in store, checking auth status');
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          console.log('Layout: No authenticated user, redirecting to login');
          navigate('/login');
        }
      }
    };
    
    checkAuth();
  }, [user, navigate]);

  // Check if app is installed
  useEffect(() => {
    // Check if the app is running in standalone mode or displays as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone || 
        document.referrer.includes('android-app://')) {
      setIsInstalled(true);
    }
  }, []);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // First check Supabase connection
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.error('Failed to connect to Supabase during refresh');
      }
      
      // Wait a minimum amount of time to show refresh indicator
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force refresh the page if we're having connection issues
      if (!isConnected) {
        window.location.reload();
        return;
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      
      {!isInstalled && <InstallPrompt />}
      
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <main className="flex-1 overflow-auto pb-16">
        <div className="px-4 py-4 md:px-6">
          <Outlet />
        </div>
      </main>
      
      <MobileNavigation />
    </div>
  );
};

export default Layout;