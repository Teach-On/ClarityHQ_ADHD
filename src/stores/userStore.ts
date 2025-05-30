import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

type UserPreferences = Database['public']['Tables']['user_preferences']['Row'] | null;

interface UserState {
  user: User | null;
  preferences: UserPreferences;
  isLoading: boolean;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  lastActivity: number;
  setUser: (user: User | null) => void;
  setPreferences: (preferences: UserPreferences) => void;
  setIsLoading: (isLoading: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  updateLastActivity: () => void;
  resetState: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  preferences: null,
  isLoading: true,
  isAuthenticated: false,
  theme: 'light',
  lastActivity: Date.now(),
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    lastActivity: Date.now()
  }),
  
  setPreferences: (preferences) => {
    // Only update theme if preferences actually contain theme data
    if (preferences && preferences.theme) {
      set({ 
        preferences,
        theme: preferences.theme as 'light' | 'dark',
        lastActivity: Date.now()
      });
      
      // Set the theme in the DOM
      if (preferences.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      set({ 
        preferences,
        lastActivity: Date.now() 
      });
    }
  },
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setTheme: (theme) => {
    set({ theme, lastActivity: Date.now() });
    
    // Set the theme in the DOM
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  
  updateLastActivity: () => set({ lastActivity: Date.now() }),
  
  resetState: () => set({
    user: null,
    preferences: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

// Track user activity to detect idle sessions
if (typeof window !== 'undefined') {
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  
  activityEvents.forEach(event => {
    window.addEventListener(event, () => {
      useUserStore.getState().updateLastActivity();
    }, { passive: true });
  });
}