import { motion } from 'framer-motion';
import { Brain, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FocusSessionButton = () => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/focus');
  };
  
  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="mt-6 w-full rounded-xl border border-blue-200 bg-blue-50 p-4 text-left shadow-sm hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900 dark:text-white">Launch Focus Session</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Personalized for your energy level and available time
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-blue-500 dark:text-blue-400" />
      </div>
    </motion.button>
  );
};

export default FocusSessionButton;