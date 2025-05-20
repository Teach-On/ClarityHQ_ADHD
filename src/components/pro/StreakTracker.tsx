import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame, PenSquare, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useUserStore } from '../../stores/userStore';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { getHabitsWithCompletions } from '../../services/habits';
import TextareaAutosize from 'react-textarea-autosize';

const StreakTracker = () => {
  const { user } = useUserStore();
  const { isProUser } = useSubscriptionStore();
  const [habits, setHabits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [showReflection, setShowReflection] = useState(false);
  
  useEffect(() => {
    const fetchHabits = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await getHabitsWithCompletions(user.id);
        
        if (error) throw error;
        
        if (data) {
          // Process data to add streak calculations
          const processedHabits = data.map(habit => {
            // Sort completions by date, newest first
            const sortedCompletions = [...habit.completions].sort((a, b) => 
              new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
            );
            
            // Calculate current streak
            let streak = 0;
            let currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            
            // Check if completed today
            const completedToday = sortedCompletions.some(completion => {
              const completionDate = new Date(completion.completed_at);
              completionDate.setHours(0, 0, 0, 0);
              return completionDate.getTime() === currentDate.getTime();
            });
            
            if (completedToday) {
              streak = 1;
              
              // Check for consecutive days before today
              let checkDate = new Date(currentDate);
              checkDate.setDate(checkDate.getDate() - 1);
              
              let streakBroken = false;
              while (!streakBroken) {
                const hasCompletion = sortedCompletions.some(completion => {
                  const completionDate = new Date(completion.completed_at);
                  completionDate.setHours(0, 0, 0, 0);
                  return completionDate.getTime() === checkDate.getTime();
                });
                
                if (hasCompletion) {
                  streak++;
                  checkDate.setDate(checkDate.getDate() - 1);
                } else {
                  streakBroken = true;
                }
              }
            }
            
            return {
              ...habit,
              streak
            };
          });
          
          setHabits(processedHabits);
        }
      } catch (err) {
        console.error('Error fetching habits:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isProUser) {
      fetchHabits();
    }
  }, [user, isProUser]);
  
  const handleReflectionSave = () => {
    // In a real app, you'd save this reflection to Supabase
    // For now, we'll just close the reflection modal
    setShowReflection(false);
    setReflection('');
  };
  
  if (!isProUser) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <h3 className="flex items-center font-medium text-amber-800 dark:text-amber-300">
          <Flame className="mr-2 h-5 w-5" />
          Streak Tracker
        </h3>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
          Track your habit streaks and journal your progress with ClarityHQ Pro.
        </p>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center font-medium text-blue-700 dark:text-blue-300">
          <Flame className="mr-2 h-5 w-5" />
          Habit Streaks
        </h3>
        <button className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
          View All
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24">
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
        </div>
      ) : habits.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-blue-700 dark:text-blue-300">
            You haven't created any habits yet.
          </p>
          <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
            Add habits to start tracking your streaks!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-slate-800"
            >
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">{habit.title}</h4>
                <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="mr-1 h-3 w-3" />
                  {habit.frequency}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <Flame className="mr-1 h-3.5 w-3.5" />
                  {habit.streak} {habit.streak === 1 ? 'day' : 'days'}
                </div>
                
                <button
                  onClick={() => {
                    setSelectedHabit(habit.id);
                    setShowReflection(true);
                  }}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  aria-label="Add reflection"
                >
                  <PenSquare className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Reflection Modal */}
      {showReflection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Journal Your Progress</h3>
              <button
                onClick={() => setShowReflection(false)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Record your thoughts about this habit. What's working well? What could be improved?
              </p>
            </div>
            
            <div className="mb-4">
              <TextareaAutosize
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Write your reflection here..."
                className="w-full rounded-md border border-slate-300 bg-white p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                minRows={4}
                maxRows={8}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReflection(false)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleReflectionSave}
                className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Save Reflection
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StreakTracker;