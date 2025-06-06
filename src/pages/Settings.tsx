import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();

  const [customIntention, setCustomIntention] = useState('');
  const [selectedTheme, setTheme] = useState<string>('light');
  const [showTasksState, setShowTasks] = useState<boolean>(true);
  const [showHabitsState, setShowHabits] = useState<boolean>(true);
  const [showCalendarState, setShowCalendar] = useState<boolean>(true);
  const [habitRemindersState, setHabitReminders] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleCheckbox = (key: string) => {
    switch (key) {
      case 'tasks':
        setShowTasks(prev => !prev);
        break;
      case 'habits':
        setShowHabits(prev => !prev);
        break;
      case 'calendar':
        setShowCalendar(prev => !prev);
        break;
      case 'reminders':
        setHabitReminders(prev => !prev);
        break;
      default:
        break;
    }
  };

  const handleComplete = () => {
    if (customIntention && !/^[\w\s]+$/.test(customIntention)) {
      alert('Please enter a valid intention (letters and spaces only).');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCompleted(true);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 text-slate-900 dark:text-white">
      <motion.div 
        className="max-w-3xl mx-auto space-y-6"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4 }}
      >
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Customize your experience</p>
        </header>

        <motion.section 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <label className="block font-medium">Choose Theme</label>
            <select
              className="w-full mt-1 p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
              value={selectedTheme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <label className="block font-medium">What do you want to see?</label>
            <div className="flex flex-col gap-2">
              <motion.label whileTap={{ scale: 0.95 }} className="flex items-center gap-2">
                <input type="checkbox" checked={showTasksState} onChange={() => handleCheckbox('tasks')} /> Show Tasks
              </motion.label>
              <motion.label whileTap={{ scale: 0.95 }} className="flex items-center gap-2">
                <input type="checkbox" checked={showHabitsState} onChange={() => handleCheckbox('habits')} /> Show Habits
              </motion.label>
              <motion.label whileTap={{ scale: 0.95 }} className="flex items-center gap-2">
                <input type="checkbox" checked={showCalendarState} onChange={() => handleCheckbox('calendar')} /> Show Calendar
              </motion.label>
              <motion.label whileTap={{ scale: 0.95 }} className="flex items-center gap-2">
                <input type="checkbox" checked={habitRemindersState} onChange={() => handleCheckbox('reminders')} /> Habit Reminders
              </motion.label>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <label className="block font-medium">Add Custom Intention (optional)</label>
            <input
              type="text"
              className="w-full mt-1 p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
              value={customIntention}
              onChange={(e) => setCustomIntention(e.target.value)}
              placeholder="e.g., Meditate daily"
            />
            {customIntention && !/^[\w\s]+$/.test(customIntention) && (
              <p className="mt-1 text-sm text-red-500">Only letters and spaces are allowed.</p>
            )}
          </motion.div>
        </motion.section>

        <motion.div 
          className="pt-4" 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className={`btn btn-primary flex items-center justify-center transition-transform hover:scale-105 focus:ring-2 focus:ring-blue-400 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </motion.div>

        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 p-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
            >
              Settings saved! Redirecting...
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
};

export default Settings;
