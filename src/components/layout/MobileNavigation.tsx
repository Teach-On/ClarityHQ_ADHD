import { NavLink } from 'react-router-dom';
import { Home, Timer, Settings } from 'lucide-react';

const MobileNavigation = () => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home className="h-6 w-6" /> },
    { to: '/focus', label: 'Focus', icon: <Timer className="h-6 w-6" /> },
    { to: '/settings', label: 'Settings', icon: <Settings className="h-6 w-6" /> },
  ];

  return (
    <div className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => 
            `bottom-nav-item ${isActive ? 'active' : ''}`
          }
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default MobileNavigation;