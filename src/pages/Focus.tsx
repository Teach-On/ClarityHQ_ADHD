import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RefreshCw, CheckCircle, SkipForward, Settings as SettingsIcon, X, Plus, ChevronRight, Music } from 'lucide-react';
import { getTasks, updateTask } from '../services/tasks';
import { createFocusSession, saveFocusSessionReflection } from '../services/focusSessions';
import { useUserStore } from '../stores/userStore';
import FocusSessionGenerator from '../components/focus/FocusSessionGenerator';
import SessionReflection from '../components/focus/SessionReflection';
import FocusSessionProgress from '../components/focus/FocusSessionProgress';
import FocusSessionStats from '../components/focus/FocusSessionStats';
import type { Task } from '../types/supabase';

const Focus = () => {
  const { user } = useUserStore();
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [timerType, setTimerType] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [showSettings, setShowSettings] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [completingTask, setCompletingTask] = useState(false);
  const [postponingTask, setPostponingTask] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [sessionTasks, setSessionTasks] = useState<Task[]>([]);
  const [sessionTasksCompleted, setSessionTasksCompleted] = useState<string[]>([]);
  const [activeFocusSessionId, setActiveFocusSessionId] = useState<string | null>(null);
  const [suggestedSensoryBoost, setSuggestedSensoryBoost] = useState<string | null>(null);
  
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const timerStartRef = useRef<number>(0);
  const timeElapsedRef = useRef<number>(0);
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get next unfinished task
  useEffect(() => {
    if (!user) return;
    
    const fetchUnfinishedTask = async () => {
      try {
        setLoading(true);
        const { data } = await getTasks(user.id);
        
        if (data && data.length > 0) {
          // Find first incomplete task
          const task = data.find(t => t.status !== 'completed');
          setCurrentTask(task || null);
        }
      } catch (err) {
        console.error('Error fetching task for focus mode:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUnfinishedTask();
  }, [user]);
  
  // Timer effect using requestAnimationFrame for smoother animation
  const animate = (time: number) => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
      timerStartRef.current = time;
    }
    
    const deltaTime = time - previousTimeRef.current;
    
    // Update once per second
    if (deltaTime >= 1000 && isRunning && timeLeft > 0) {
      setTimeLeft(prevTime => prevTime - 1);
      previousTimeRef.current = time;
      timeElapsedRef.current += 1000;
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      // Notify when timer is done
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Time is up!', {
          body: timerType === 'focus' ? 'Take a break now.' : 'Ready to focus again?',
          icon: '/pwa-192x192.png'
        });
      }
      // Vibrate if available
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      // Play sound
      playTimerEndSound();
      
      // If focus period ended, show reflection
      if (timerType === 'focus' && sessionTasks.length > 0) {
        setShowReflection(true);
      }
    }
    
    requestRef.current = requestAnimationFrame(animate);
  };
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning, timeLeft]);
  
  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  // Reset timer when changing timer type
  useEffect(() => {
    let duration = 0;
    
    switch (timerType) {
      case 'focus':
        duration = focusDuration * 60;
        break;
      case 'shortBreak':
        duration = shortBreakDuration * 60;
        break;
      case 'longBreak':
        duration = longBreakDuration * 60;
        break;
      default:
        duration = 25 * 60;
    }
    
    setTimeLeft(duration);
    setIsRunning(false);
    previousTimeRef.current = undefined;
    timeElapsedRef.current = 0;
  }, [timerType, focusDuration, shortBreakDuration, longBreakDuration]);
  
  const toggleTimer = () => {
    // Prevent screen from sleeping during focus sessions
    if (!isRunning && 'wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen')
        .catch((err: any) => console.error(`Wake Lock error: ${err.name}, ${err.message}`));
    }
    
    // Play sound on start/pause
    if (!isRunning) {
      playTimerStartSound();
    } else {
      playTimerPauseSound();
    }
    
    setIsRunning(!isRunning);
    previousTimeRef.current = undefined; // Reset the previous time to avoid jumps
  };
  
  const resetTimer = () => {
    setIsRunning(false);
    previousTimeRef.current = undefined;
    timeElapsedRef.current = 0;
    
    switch (timerType) {
      case 'focus':
        setTimeLeft(focusDuration * 60);
        break;
      case 'shortBreak':
        setTimeLeft(shortBreakDuration * 60);
        break;
      case 'longBreak':
        setTimeLeft(longBreakDuration * 60);
        break;
      default:
        setTimeLeft(25 * 60);
    }
    
    playTimerResetSound();
  };
  
  const changeTimerType = (type: 'focus' | 'shortBreak' | 'longBreak') => {
    setTimerType(type);
  };
  
  const handleCompleteTask = async () => {
    if (!currentTask) return;
    
    setCompletingTask(true);
    try {
      const { data, error } = await updateTask(currentTask.id, { status: 'completed' });
      
      if (error) throw error;
      
      if (data) {
        // Add this task to completed session tasks if it's part of the session
        if (sessionTasks.some(task => task.id === currentTask.id)) {
          setSessionTasksCompleted(prev => [...prev, currentTask.id]);
        }
        
        // Trigger confetti animation
        window.dispatchEvent(new CustomEvent('goalComplete'));
        
        // Find the next task
        if (user) {
          const { data: tasks } = await getTasks(user.id);
          
          if (tasks && tasks.length > 0) {
            const nextTask = tasks.find(t => t.status !== 'completed' && t.id !== currentTask.id);
            setCurrentTask(nextTask || null);
          } else {
            setCurrentTask(null);
          }
        }
      }
    } catch (err) {
      console.error('Error completing task:', err);
    } finally {
      setCompletingTask(false);
    }
  };
  
  const handlePostponeTask = async () => {
    if (!currentTask) return;
    
    setPostponingTask(true);
    try {
      // Set due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      
      const { data, error } = await updateTask(currentTask.id, { 
        due_date: tomorrow.toISOString() 
      });
      
      if (error) throw error;
      
      if (data) {
        // Find the next task
        if (user) {
          const { data: tasks } = await getTasks(user.id);
          
          if (tasks && tasks.length > 0) {
            const nextTask = tasks.find(t => t.status !== 'completed' && t.id !== currentTask.id);
            setCurrentTask(nextTask || null);
          } else {
            setCurrentTask(null);
          }
        }
      }
    } catch (err) {
      console.error('Error postponing task:', err);
    } finally {
      setPostponingTask(false);
    }
  };
  
  // Handle focus session generator start
  const handleStartFocusSession = async (
    tasks: Task[], 
    focusTime: number, 
    breakTime: number,
    sensoryBoost: string
  ) => {
    if (!user) return;
    
    // Update session tasks
    setSessionTasks(tasks);
    setSessionTasksCompleted([]);
    
    // Set sensory boost suggestion
    setSuggestedSensoryBoost(sensoryBoost);
    
    // Set timer durations based on generated session
    setFocusDuration(focusTime);
    setShortBreakDuration(breakTime);
    
    // Reset and set up timer
    setTimerType('focus');
    setTimeLeft(focusTime * 60);
    
    // Hide generator
    setShowGenerator(false);
    
    try {
      // Create focus session record
      const { data: sessionData, error } = await createFocusSession({
        user_id: user.id,
        energy_level: 'medium', // Default energy level
        duration: focusTime + breakTime,
        tasks_completed: 0
      });
      
      if (error) throw error;
      
      if (sessionData) {
        setActiveFocusSessionId(sessionData.id);
      }
      
    } catch (err) {
      console.error('Error creating focus session:', err);
    }
  };
  
  // Handle reflection submission
  const handleReflectionComplete = async (
    satisfaction?: number,
    reflectionText?: string,
    sessionBarriers?: string[]
  ) => {
    // Save reflection if we have an active session
    if (activeFocusSessionId && user) {
      try {
        await saveFocusSessionReflection(activeFocusSessionId, {
          satisfaction_rating: satisfaction || null,
          reflection: reflectionText || null,
          barriers: sessionBarriers || null,
          tasks_completed: sessionTasksCompleted.length
        });
      } catch (err) {
        console.error('Error saving reflection:', err);
      }
    }
    
    setShowReflection(false);
    
    // Reset session state
    setSessionTasks([]);
    setSessionTasksCompleted([]);
    setActiveFocusSessionId(null);
    setSuggestedSensoryBoost(null);
  };
  
  // Timer progress percentage
  const progress = (timeLeft / ((timerType === 'focus' ? focusDuration : 
                               timerType === 'shortBreak' ? shortBreakDuration : 
                               longBreakDuration) * 60)) * 100;
  
  // Sound effects
  const playTimerStartSound = () => {
    const audio = new Audio();
    audio.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFzb25pY1N0dWRpb3MuY29tAFRYWFgAAAASAAADVGl0bGUAVGltZXIgU3RhcnQAVFlFUgAAAAUAAARUaW1lcgBUQ09NAAAAAQAACUNyZWF0ZWQgYnkATGFzb25pYyBTdHVkaW9zAENPTU0AAAAPAAADWWVHAGF1ZGlvIGNsaXAAAP/7kGQAAA0odMrpMRAABYA6VSYAABZZU1AxPRAACwppdJhgAFttXWWmJJAme0zd+zM5qGsTfr8NlMzQVjGzOA3SZZbeuEKGJLE02bWdXYS+jkT4AyJEgsuIYQVxj9P1/ZJ75QLOU/X2TMQB8vw9mfQdJwYi6DMDJ0SxfQYjLfuLIFJnWUMrIh8pOPQ2gH/1CzD3FcKQzEuQKRJJ9w8FZgFTJ+lCHc4Kcfr6jY2+HA0JFCgKiUYNRMBX88lPyO0FMqF8cxxNFEUlyjGMwAA/AAD/AIlS9Kl6VqSzS6XqnruN7vdLZiB1Aq9nWKHfnmH3fEPxdnwj+UkAoTwihJgmMoRREAZRFEgIoRQhCEUJMcuR3/8hCYz3yEIQiEQhmf+QsEQP/IZDSKTv/8iYJiO/ygmZ/5CETif8hCw7/kMhmP+Z83//Md85mQyGZDMz/zO/+ZkMhmZDMhn5j/5nf+WxL5Cfn/ljlwAAAAAAAAA';
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Error playing sound:', e));
  };
  
  const playTimerPauseSound = () => {
    const audio = new Audio();
    audio.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFzb25pY1N0dWRpb3MuY29tAFRYWFgAAAASAAADVGl0bGUAVGltZXIgUGF1c2UAVFlFUgAAAAUAAARUaW1lcgBUQ09NAAAAAQAACUNyZWF0ZWQgYnkATGFzb25pYyBTdHVkaW9zAENPTU0AAAAPAAADWWVHAGF1ZGlvIGNsaXAAAP/7kGQAAA9NhVdRgTABCyBphJjgAFXWDU9GDMAEKgGqmMGAQPKjo7XiRJzh7nmSBwbCq0UITlOHGUMpCCVqlS1UcyolSjLaRaZEk6JY7n/ywqxbkBUVJhJnAlKkGmlVcysyKs7l9y7deLYWNVaYM5F5zzjWMlm///mNmDMR/+czGz///+znI6GQ0ZDIafyjP5R5ZDRnOUMZz5ZDR0Ky56uVKnQqVHMqVDmVKjmVKhzKlRzKlQ5lSoclTpU6CpKlToKlRzKlRzKnQVJUqORUqPk6dBUlSo5lTpU6YWXd+pKiP/////9BQQFChKlRKnQAAAAAAP/y87//////////l53/8pee//nctANEAAAAAAAAAAAAAACAXrTJQyiEEURSCYDBEIqXRGGMb//8k79/O///JCqIQkEYqXf9uSQAAAP/ygAAAAAAAAAAAAAAAAAAAPj/9Sn+PO';
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Error playing sound:', e));
  };
  
  const playTimerResetSound = () => {
    const audio = new Audio();
    audio.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFzb25pY1N0dWRpb3MuY29tAFRYWFgAAAASAAADVGl0bGUAVGltZXIgUmVzZXQAVFlFUgAAAAUAAARUaW1lcgBUQ09NAAAAAQAACUNyZWF0ZWQgYnkATGFzb25pYyBTdHVkaW9zAENPTU0AAAAPAAADWWVHAGF1ZGlvIGNsaXAAAP/7kGQAD0xtdc+ZgzABDIBqMDDgAFUmDT9GDMAELgGqaMJAAE5JRO73xMdL3Kc7vXKCAWZB04HAgHmn7gJGz4JwwBXizTZhzFFBhIBRoqyAb/kWWYj8KmYW8hQaXbvvf+QOZVZrNmxFg+tA7atVozZgvszIz/kKChZf8nMhTUbv9AX9Pf/////////////////////+FhQVQKDQUGgoNFAxUKCo0GzRRmlVszizqFRoKDRYi5RmZM0WmZq7TRYLTNK7LMxPCCCgxKlQKlIKlUdFjqFA3/+U7Pfdqt91++9/uu/+62q+6pu+9/u7Vb+qm771Wr725l1VVV9/3u7vdmZRUFQKCoFBUGiw0VDRYNBvdVZqrsssxFfvPEAAAAAAAAAAAAAAAAAAAAAAPwAAADP/t/3/qbf93/fTbqpN3oAAAAAAAAAAAAAAfzSVv3ftW';
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Error playing sound:', e));
  };
  
  const playTimerEndSound = () => {
    const audio = new Audio();
    audio.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFzb25pY1N0dWRpb3MuY29tAFRYWFgAAAASAAADVGl0bGUAVGltZXIgRW5kZWQAVFlFUgAAAAUAAARUaW1lcgBUQ09NAAAAAQAACUNyZWF0ZWQgYnkATGFzb25pYyBTdHVkaW9zAENPTU0AAAAPAAADWWVHAGF1ZGlvIGNsaXAAAP/7kGQAAFIxhVvRmDABD5h6PzHgAFyGFX9IHzcEGgGswMeAAcqX/Tz8lbmPBIHZkMhmQqGYzIZn/o0YSDv8EwiP+EwTCZkORaQP85DMiYJ/8owTCfmQz/lkWTP8zPmf8v/mZEwn5f/8yGY8P/mZE8X/zGZEwTBMRP8pmQyGZE8X/yxERP//MEwTERP//LERMJkMyGZ/+X/l//+WIiJ//iIiJ/+WIiJ///mIiIiIiIiIiIiIiP///iIiIiIiJ/////mIieIiIv///8piIif/KYiIiXCIiIiIiIiIiIiIiIiJ//lMRERERERERERERERETE////////8RMRE////8iBBQVQqCoNFioKixUVBUYKioVBYqDQUFRUFQaKioVmg0FRYaKiqFRmaLDQUFRaZmopExMTExMTEA/AAAA7Mn/N7UzepN6lQaCoKgqCoKgqCoKgqCoKgqCoKgqCoKgqCoKgqCoKgqCoKgqCoKg2Z8zZkEAAAACAe+S0cg';
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Error playing sound:', e));
  };
  
  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Focus Mode</h1>
        <p className="text-slate-500 dark:text-slate-400">Concentrate on one task at a time.</p>
      </div>
      
      <AnimatePresence>
        {showGenerator ? (
          <FocusSessionGenerator 
            onStart={handleStartFocusSession}
            onClose={() => setShowGenerator(false)}
          />
        ) : showReflection ? (
          <SessionReflection
            onComplete={handleReflectionComplete}
            onClose={() => setShowReflection(false)}
            completedTasksCount={sessionTasksCompleted.length}
            totalTasksCount={sessionTasks.length}
            focusTime={focusDuration}
          />
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 rounded-2xl bg-white p-6 shadow-md dark:bg-slate-800 relative overflow-hidden"
            >
              <div className="mb-6 flex justify-center gap-2">
                <button
                  onClick={() => changeTimerType('focus')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    timerType === 'focus'
                      ? 'bg-blue-500 text-white dark:bg-blue-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  Focus
                </button>
                <button
                  onClick={() => changeTimerType('shortBreak')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    timerType === 'shortBreak'
                      ? 'bg-green-500 text-white dark:bg-green-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  Short Break
                </button>
                <button
                  onClick={() => changeTimerType('longBreak')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    timerType === 'longBreak'
                      ? 'bg-purple-500 text-white dark:bg-purple-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  Long Break
                </button>
              </div>
              
              {/* Animated background layer for visual focus aid */}
              <motion.div 
                className={`absolute inset-0 opacity-25 ${
                  timerType === 'focus' 
                    ? 'bg-blue-500' 
                    : timerType === 'shortBreak' 
                      ? 'bg-green-500' 
                      : 'bg-purple-500'
                }`}
                animate={{ 
                  opacity: isRunning ? [0.1, 0.2, 0.1] : 0.05,
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  repeatType: "reverse" 
                }}
              />
              
              <div className="relative mx-auto mb-8 flex h-64 w-64 items-center justify-center rounded-full touch-none">
                {/* Timer circle background */}
                <svg className="absolute h-full w-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke={timerType === 'focus' ? '#bfdbfe' : timerType === 'shortBreak' ? '#bbf7d0' : '#e9d5ff'}
                    strokeWidth="8"
                    className="transition-colors duration-500"
                  />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke={
                      timerType === 'focus'
                        ? '#3b82f6'
                        : timerType === 'shortBreak'
                        ? '#22c55e'
                        : '#8b5cf6'
                    }
                    strokeWidth="8"
                    strokeDasharray="100 100"
                    strokeDashoffset={100 - progress}
                    className="transition-colors duration-500"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 100 - progress }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                
                {/* Timer display */}
                <motion.div 
                  className="text-center"
                  animate={{ 
                    scale: isRunning ? [1, 1.02, 1] : 1,
                  }}
                  transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                >
                  <motion.div 
                    className="text-6xl font-bold text-slate-900 dark:text-white"
                    animate={{ opacity: isRunning ? [1, 0.9, 1] : 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {formatTime(timeLeft)}
                  </motion.div>
                  <div className="mt-2 text-lg text-slate-500 dark:text-slate-400">
                    {timerType === 'focus'
                      ? 'Stay focused'
                      : timerType === 'shortBreak'
                      ? 'Take a short break'
                      : 'Take a long break'}
                  </div>
                </motion.div>
              </div>
              
              <div className="flex justify-center gap-4">
                <motion.button
                  onClick={toggleTimer}
                  whileTap={{ scale: 0.95 }}
                  className={`flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-colors ${
                    isRunning
                      ? 'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                  }`}
                  aria-label={isRunning ? 'Pause' : 'Start'}
                >
                  {isRunning ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 pl-1" />}
                </motion.button>
                
                <motion.button
                  onClick={resetTimer}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 shadow-md"
                  aria-label="Reset"
                >
                  <RefreshCw className="h-6 w-6" />
                </motion.button>
                
                <motion.button
                  onClick={() => setShowSettings(!showSettings)}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 shadow-md"
                  aria-label="Settings"
                >
                  <SettingsIcon className="h-6 w-6" />
                </motion.button>
              </div>
              
              <AnimatePresence>
                {suggestedSensoryBoost && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 rounded-md border border-purple-200 bg-purple-50 p-3 text-sm dark:border-purple-700 dark:bg-purple-900/20"
                  >
                    <div className="flex items-start">
                      <div className="mr-2 mt-0.5 text-purple-600 dark:text-purple-400">
                        <Music className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-700 dark:text-purple-300">Sensory boost suggestion</p>
                        <p className="mt-0.5 text-purple-600 dark:text-purple-400">{suggestedSensoryBoost}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium text-slate-900 dark:text-white">Timer Settings</h3>
                      <button 
                        onClick={() => setShowSettings(false)}
                        className="rounded-full p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                          Focus Duration (min)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={focusDuration}
                          onChange={(e) => setFocusDuration(parseInt(e.target.value) || 25)}
                          className="mt-1 block w-full rounded-md border-slate-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                          Short Break (min)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={shortBreakDuration}
                          onChange={(e) => setShortBreakDuration(parseInt(e.target.value) || 5)}
                          className="mt-1 block w-full rounded-md border-slate-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                          Long Break (min)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={longBreakDuration}
                          onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 15)}
                          className="mt-1 block w-full rounded-md border-slate-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Session Launcher Button */}
            <motion.button 
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowGenerator(true)}
              className="mb-6 flex w-full items-center justify-between rounded-lg border border-blue-500 bg-blue-50 py-3 px-4 text-blue-700 shadow-sm hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
            >
              <span className="font-medium">Generate a personalized focus session</span>
              <ChevronRight className="h-5 w-5" />
            </motion.button>
            
            {/* Focus Session Stats */}
            <FocusSessionStats />
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-6 rounded-2xl bg-white p-6 shadow-md dark:bg-slate-800"
            >
              <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Current Focus Task</h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24">
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
                </div>
              ) : currentTask ? (
                <>
                  <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/30">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">{currentTask.title}</h3>
                    {currentTask.description && (
                      <p className="mt-2 text-slate-600 dark:text-slate-300">{currentTask.description}</p>
                    )}
                    {currentTask.due_date && (
                      <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Due: {new Date(currentTask.due_date).toLocaleString()}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className={`rounded-full px-2 py-1 text-xs font-medium 
                        ${currentTask.priority === 'high' 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                          : currentTask.priority === 'medium'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}
                      >
                        {currentTask.priority.charAt(0).toUpperCase() + currentTask.priority.slice(1)} Priority
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCompleteTask}
                      disabled={completingTask}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 py-3 font-medium text-white hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-70 dark:bg-green-600 dark:hover:bg-green-700"
                    >
                      {completingTask ? (
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      Complete
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePostponeTask}
                      disabled={postponingTask}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-70 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    >
                      {postponingTask ? (
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
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
                      ) : (
                        <SkipForward className="h-5 w-5" />
                      )}
                      Postpone
                    </motion.button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-500 dark:text-slate-400">No tasks to focus on.</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Add tasks from the dashboard to get started.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Display session tasks if active */}
      <AnimatePresence>
        {sessionTasks.length > 0 && !showGenerator && !showReflection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <h3 className="mb-3 font-medium text-slate-900 dark:text-white">Session Tasks</h3>
            <div className="space-y-2">
              {sessionTasks.map(task => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between rounded-md border border-slate-200 p-3 transition-all dark:border-slate-700"
                >
                  <div className="flex items-center">
                    <div 
                      className={`mr-3 h-5 w-5 flex-shrink-0 rounded-full ${
                        sessionTasksCompleted.includes(task.id)
                          ? 'bg-green-500 text-white'
                          : 'border-2 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {sessionTasksCompleted.includes(task.id) && (
                        <CheckCircle className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`${
                      sessionTasksCompleted.includes(task.id)
                        ? 'text-slate-500 line-through dark:text-slate-400'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {task.title}
                    </span>
                  </div>
                  {!sessionTasksCompleted.includes(task.id) && (
                    <button
                      onClick={async () => {
                        try {
                          const { error } = await updateTask(task.id, { status: 'completed' });
                          if (!error) {
                            setSessionTasksCompleted(prev => [...prev, task.id]);
                            window.dispatchEvent(new CustomEvent('goalComplete'));
                          }
                        } catch (err) {
                          console.error('Error completing task:', err);
                        }
                      }}
                      className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40"
                    >
                      Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Focus;