import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

interface OnboardingProps {
  theme: string;
  habitReminders: boolean;
  showTasks: boolean;
  showHabits: boolean;
  showCalendar: boolean;
}

const Onboarding = ({
  theme,
  habitReminders,
  showTasks,
  showHabits,
  showCalendar
}: OnboardingProps) => {
  const { user } = useUserStore();
  const navigate = useNavigate();

  const [customIntention, setCustomIntention] = useState('');
  const [selectedTheme, setTheme] = useState<string>(theme);
  const [showTasksState, setShowTasks] = useState<boolean>(showTasks);
  const [showHabitsState, setShowHabits] = useState<boolean>(showHabits);
  const [showCalendarState, setShowCalendar] = useState<boolean>(showCalendar);
  const [habitRemindersState, setHabitReminders] = useState<boolean>(habitReminders);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleCheckbox = (key: string) => {
    switch (key) {
      case 'tasks':
        setShowTasks(prev => !prev);
        break;
      case 'habits':
        setShowHabits(prev => !prev);
        break;
      case 'calendar':
        setShowCalendar(prev => !prev);
        break;
      case 'reminders':
        setHabitReminders(prev => !prev);
        break;
      default:
        break;
    }
  };

  const handleComplete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCompleted(true);
      navigate('/dashboard');
    }, 1500);
  };

  if (completed) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl text-green-600">Onboarding Complete! Redirecting...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 text-slate-900 dark:text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome to ClarityHQ</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Let’s set up your experience</p>
        </header>

        <section className="space-y-4">
          <div>
            <label className="block font-medium">Choose Theme</label>
            <select
              className="w-full mt-1 p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
              value={selectedTheme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-medium">What do you want to see?</label>
            <div className="flex flex-col gap-2">
              <label><input type="checkbox" checked={showTasksState} onChange={() => handleCheckbox('tasks')} /> Show Tasks</label>
              <label><input type="checkbox" checked={showHabitsState} onChange={() => handleCheckbox('habits')} /> Show Habits</label>
              <label><input type="checkbox" checked={showCalendarState} onChange={() => handleCheckbox('calendar')} /> Show Calendar</label>
              <label><input type="checkbox" checked={habitRemindersState} onChange={() => handleCheckbox('reminders')} /> Habit Reminders</label>
            </div>
          </div>

          <div>
            <label className="block font-medium">Add Custom Intention (optional)</label>
            <input
              type="text"
              className="w-full mt-1 p-2 border rounded-md dark:bg-slate-800 dark:border-slate-700"
              value={customIntention}
              onChange={(e) => setCustomIntention(e.target.value)}
              placeholder="e.g., Meditate daily"
            />
          </div>
        </section>

        <div className="pt-4">
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Saving...' : 'Complete Onboarding'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default Onboarding;

