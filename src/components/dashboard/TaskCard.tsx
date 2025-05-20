import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronDown, Calendar, Edit, Trash, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Database } from '../../types/supabase';
import { updateTask, deleteTask } from '../../services/tasks';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskCardProps {
  task: Task;
  onTaskUpdate: (updatedTask: Task) => void;
  onTaskDelete: (taskId: string) => void;
  expanded?: boolean;
}

const priorityColors = {
  low: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  medium: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
  },
  high: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
};

const TaskCard = ({ task, onTaskUpdate, onTaskDelete, expanded = false }: TaskCardProps) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const colors = priorityColors[task.priority];
  
  const handleToggleComplete = async () => {
    setIsCompleting(true);
    try {
      const updatedStatus = task.status === 'completed' ? 'pending' : 'completed';
      const { data, error } = await updateTask(task.id, { status: updatedStatus });
      
      if (error) throw error;
      
      if (data) {
        onTaskUpdate(data);
        
        // If completing a task, trigger the confetti animation
        if (updatedStatus === 'completed') {
          window.dispatchEvent(new CustomEvent('goalComplete'));
        }
      }
    } catch (err) {
      console.error('Error updating task:', err);
    } finally {
      setIsCompleting(false);
    }
  };
  
  const handleMoveToTomorrow = async () => {
    setIsRescheduling(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      
      const { data, error } = await updateTask(task.id, { due_date: tomorrow.toISOString() });
      
      if (error) throw error;
      
      if (data) {
        onTaskUpdate(data);
      }
    } catch (err) {
      console.error('Error rescheduling task:', err);
    } finally {
      setIsRescheduling(false);
    }
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await deleteTask(task.id);
      
      if (error) throw error;
      
      onTaskDelete(task.id);
    } catch (err) {
      console.error('Error deleting task:', err);
      setIsDeleting(false);
    }
  };
  
  return (
    <div 
      className={`mb-3 overflow-hidden rounded-lg border ${colors.border} ${colors.bg} shadow-sm`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={handleToggleComplete}
            disabled={isCompleting}
            className={`mt-0.5 flex-shrink-0 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isCompleting ? 'opacity-60' : ''
            }`}
            aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {task.status === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" fill="currentColor" />
            ) : (
              <div className={`h-5 w-5 rounded-full border-2 ${colors.border}`} />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={`font-medium ${
                task.status === 'completed' 
                  ? 'line-through text-slate-500 dark:text-slate-400' 
                  : 'text-slate-900 dark:text-white'
              }`}>
                {task.title}
              </h3>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-2 flex-shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                aria-label={isExpanded ? 'Collapse task details' : 'Expand task details'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {task.due_date && (
              <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400">
                <Clock className="mr-1 h-3 w-3" />
                {format(new Date(task.due_date), 'MMM d, h:mm a')}
              </div>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pl-8">
            {task.description && (
              <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">
                {task.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border ${colors.border} px-2 py-0.5 text-xs font-medium ${colors.text}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </span>
              
              <div className="flex-1"></div>
              
              <button
                onClick={handleMoveToTomorrow}
                disabled={isRescheduling}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                {isRescheduling ? (
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
                    Moving...
                  </span>
                ) : (
                  <>
                    <Calendar className="mr-1 h-3 w-3" />
                    Tomorrow
                  </>
                )}
              </button>
              
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
export default memo(TaskCard);