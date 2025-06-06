import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

const Focus = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:to-slate-800 p-6 text-slate-900 dark:text-white">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Focus Session</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Pick a timer and begin your deep work. You got this 💪
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="card text-center py-10 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 transition-all">
            <h2 className="text-xl font-semibold mb-1">Focus</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">25 minutes</p>
          </button>

          <button className="card text-center py-10 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 transition-all">
            <h2 className="text-xl font-semibold mb-1">Short Break</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">5 minutes</p>
          </button>

          <button className="card text-center py-10 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 transition-all">
            <h2 className="text-xl font-semibold mb-1">Long Break</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">15 minutes</p>
          </button>
        </div>
      </div>
    </main>
  );
};

export default Focus;
