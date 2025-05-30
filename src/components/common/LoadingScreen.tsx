import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const LoadingScreen = () => {
  const [showExtendedMessage, setShowExtendedMessage] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  
  useEffect(() => {
    // Show extended message after 5 seconds
    const messageTimer = setTimeout(() => {
      setShowExtendedMessage(true);
    }, 5000);
    
    return () => clearTimeout(messageTimer);
  }, []);
  
  // Countdown timer for auto-refresh
  useEffect(() => {
    if (!showExtendedMessage) return;
    
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setShouldRefresh(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdownTimer);
  }, [showExtendedMessage]);
  
  // Handle auto-refresh when countdown ends
  useEffect(() => {
    if (shouldRefresh) {
      window.location.reload();
    }
  }, [shouldRefresh]);
  
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div 
          animate={{ 
            rotate: 360,
            transition: { 
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }
          }}
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
            <Loader2 className="h-8 w-8" />
          </div>
        </motion.div>
        
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Loading ClarityHQ</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Just a moment, we're getting things ready for you</p>
        
        {showExtendedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 max-w-md rounded-lg bg-white p-4 shadow-md dark:bg-slate-800"
          >
            <p className="mb-2 text-slate-700 dark:text-slate-300">
              This is taking longer than expected
            </p>
            
            <p className="text-sm text-slate-600 dark:text-slate-400">
              The app will automatically refresh in {countdown} seconds. You can also try:
            </p>
            
            <ul className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              <li>• Checking your internet connection</li>
              <li>• Clearing browser cache and cookies</li>
              <li>• Using a different browser</li>
            </ul>
            
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => window.location.href = "/"}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              >
                Go to Landing Page
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="rounded-md bg-blue-500 px-3 py-2 text-xs font-medium text-white hover:bg-blue-600"
              >
                Refresh Now
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default LoadingScreen;