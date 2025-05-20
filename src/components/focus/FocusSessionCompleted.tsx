import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Trophy, Clock, Calendar, X, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface FocusSessionCompletedProps {
  duration: number;
  tasksCompleted: number;
  totalTasks: number;
  date?: Date;
  onShowReflection: () => void;
  onClose: () => void;
}

const FocusSessionCompleted = ({
  duration,
  tasksCompleted,
  totalTasks,
  date = new Date(),
  onShowReflection,
  onClose
}: FocusSessionCompletedProps) => {
  const [showingSummary, setShowingSummary] = useState(true);
  
  // Format the session date
  const formattedDate = format(date, 'MMMM d, yyyy');
  const formattedTime = format(date, 'h:mm a');
  
  // Calculate completion percentage
  const completionPercentage = 
    totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Session Complete
        </h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Celebration animation */}
      <div className="my-8 flex justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20 
          }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <Trophy className="h-12 w-12" />
          </motion.div>
        </motion.div>
      </div>
      
      {/* Session summary */}
      <div className="mb-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/30">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-700">
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Duration</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{duration} min</p>
          </div>
          
          <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-slate-700">
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500 dark:text-green-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {tasksCompleted}/{totalTasks} tasks
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500 dark:text-slate-400">
              Completion: {completionPercentage}%
            </span>
            <span className="font-medium text-slate-500 dark:text-slate-400">
              <Calendar className="mr-1 inline-block h-3 w-3" />
              {formattedDate} at {formattedTime}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-green-500 dark:bg-green-600"
            />
          </div>
        </div>
      </div>
      
      {/* Celebration and reflection prompt */}
      <div className="mb-6">
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start">
            <div className="mr-3 mt-0.5 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Great work today!
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                {totalTasks === 0
                  ? "You dedicated time to focus, which is always a win."
                  : completionPercentage >= 75
                  ? "Excellent job completing most of your tasks!"
                  : completionPercentage >= 25
                  ? "You made good progress on your tasks."
                  : "Every step counts, no matter how small."}
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-600 dark:text-slate-400">
          Taking a moment to reflect helps build better focus habits.
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex justify-center">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onShowReflection}
          className="inline-flex items-center rounded-lg bg-blue-500 px-6 py-3 font-medium text-white hover:bg-blue-600"
        >
          Reflect on Your Session
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FocusSessionCompleted;