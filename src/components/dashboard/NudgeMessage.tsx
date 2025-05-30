import { motion } from 'framer-motion';
import { Flame, ThumbsUp, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { NudgeType } from '../../services/nudges';

interface NudgeMessageProps {
  type: NudgeType;
  message: string;
  onDismiss?: () => void;
}

const NudgeMessage = ({ type, message, onDismiss }: NudgeMessageProps) => {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) return null;
  
  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };
  
  let icon;
  let colors;
  
  switch (type) {
    case 'streak':
      icon = <Flame className="h-5 w-5" />;
      colors = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      break;
    case 'complete':
      icon = <ThumbsUp className="h-5 w-5" />;
      colors = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      break;
    case 'missed':
      icon = <AlertCircle className="h-5 w-5" />;
      colors = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      break;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`mb-4 rounded-lg border p-4 ${colors}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon}
          <p className="ml-2 text-sm font-medium">{message}</p>
        </div>
        <button 
          onClick={handleDismiss}
          className="rounded-full p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default NudgeMessage;