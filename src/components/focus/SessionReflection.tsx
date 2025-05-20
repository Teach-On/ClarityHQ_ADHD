import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

interface SessionReflectionProps {
  onComplete: (
    satisfaction?: number,
    reflectionText?: string,
    sessionBarriers?: string[]
  ) => void;
  onClose: () => void;
  completedTasksCount?: number;
  totalTasksCount?: number;
  focusTime?: number;
}

const SessionReflection = ({
  onComplete,
  onClose,
  completedTasksCount = 0,
  totalTasksCount = 0,
  focusTime = 25
}: SessionReflectionProps) => {
  const [whatHelped, setWhatHelped] = useState('');
  const [whatToTweak, setWhatToTweak] = useState('');
  const [satisfaction, setSatisfaction] = useState<number | null>(null);

  const handleSubmit = () => {
    onComplete(
      satisfaction || undefined, 
      whatHelped || whatToTweak ? `${whatHelped}\n\nOne small tweak for next time: ${whatToTweak}` : undefined,
      []
    );
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">You Did It!</h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="mt-6 space-y-5">
        {/* Celebration Badge */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <Sparkles className="h-8 w-8" />
          </div>
        </div>
        
        {/* Stats summary */}
        {(completedTasksCount > 0 || totalTasksCount > 0) && (
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/30 text-center">
            <p className="text-slate-700 dark:text-slate-300">
              {completedTasksCount} of {totalTasksCount} tasks completed in {focusTime} minutes
            </p>
          </div>
        )}
        
        {/* First Prompt */}
        <div>
          <label className="mb-2 block text-base font-medium text-slate-900 dark:text-white">
            What helped you focus today?
          </label>
          <TextareaAutosize
            value={whatHelped}
            onChange={(e) => setWhatHelped(e.target.value)}
            placeholder="I noticed that..."
            className="w-full rounded-md border border-slate-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
            minRows={2}
            maxRows={4}
          />
        </div>
        
        {/* Second Prompt */}
        <div>
          <label className="mb-2 block text-base font-medium text-slate-900 dark:text-white">
            One small thing you'd tweak next time?
          </label>
          <TextareaAutosize
            value={whatToTweak}
            onChange={(e) => setWhatToTweak(e.target.value)}
            placeholder="Maybe I could..."
            className="w-full rounded-md border border-slate-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
            minRows={2}
            maxRows={4}
          />
        </div>
        
        {/* Quick satisfaction rating */}
        <div>
          <p className="mb-2 text-center text-slate-700 dark:text-slate-300">How satisfied were you with this focus session?</p>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setSatisfaction(rating)}
                className={`h-10 w-10 rounded-full ${
                  satisfaction === rating
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        </div>
        
        {/* Motivation */}
        <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
          <p className="text-lg font-medium text-blue-700 dark:text-blue-300">
            "Progress, not perfection."
          </p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleSkip}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Skip for Now
        </button>
        
        <button
          onClick={handleSubmit}
          className="flex items-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          Submit Reflection
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default SessionReflection;