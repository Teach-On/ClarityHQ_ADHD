import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, ChevronDown, ChevronRight, Clock, Repeat, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { Database } from '../../types/supabase';
import { completeHabit, uncompleteHabit, deleteHabit } from '../../services/habits';

type Habit = Database['public']['Tables']['habits']['Row'];
type HabitCompletion = Database['public']['Tables']['habit_completions']['Row'];

interface HabitCardProps {
  habit: Habit & { completions?: HabitCompletion[] };
  onHabitUpdate: () => void;
  onHabitDelete: (habitId: string) => void;
  expanded?: boolean;
}

const frequencyLabels = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month'
};

const timeOfDayLabels = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  anytime: 'Anytime'
};

const HabitCard = ({ habit, onHabitUpdate, onHabitDelete, expanded = false }: HabitCardProps) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if habit is completed today
  const isCompletedToday = () => {
    if (!habit.completions || habit.completions.length === 0) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return habit.completions.some(completion => {
      const completionDate = new Date(completion.completed_at);
      completionDate.setHours(0, 0, 0, 0);
      return completionDate.getTime() === today.getTime();
    });
  };
  
  const completed = isCompletedToday();
  
  const handleToggleComplete = async () => {
    setIsCompleting(true);
    try {
      if (completed) {
        // Uncomplete habit
        const { error } = await uncompleteHabit(habit.id, new Date());
        if (error) throw error;
      } else {
        // Complete habit
        const { error } = await completeHabit(habit.id);
        if (error) throw error;
        
        // Trigger confetti animation
        window.dispatchEvent(new CustomEvent('goalComplete'));
      }
      
      onHabitUpdate();
    } catch (err) {
      console.error('Error toggling habit completion:', err);
    } finally {
      setIsCompleting(false);
    }
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await deleteHabit(habit.id);
      
      if (error) throw error;
      
      onHabitDelete(habit.id);
    } catch (err) {
      console.error('Error deleting habit:', err);
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-teal-200 bg-teal-50 shadow-sm dark:border-teal-800 dark:bg-teal-900/20">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={handleToggleComplete}
            disabled={isCompleting}
            className={`mt-0.5 flex-shrink-0 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
              isCompleting ? 'opacity-60' : ''
            }`}
            aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {completed ? (
              <CheckCircle className="h-5 w-5 text-teal-500 dark:text-teal-400" fill="currentColor" />
            ) : (
              <Circle className="h-5 w-5 text-teal-500 dark:text-teal-400" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={`font-medium ${
                completed 
                  ? 'text-slate-500 dark:text-slate-400' 
                  : 'text-slate-900 dark:text-white'
              }`}>
                {habit.title}
              </h3>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-2 flex-shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                aria-label={isExpanded ? 'Collapse habit details' : 'Expand habit details'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center">
                <Repeat className="mr-1 h-3 w-3" />
                {frequencyLabels[habit.frequency]}
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                {timeOfDayLabels[habit.time_of_day]}
              </div>
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pl-8">
            {habit.description && (
              <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">
                {habit.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-600 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-400">
                Habit
              </span>
              
              <div className="flex-1"></div>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-red-600 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:border-slate-600 dark:bg-slate-700 dark:text-red-400 dark:hover:bg-slate-600"
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <svg className="mr-1 h-3 w-3 animate-spin" viewBox="0 0 24 24">
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
                    Deleting...
                  </span>
                ) : (
                  <>
                    <Trash className="mr-1 h-3 w-3" />
                    Remove
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(HabitCard);