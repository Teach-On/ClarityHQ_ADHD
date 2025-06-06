import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { Moon, Sun } from 'lucide-react';

const Dashboard = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back, {user?.user_metadata?.full_name || 'Friend'} 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Let’s stay focused and make progress today.
            </p>
          </div>text-slate-600
          <button
            onClick={toggleDarkMode}
            className="btn btn-outline text-sm flex items-center gap-2"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="card shadow-soft hover:shadow-lg transition-all">
            <h2 className="text-lg font-medium mb-1">Today’s Focus</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No tasks yet. Add a focus task to start the day with intention.
            </p>
          </div>

          <div className="card shadow-soft hover:shadow-lg transition-all">
            <h2 className="text-lg font-medium mb-1">Mood Tracker</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Check in with your mood to adjust your task flow.
            </p>
          </div>
        </section>

        <section className="card shadow-soft hover:shadow-lg transition-all">
          <h2 className="text-lg font-medium mb-4">Upcoming Tasks</h2>
          <ul className="space-y-2">
            <li className="p-4 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-sm">
              No tasks available. You can add one to get started!
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
