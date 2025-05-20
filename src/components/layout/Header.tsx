import { Menu, Bell, User } from 'lucide-react';
import { useState } from 'react';
import { signOut, clearAuthStorage } from '../../services/auth';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    // First clear local auth storage, then attempt sign out
    // This ensures we clean up even if there's no active session
    clearAuthStorage();
    
    // Wait for the sign out process to complete
    const { error } = await signOut();
    if (error) {
      console.log('Non-critical error during sign out:', error);
      // Continue with navigation even if there was an error
    }
    
    // Navigate to login page
    navigate('/login');
  };
  
  return (
    <header className="z-10 border-b border-slate-200 bg-white sticky top-0">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center md:hidden">
          <button
            onClick={toggleSidebar}
            className="mobile-menu-button rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex items-center">
          <span className="text-xl font-semibold text-blue-600">ClarityHQ</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="mobile-menu-button rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
            >
              <User className="h-5 w-5" />
            </button>
            
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 text-sm text-slate-500">User Menu</div>
                <div className="border-t border-slate-100">
                  <button
                    onClick={handleSignOut}
                    className="block w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;