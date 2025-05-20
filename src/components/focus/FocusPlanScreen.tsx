import { motion } from 'framer-motion';
import { Zap, Clock, Music, RefreshCw, PlayCircle, Coffee } from 'lucide-react';
import { Task } from '../../types/supabase';

interface FocusPlanScreenProps {
  tasks: Task[];
  focusTime: number;
  breakTime: number;
  sensoryBoost: string;
  motivationalMessage: string;
  onStart: () => void;
  onRegenerate: () => void;
  energyLevel?: string;
}

const FocusPlanScreen = ({
  tasks,
  focusTime,
  breakTime,
  sensoryBoost,
  motivationalMessage,
  onStart,
  onRegenerate,
  energyLevel = 'balanced'
}: FocusPlanScreenProps) => {
  // Calculate time per task
  const taskTimes = tasks.map(() => Math.floor(focusTime / tasks.length));
  
  // Ensure the total adds up to focusTime by adding any remainder to the last task
  if (tasks.length > 0) {
    const totalTaskTime = taskTimes.reduce((sum, time) => sum + time, 0);
    if (totalTaskTime < focusTime) {
      taskTimes[taskTimes.length - 1] += (focusTime - totalTaskTime);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white p-5 shadow-lg dark:bg-slate-800"
    >
      <div className="mb-4 border-b border-slate-100 pb-4 dark:border-slate-700">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Your Focus Session Is Ready!
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Based on your energy and time, here's your plan.
        </p>
      </div>

      {/* Tasks Section */}
      <div className="mb-5">
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div 
                key={task.id || index}
                className="flex items-start rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700/30"
              >
                <div className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-medium text-slate-900 dark:text-white">
                    {task.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {taskTimes[index]} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            Self-guided session - choose a task that matches your energy level.
          </div>
        )}
      </div>

      {/* Break Suggestion */}
      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-start">
          <div className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
            <Coffee className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-medium text-green-800 dark:text-green-300">
              Break Suggestion ({breakTime} min)
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400">
              Stretch and sip water
            </p>
          </div>
        </div>
      </div>

      {/* Sensory Boost */}
      <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20">
        <div className="flex items-start">
          <div className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
            <Music className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-medium text-purple-800 dark:text-purple-300">
              Sensory Boost
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-400">
              {sensoryBoost}
            </p>
          </div>
        </div>
      </div>
      
      {/* Motivation */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-start">
          <div className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-300">
              Motivation
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              "{motivationalMessage || "Tiny steps = real progress."}"
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 py-3 font-medium text-white shadow-sm hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
        >
          <PlayCircle className="h-5 w-5" />
          Start Session
        </motion.button>
        
        <motion.button
          onClick={onRegenerate}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-3 px-4 font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          <RefreshCw className="h-5 w-5" />
          Regenerate
        </motion.button>
      </div>
      
      {/* Total Time Indicator */}
      <div className="mt-4 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        <Clock className="mr-1 h-4 w-4" />
        Total time: {focusTime + breakTime} minutes
      </div>
    </motion.div>
  );
};

export default FocusPlanScreen;