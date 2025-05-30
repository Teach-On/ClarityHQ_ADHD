import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Brain, AlertCircle, Zap } from 'lucide-react';
import { getFocusSessionStats, FocusSessionStats as Stats } from '../../services/focusSessions';
import { useUserStore } from '../../stores/userStore';

const FocusSessionStats = () => {
  const { user } = useUserStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await getFocusSessionStats(user.id);
        
        if (error) throw error;
        
        setStats(data);
      } catch (err) {
        console.error('Error fetching focus session stats:', err);
        setError('Could not load focus session statistics');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [user]);
  
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex justify-center py-4">
          <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex">
          <AlertCircle className="mr-3 h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      </div>
    );
  }
  
  if (!stats || stats.total_sessions === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400">
            No focus sessions completed yet
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Complete your first session to see your stats
          </p>
        </div>
      </div>
    );
  }
  
  // Helper to format time
  const formatTotalTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
  };
  
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">Your Focus Stats</h3>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="flex flex-col rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="mb-1 text-xs font-medium uppercase text-blue-500 dark:text-blue-400">Sessions</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.total_sessions}</div>
        </div>
        
        <div className="flex flex-col rounded-lg border border-green-100 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
          <div className="mb-1 text-xs font-medium uppercase text-green-500 dark:text-green-400">Total Time</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{formatTotalTime(stats.total_time)}</div>
        </div>
        
        <div className="flex flex-col rounded-lg border border-purple-100 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20">
          <div className="mb-1 text-xs font-medium uppercase text-purple-500 dark:text-purple-400">Avg. Satisfaction</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {stats.avg_satisfaction ? `${Math.round(stats.avg_satisfaction * 10) / 10}/5` : 'N/A'}
          </div>
        </div>
      </div>
      
      {stats.common_barriers && stats.common_barriers.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Common Barriers</h4>
          <div className="flex flex-wrap gap-2">
            {stats.common_barriers.map((barrier, index) => (
              <span 
                key={index} 
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              >
                {barrier}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex items-start">
          <div className="mr-2 mt-0.5 text-amber-600 dark:text-amber-400">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Each focus session builds your concentration muscle, regardless of the outcome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusSessionStats;