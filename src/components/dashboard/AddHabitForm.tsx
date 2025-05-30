import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Repeat, X } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { createHabit } from '../../services/habits';
import TextareaAutosize from 'react-textarea-autosize';

interface AddHabitFormProps {
  onHabitAdded: () => void;
  onCancel: () => void;
}

const AddHabitForm = ({ onHabitAdded, onCancel }: AddHabitFormProps) => {
  const { user } = useUserStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("User authentication error. Please try refreshing the page.");
      return;
    }
    
    if (!title.trim()) {
      setError("Habit title is required");
      return;
    }
    
    // Skip strict UUID validation in development mode
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    
    if (!isDevelopment) {
      // In production, validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user.id)) {
        setError("Invalid user ID format. Please sign in again.");
        return;
      }
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const habitData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        frequency,
        time_of_day: timeOfDay,
      };
      
      console.log('Creating habit with data:', habitData);
      
      const { data, error } = await createHabit(habitData);
      
      if (error) throw error;
      
      if (!data) {
        throw new Error("Habit created but no data returned");
      }
      
      console.log('Habit created successfully:', data);
      
      // Clear form
      setTitle('');
      setDescription('');
      setFrequency('daily');
      setTimeOfDay('anytime');
      
      // Notify parent
      onHabitAdded();
    } catch (err: any) {
      console.error('Error creating habit:', err);
      setError(err.message || "Failed to create habit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-lg border border-teal-200 bg-teal-50 p-4 shadow-sm dark:border-teal-800 dark:bg-teal-900/20"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-slate-900 dark:text-white">Add New Habit</h3>
        <button
          onClick={onCancel}
          className="rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Habit title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-teal-300 bg-white p-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-teal-700 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
            required
          />
        </div>
        
        <div className="mb-4">
          <TextareaAutosize
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-teal-300 bg-white p-2 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-teal-700 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
            minRows={2}
            maxRows={5}
          />
        </div>
        
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            <Repeat className="mr-1 inline-block h-3 w-3" />
            How often?
          </label>
          <div className="flex gap-2">
            {[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFrequency(option.value as 'daily' | 'weekly' | 'monthly')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  frequency === option.value
                    ? 'border-teal-500 bg-teal-500 text-white dark:border-teal-400 dark:bg-teal-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            <Clock className="mr-1 inline-block h-3 w-3" />
            Time of day
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { value: 'morning', label: 'Morning' },
              { value: 'afternoon', label: 'Afternoon' },
              { value: 'evening', label: 'Evening' },
              { value: 'anytime', label: 'Anytime' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTimeOfDay(option.value as 'morning' | 'afternoon' | 'evening' | 'anytime')}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  timeOfDay === option.value
                    ? 'border-teal-500 bg-teal-500 text-white dark:border-teal-400 dark:bg-teal-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="btn inline-flex items-center bg-teal-500 text-white hover:bg-teal-600 focus-visible:ring-teal-500 disabled:bg-teal-300 dark:bg-teal-600 dark:hover:bg-teal-700"
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
                Creating...
              </span>
            ) : (
              <span className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add Habit
              </span>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddHabitForm;