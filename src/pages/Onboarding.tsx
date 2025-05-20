import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Moon, Sun, Check, ArrowRight, BrainCircuit, ListChecks, Bell, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { createUserPreferences } from '../services/preferences';
import { supabase } from '../lib/supabase';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, setPreferences } = useUserStore();
  
  // Onboarding state
  const [step, setStep] = useState(1);
  const [intentions, setIntentions] = useState<string[]>([]);
  const [customIntention, setCustomIntention] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showTasks, setShowTasks] = useState(true);
  const [showHabits, setShowHabits] = useState(true);
  const [showCalendar, setShowCalendar] = useState(true);
  const [habitReminders, setHabitReminders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleCheckbox = (value: string) => {
    setIntentions((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };
  
  const handleComplete = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // First check if preferences already exist
      const { data: existingPrefs, error: checkError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      let data;
      
      if (existingPrefs) {
        // Update existing preferences
        const { data: updatedData, error: updateError } = await supabase
          .from('user_preferences')
          .update({
            theme,
            habit_reminders: habitReminders,
            task_view_mode: 'list',
          })
          .eq('id', existingPrefs.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        data = updatedData;
      } else {
        // Create new preferences
        const { data: newData, error: createError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            theme,
            habit_reminders: habitReminders,
            task_view_mode: 'list',
          })
          .select()
          .single();
        
        if (createError) throw createError;
        data = newData;
      }
      
      // Update global state
      if (data) {
        setPreferences(data);
      }
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      setError(`Error saving preferences: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <motion.div 
        className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6 max-w-lg w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
            <motion.div 
              className="h-2 rounded-full bg-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        
        {/* Step 1: What would help you right now? */}
        {step === 1 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">What would help you right now?</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">We'll customize your experience based on your needs</p>
            </div>
            
            <div className="space-y-3">
              {[
                'Stay on top of daily tasks',
                'Build consistent habits',
                'Plan my week visually',
                'Feel less overwhelmed',
              ].map((item) => (
                <motion.label 
                  key={item}
                  variants={item}
                  className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                      intentions.includes(item)
                        ? 'border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-400'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {intentions.includes(item) && <Check className="h-4 w-4" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={intentions.includes(item)}
                      onChange={() => handleCheckbox(item)}
                    />
                    <span className="text-slate-900 dark:text-white">{item}</span>
                  </div>
                </motion.label>
              ))}
              
              <div className="mt-4">
                <input 
                  type="text" 
                  placeholder="Or write your own..." 
                  className="w-full rounded-md border border-slate-300 p-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" 
                  value={customIntention}
                  onChange={(e) => setCustomIntention(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Step 2: Set up your flow */}
        {step === 2 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Set up your flow</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Customize how ClarityHQ works for you</p>
            </div>
            
            <motion.div variants={item} className="space-y-5">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <h3 className="mb-3 font-medium text-slate-900 dark:text-white">Theme Preference</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 rounded-lg ${
                      theme === 'light'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    } p-3 text-center flex flex-col items-center`}
                  >
                    <Sun className="mb-2 h-6 w-6" />
                    Light
                  </button>
                  
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 rounded-lg ${
                      theme === 'dark'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    } p-3 text-center flex flex-col items-center`}
                  >
                    <Moon className="mb-2 h-6 w-6" />
                    Dark
                  </button>
                </div>
              </div>
              
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <h3 className="mb-3 font-medium text-slate-900 dark:text-white">Dashboard View</h3>
                <div className="space-y-3">
                  <label className="flex items-center rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                    <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                      showTasks
                        ? 'border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-400'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {showTasks && <Check className="h-4 w-4" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={showTasks}
                      onChange={() => setShowTasks(!showTasks)}
                    />
                    <div>
                      <span className="flex items-center text-slate-900 dark:text-white">
                        <ListChecks className="mr-2 h-5 w-5 text-blue-500" />
                        Show tasks
                      </span>
                    </div>
                  </label>
                  
                  <label className="flex items-center rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                    <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                      showHabits
                        ? 'border-teal-500 bg-teal-500 text-white dark:border-teal-400 dark:bg-teal-400'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {showHabits && <Check className="h-4 w-4" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={showHabits}
                      onChange={() => setShowHabits(!showHabits)}
                    />
                    <div>
                      <span className="flex items-center text-slate-900 dark:text-white">
                        <BrainCircuit className="mr-2 h-5 w-5 text-teal-500" />
                        Show habits
                      </span>
                    </div>
                  </label>
                  
                  <label className="flex items-center rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                    <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                      showCalendar
                        ? 'border-purple-500 bg-purple-500 text-white dark:border-purple-400 dark:bg-purple-400'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {showCalendar && <Check className="h-4 w-4" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={showCalendar}
                      onChange={() => setShowCalendar(!showCalendar)}
                    />
                    <div>
                      <span className="flex items-center text-slate-900 dark:text-white">
                        <Calendar className="mr-2 h-5 w-5 text-purple-500" />
                        Show calendar
                      </span>
                    </div>
                  </label>
                  
                  <label className="flex items-center rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                    <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                      habitReminders
                        ? 'border-amber-500 bg-amber-500 text-white dark:border-amber-400 dark:bg-amber-400'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {habitReminders && <Check className="h-4 w-4" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={habitReminders}
                      onChange={() => setHabitReminders(!habitReminders)}
                    />
                    <div>
                      <span className="flex items-center text-slate-900 dark:text-white">
                        <Bell className="mr-2 h-5 w-5 text-amber-500" />
                        Enable reminders
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Step 3: All set */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <Check className="h-8 w-8" />
            </div>
            
            <h2 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">You're all set! 🎉</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-2">
              Welcome to ClarityHQ. Remember, it's your space to focus — not to be perfect.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You can always adjust these settings later.
            </p>
          </motion.div>
        )}
        
        <div className="mt-6 flex justify-between">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)} 
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              disabled={isSubmitting}
            >
              Back
            </button>
          ) : (
            <span />
          )}
          
          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)} 
              className="btn btn-primary flex items-center"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={handleComplete} 
              disabled={isSubmitting}
              className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70"
            >
              {isSubmitting ? (
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
                "Get Started"
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;