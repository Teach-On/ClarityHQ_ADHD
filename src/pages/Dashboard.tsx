import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, ListTodo, BarChart2, Plus, Focus, ChevronDown, ChevronUp, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useUserStore } from '../stores/userStore';
import { getTasks } from '../services/tasks';
import { getHabitsWithCompletions } from '../services/habits';
import { getCalendarEvents } from '../services/calendar';
import { generateNudges, type Nudge } from '../services/nudges';
import TaskCard from '../components/dashboard/TaskCard';
import HabitCard from '../components/dashboard/HabitCard';
import CalendarEventCard from '../components/dashboard/CalendarEventCard';
import NudgeMessage from '../components/dashboard/NudgeMessage';
import VirtualizedTaskList from '../components/dashboard/VirtualizedTaskList';
import FocusSessionButton from '../components/dashboard/FocusSessionButton';

import type { Task, Habit, HabitCompletion, CalendarEvent } from '../types/supabase';

// Lazy load non-critical components
const AddTaskForm = lazy(() => import('../components/dashboard/AddTaskForm'));
const AddHabitForm = lazy(() => import('../components/dashboard/AddHabitForm'));

const Dashboard = () => {
  const { user } = useUserStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<(Habit & { completions: HabitCompletion[] })[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedItemType, setFocusedItemType] = useState<'tasks' | 'habits' | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(true);
  const [habitsExpanded, setHabitsExpanded] = useState(true);
  const [eventsExpanded, setEventsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use Promise.all to parallelize requests
      const [tasksResponse, habitsResponse, eventsResponse] = await Promise.all([
        // Only fetch fields we need
        getTasks(user.id, 'today'),
        getHabitsWithCompletions(user.id),
        getCalendarEvents(user.id, new Date(), new Date(new Date().setDate(new Date().getDate() + 1)))
      ]);
      
      if (tasksResponse.error) {
        console.error('Error fetching tasks:', tasksResponse.error);
      }
      
      if (habitsResponse.error) {
        console.error('Error fetching habits:', habitsResponse.error);
      }
      
      if (eventsResponse.error) {
        console.error('Error fetching calendar events:', eventsResponse.error);
      }
      
      // Generate nudges
      let nudgesData: Nudge[] = [];
      try {
        const { nudges: fetchedNudges, error: nudgesError } = await generateNudges(user.id);
        if (!nudgesError && fetchedNudges) {
          nudgesData = fetchedNudges;
        }
      } catch (nudgeErr) {
        console.error('Non-critical error generating nudges:', nudgeErr);
        // Don't set error since nudges are non-critical
      }
      
      if (tasksResponse.data) {
        console.log('Tasks fetched successfully:', tasksResponse.data.length);
        setTasks(tasksResponse.data);
      }
      
      if (habitsResponse.data) {
        setHabits(habitsResponse.data);
      }
      
      if (eventsResponse.data) {
        setEvents(eventsResponse.data);
      }
      
      setNudges(nudgesData);
      
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('There was a problem loading your dashboard data. Please try refreshing.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);
  
  useEffect(() => {
    console.log('Dashboard: Running fetchData effect');
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);
  
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };
  
  const handleTaskDelete = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };
  
  const handleHabitUpdate = () => {
    fetchData();
  };
  
  const handleHabitDelete = (habitId: string) => {
    setHabits(prevHabits => prevHabits.filter(habit => habit.id !== habitId));
  };
  
  const handleNudgeDismiss = (index: number) => {
    setNudges(prevNudges => prevNudges.filter((_, i) => i !== index));
  };
  
  const toggleFocus = (itemType: 'tasks' | 'habits') => {
    if (focusedItemType === itemType) {
      setFocusedItemType(null);
    } else {
      setFocusedItemType(itemType);
    }
  };
  
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
  };
  
  const handleTaskAdded = () => {
    console.log('Task added, refreshing data');
    setShowAddTask(false);
    fetchData();
  };
  
  // Dashboard sections with staggered animation
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05 // Reduced from 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 10 }, // Reduced from y: 20
    show: { opacity: 1, y: 0 }
  };
  
  // Get today's date for display
  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM d');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">{formattedDate}</p>
        </div>
        
        <button 
          onClick={handleManualRefresh}
          disabled={isRefreshing || isLoading}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label="Refresh dashboard"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
          <div className="mt-2">
            <button
              onClick={handleManualRefresh}
              className="font-medium text-red-700 underline hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
            >
              Try again
            </button>
          </div>
        </div>
      )}
      
      {/* Nudges Section */}
      <AnimatePresence>
        {nudges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {nudges.map((nudge, index) => (
              <NudgeMessage
                key={`${nudge.type}-${index}`}
                type={nudge.type}
                message={nudge.message}
                onDismiss={() => handleNudgeDismiss(index)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Focus Session Button */}
      <FocusSessionButton />
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item} className="card dark:bg-slate-800 dark:border-slate-700">
          <div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 w-fit mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed Today</h3>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {tasks.filter(t => t.status === 'completed').length + habits.filter(h => h.completions.length > 0).length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {tasks.filter(t => t.status === 'completed').length} tasks, {habits.filter(h => h.completions.length > 0).length} habits
          </p>
        </motion.div>
        
        <motion.div variants={item} className="card dark:bg-slate-800 dark:border-slate-700">
          <div className="rounded-full bg-teal-100 p-3 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400 w-fit mb-3">
            <ListTodo className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Tasks</h3>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {tasks.filter(t => t.status !== 'completed').length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">For today</p>
        </motion.div>
        
        <motion.div variants={item} className="card dark:bg-slate-800 dark:border-slate-700">
          <div className="rounded-full bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 w-fit mb-3">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Daily Habits</h3>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {habits.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {habits.filter(h => h.completions.length > 0).length} completed today
          </p>
        </motion.div>
        
        <motion.div variants={item} className="card dark:bg-slate-800 dark:border-slate-700">
          <div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 w-fit mb-3">
            <Focus className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Focus Sessions</h3>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">0</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Today</p>
        </motion.div>
      </motion.div>
      
      <div className="space-y-6">
        {/* Tasks Section */}
        <div className={`rounded-lg border ${
          focusedItemType === 'tasks' 
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
        }`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Today's Tasks</h2>
                <button
                  onClick={() => toggleFocus('tasks')}
                  className={`ml-2 rounded-full p-1.5 transition-colors ${
                    focusedItemType === 'tasks'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                  }`}
                  aria-label={focusedItemType === 'tasks' ? 'Unfocus tasks' : 'Focus on tasks'}
                >
                  <Focus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTasksExpanded(!tasksExpanded)}
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  aria-label={tasksExpanded ? 'Collapse tasks' : 'Expand tasks'}
                >
                  {tasksExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setShowAddTask(!showAddTask)}
                  className="rounded-md p-1 text-blue-500 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  aria-label="Add task"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {showAddTask && (
              <div className="px-4 pt-4">
                <Suspense fallback={
                  <div className="p-4 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                }>
                  <AddTaskForm
                    onTaskAdded={handleTaskAdded}
                    onCancel={() => setShowAddTask(false)}
                  />
                </Suspense>
              </div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {tasksExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-4"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading tasks...</p>
                    </div>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-slate-500 dark:text-slate-400">No tasks scheduled for today.</p>
                    <button
                      onClick={() => setShowAddTask(true)}
                      className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Add your first task
                    </button>
                  </div>
                ) : (
                  <div>
                    <AnimatePresence>
                      {tasks.length >= 10 ? (
                        <VirtualizedTaskList 
                          tasks={tasks}
                          onTaskUpdate={handleTaskUpdate}
                          onTaskDelete={handleTaskDelete}
                        />
                      ) : (
                        tasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onTaskUpdate={handleTaskUpdate}
                            onTaskDelete={handleTaskDelete}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Habits Section */}
        <div className={`rounded-lg border ${
          focusedItemType === 'habits' 
            ? 'border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-900/20' 
            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
        }`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Daily Habits</h2>
                <button
                  onClick={() => toggleFocus('habits')}
                  className={`ml-2 rounded-full p-1.5 transition-colors ${
                    focusedItemType === 'habits'
                      ? 'bg-teal-500 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                  }`}
                  aria-label={focusedItemType === 'habits' ? 'Unfocus habits' : 'Focus on habits'}
                >
                  <Focus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHabitsExpanded(!habitsExpanded)}
                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                  aria-label={habitsExpanded ? 'Collapse habits' : 'Expand habits'}
                >
                  {habitsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setShowAddHabit(!showAddHabit)}
                  className="rounded-md p-1 text-teal-500 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/30"
                  aria-label="Add habit"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {showAddHabit && (
              <div className="px-4 pt-4">
                <Suspense fallback={
                  <div className="p-4 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  </div>
                }>
                  <AddHabitForm
                    onHabitAdded={() => {
                      setShowAddHabit(false);
                      fetchData();
                    }}
                    onCancel={() => setShowAddHabit(false)}
                  />
                </Suspense>
              </div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {habitsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-4"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 animate-spin text-teal-500" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading habits...</p>
                    </div>
                  </div>
                ) : habits.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-slate-500 dark:text-slate-400">No habits set up yet.</p>
                    <button
                      onClick={() => setShowAddHabit(true)}
                      className="mt-2 text-sm font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      Create your first habit
                    </button>
                  </div>
                ) : (
                  <div>
                    <AnimatePresence>
                      {habits.map((habit) => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          onHabitUpdate={handleHabitUpdate}
                          onHabitDelete={handleHabitDelete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Calendar Events Section */}
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming Events</h2>
              </div>
              
              <button
                onClick={() => setEventsExpanded(!eventsExpanded)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                aria-label={eventsExpanded ? 'Collapse events' : 'Expand events'}
              >
                {eventsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {eventsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-4"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading events...</p>
                    </div>
                  </div>
                ) : events.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-slate-500 dark:text-slate-400">No upcoming calendar events.</p>
                  </div>
                ) : (
                  <div>
                    <AnimatePresence>
                      {events.map((event) => (
                        <CalendarEventCard key={event.id} event={event} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;