import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Plus, X } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { createTask } from '../../services/tasks';
import TextareaAutosize from 'react-textarea-autosize';

interface AddTaskFormProps {
  onTaskAdded: () => void;
  onCancel: () => void;
}

const AddTaskForm = ({ onTaskAdded, onCancel }: AddTaskFormProps) => {
  const { user } = useUserStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("User authentication error. Please try refreshing the page.");
      return;
    }
    
    if (!title.trim()) {
      setError("Task title is required");
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
      let dueDateObj: Date | null = null;
      
      if (dueDate) {
        dueDateObj = new Date(dueDate);
        
        if (dueTime) {
          const [hours, minutes] = dueTime.split(':').map(Number);
          dueDateObj.setHours(hours, minutes);
        } else {
          dueDateObj.setHours(23, 59, 59);
        }
      }
      
      const taskData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDateObj ? dueDateObj.toISOString() : null,
        priority,
      };
      
      console.log('Creating task with data:', taskData);
      
      const { data, error } = await createTask(taskData);
      
      if (error) throw error;
      
      if (!data) {
        throw new Error("Task created but no data returned");
      }
      
      console.log('Task created successfully:', data);
      
      // Clear form
      setTitle('');
      setDescription('');
      setDueDate('');
      setDueTime('');
      setPriority('medium');
      
      // Notify parent
      onTaskAdded();
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message || "Failed to create task. Please try again.");
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
      className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-slate-900 dark:text-white">Add New Task</h3>
        <button
          onClick={onCancel}
          className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
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
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
            required
          />
        </div>
        
        <div className="mb-4">
          <TextareaAutosize
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
            minRows={2}
            maxRows={5}
          />
        </div>
        
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              <Calendar className="mr-1 inline-block h-3 w-3" />
              Due Date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              <Clock className="mr-1 inline-block h-3 w-3" />
              Time (optional)
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              disabled={!dueDate}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Priority
          </label>
          <div className="flex gap-2">
            {[
              { value: 'low', label: 'Low', color: 'bg-blue-500' },
              { value: 'medium', label: 'Medium', color: 'bg-teal-500' },
              { value: 'high', label: 'High', color: 'bg-purple-500' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value as 'low' | 'medium' | 'high')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  priority === option.value
                    ? `border-${option.color.replace('bg-', '')} ${option.color} text-white`
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
            className="btn btn-primary"
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
                Add Task
              </span>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddTaskForm;