import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Sun, Volume2, Eye, Calendar, ListTodo, CreditCard } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { updateUserPreferences } from '../services/preferences';
import SubscriptionManagement from '../components/settings/SubscriptionManagement';
import StreakTracker from '../components/pro/StreakTracker';
import CustomReminders from '../components/pro/CustomReminders';
import TaskBreakdown from '../components/pro/TaskBreakdown';
import AudioRecap from '../components/pro/AudioRecap';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { getSubscription } from '../services/subscription';

const Settings = () => {
  const { user, preferences, setPreferences } = useUserStore();
  const { setSubscription, isProUser } = useSubscriptionStore();
  
  const [theme, setTheme] = useState(preferences?.theme || 'light');
  const [habitReminders, setHabitReminders] = useState(preferences?.habit_reminders ?? true);
  const [taskViewMode, setTaskViewMode] = useState(preferences?.task_view_mode || 'list');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'general' | 'subscription' | 'pro'>('general');
  
  useEffect(() => {
    if (preferences) {
      setTheme(preferences.theme);
      setHabitReminders(preferences.habit_reminders);
      setTaskViewMode(preferences.task_view_mode);
    }
    
    // Fetch subscription status only if user is authenticated
    const fetchSubscription = async () => {
      if (!user) {
        console.log('User not authenticated, skipping subscription fetch');
        return;
      }
      
      try {
        const { data, error } = await getSubscription();
        
        if (error) throw error;
        
        setSubscription(data);
      } catch (err) {
        console.error('Error fetching subscription:', err);
      }
    };
    
    if (user) {
      fetchSubscription();
    }
  }, [preferences, user, setSubscription]);
  
  const handleSave = async () => {
    if (!user || !preferences) {
      setSaveMessage('You must be logged in to save settings');
      return;
    }
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const { data, error } = await updateUserPreferences(preferences.id, {
        theme,
        habit_reminders: habitReminders,
        task_view_mode: taskViewMode,
      });
      
      if (error) throw error;
      
      if (data) {
        setPreferences(data);
        setSaveMessage('Settings saved successfully!');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSaveMessage(null);
        }, 3000);
      } else {
        // Handle case where no data is returned but no error either
        console.warn('No data returned from updateUserPreferences');
        setSaveMessage('Settings updated, but failed to retrieve updated data.');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Check if user is not authenticated
  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Please log in to access your settings.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Customize your experience.</p>
      </div>
      
      {/* Settings Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSection('general')}
            className={`py-4 text-sm font-medium ${
              activeSection === 'general'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-slate-500 hover:border-b-2 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveSection('subscription')}
            className={`py-4 text-sm font-medium ${
              activeSection === 'subscription'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-slate-500 hover:border-b-2 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Subscription
          </button>
          {isProUser && (
            <button
              onClick={() => setActiveSection('pro')}
              className={`py-4 text-sm font-medium ${
                activeSection === 'pro'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'text-slate-500 hover:border-b-2 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300'
              }`}
            >
              Pro Features
            </button>
          )}
        </nav>
      </div>
      
      {/* General Settings */}
      {activeSection === 'general' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="border-b border-slate-100 dark:border-slate-700 p-4">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">Appearance</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Customize how ClarityHQ looks.</p>
            </div>
            
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Dark Mode</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Switch between light and dark themes</p>
                  </div>
                </div>
                
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={theme === 'dark'}
                    onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 dark:bg-slate-700 dark:peer-focus:ring-blue-900/30"></div>
                </label>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-slate-900 dark:text-white">Task View Mode</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTaskViewMode('list')}
                    className={`flex flex-col items-center rounded-lg border p-3 ${
                      taskViewMode === 'list'
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ListTodo className="mb-2 h-5 w-5 text-slate-700 dark:text-slate-300" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">List</span>
                  </button>
                  
                  <button
                    onClick={() => setTaskViewMode('calendar')}
                    className={`flex flex-col items-center rounded-lg border p-3 ${
                      taskViewMode === 'calendar'
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Calendar className="mb-2 h-5 w-5 text-slate-700 dark:text-slate-300" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Calendar</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="border-b border-slate-100 dark:border-slate-700 p-4">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">Accessibility</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Make ClarityHQ work better for you.</p>
            </div>
            
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Reduced Motion</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Minimize animations and transitions</p>
                  </div>
                </div>
                
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={reducedMotion}
                    onChange={() => setReducedMotion(!reducedMotion)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 dark:bg-slate-700 dark:peer-focus:ring-blue-900/30"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <Volume2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Sound Effects</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Enable audio feedback and alerts</p>
                  </div>
                </div>
                
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={soundEnabled}
                    onChange={() => setSoundEnabled(!soundEnabled)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 dark:bg-slate-700 dark:peer-focus:ring-blue-900/30"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">Habit Reminders</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Receive reminders for your habits</p>
                  </div>
                </div>
                
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={habitReminders}
                    onChange={() => setHabitReminders(!habitReminders)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 dark:bg-slate-700 dark:peer-focus:ring-blue-900/30"></div>
                </label>
              </div>
            </div>
          </motion.div>
      
          <div className="flex items-center justify-end gap-4 md:col-span-2">
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-md px-4 py-2 text-sm ${
                  saveMessage.includes('Error') || saveMessage.includes('failed')
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                }`}
              >
                {saveMessage}
              </motion.div>
            )}
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
                  Saving...
                </span>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Subscription Management */}
      {activeSection === 'subscription' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
            <CreditCard className="mr-2 inline-block h-6 w-6" />
            Subscription Management
          </h2>
          <SubscriptionManagement />
        </motion.div>
      )}
      
      {/* Pro Features */}
      {activeSection === 'pro' && isProUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Pro Features</h2>
          
          <StreakTracker />
          <CustomReminders />
          <TaskBreakdown />
          <AudioRecap />
        </motion.div>
      )}
    </div>
  );
};

export default Settings;