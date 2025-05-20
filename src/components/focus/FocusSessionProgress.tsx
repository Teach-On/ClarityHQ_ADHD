import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertTriangle, PlayCircle, PauseCircle } from 'lucide-react';

interface FocusSessionProgressProps {
  isRunning: boolean;
  timeLeft: number;
  totalTime: number;
  timerType: 'focus' | 'shortBreak' | 'longBreak';
  onTimerToggle: () => void;
}

const FocusSessionProgress = ({
  isRunning,
  timeLeft,
  totalTime,
  timerType,
  onTimerToggle
}: FocusSessionProgressProps) => {
  const [progressPercent, setProgressPercent] = useState(100);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Convert timeLeft to percentage for visual display
  useEffect(() => {
    setProgressPercent((timeLeft / totalTime) * 100);
  }, [timeLeft, totalTime]);
  
  // Get color based on timer type
  const getColors = () => {
    switch (timerType) {
      case 'focus':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-700 dark:text-blue-300',
          fill: 'bg-blue-500 dark:bg-blue-600',
          icon: <Clock className="mr-2 h-5 w-5" />
        };
      case 'shortBreak':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-700 dark:text-green-300',
          fill: 'bg-green-500 dark:bg-green-600',
          icon: <CheckCircle className="mr-2 h-5 w-5" />
        };
      case 'longBreak':
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/30',
          text: 'text-purple-700 dark:text-purple-300',
          fill: 'bg-purple-500 dark:bg-purple-600',
          icon: <AlertTriangle className="mr-2 h-5 w-5" />
        };
    }
  };
  
  const colors = getColors();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg ${colors.bg} p-4 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {colors.icon}
          <span className={`font-medium ${colors.text}`}>
            {timerType === 'focus' ? 'Focus Time' : timerType === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </span>
        </div>
        <button
          onClick={onTimerToggle}
          className={`rounded-full p-1 ${colors.text} hover:bg-white/30`}
        >
          {isRunning ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
        </button>
      </div>
      
      <div className="mt-2">
        <div className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white">
          {formatTime(timeLeft)}
        </div>
        
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/50">
          <motion.div
            className={`h-full ${colors.fill}`}
            initial={{ width: `${progressPercent}%` }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default FocusSessionProgress;