import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, ArrowRight, Music, Activity, List, Coffee, X, PlayCircle, Battery, Zap } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { getTasks } from '../../services/tasks';
import { Task } from '../../types/supabase';

type EnergyLevel = 'sluggish' | 'wired' | 'energized' | 'anxious' | 'balanced';
type TimeAvailable = 15 | 30 | 45 | 60;
type TaskCategory = 'creative' | 'analytical' | 'admin' | 'any';

interface FocusSessionGeneratorProps { 
  onStart: (
    tasks: Task[], 
    focusDuration: number, 
    breakDuration: number, 
    sensoryBoost: string
  ) => void;
  onClose: () => void;
}

const FocusSessionGenerator = ({ 
  onStart, 
  onClose
}: FocusSessionGeneratorProps) => {
  const { user } = useUserStore();
  
  // Questionnaire state
  const [step, setStep] = useState<number>(1);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null);
  const [timeAvailable, setTimeAvailable] = useState<TimeAvailable | null>(null);
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('any');
  
  // Result state
  const [isGenerating, setIsGenerating] = useState(false);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<{
    tasks: Task[];
    breakDuration: number;
    sensoryBoost: string;
    motivationalMessage: string;
    focusDuration: number;
  } | null>(null);
  
  const fetchUserTasks = async () => {
    if (!user) return;
    
    setIsLoadingTasks(true);
    try {
      const { data } = await getTasks(user.id);
      if (data) {
        // Filter for incomplete tasks
        setUserTasks(data.filter(task => task.status !== 'completed'));
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  };
  
  const handleEnergySelect = (level: EnergyLevel) => {
    setEnergyLevel(level);
    setStep(2);
  };
  
  const handleTimeSelect = (time: TimeAvailable) => {
    setTimeAvailable(time);
    setStep(3);
  };
  
  const handleCategorySelect = (category: TaskCategory) => {
    setTaskCategory(category);
    fetchUserTasks();
    setStep(4);
  };
  
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else if (prev.length < 3) { // Limit to 3 tasks
        return [...prev, taskId];
      }
      return prev;
    });
  };
  
  const generatePlan = async () => {
    if (!timeAvailable || !energyLevel) return;
    
    setIsGenerating(true);
    
    try {
      // Get selected tasks
      const tasks = selectedTasks.length > 0
        ? userTasks.filter(task => selectedTasks.includes(task.id))
        : selectAutomaticTasks();
      
      // Calculate time distribution
      let focusDuration, breakDuration;
      
      // Adjust times based on energy level and available time
      if (timeAvailable <= 15) {
        focusDuration = 10;
        breakDuration = 5;
      } else if (timeAvailable <= 30) {
        focusDuration = energyLevel === 'wired' || energyLevel === 'anxious' ? 20 : 25;
        breakDuration = energyLevel === 'wired' || energyLevel === 'anxious' ? 10 : 5;
      } else if (timeAvailable <= 45) {
        focusDuration = energyLevel === 'sluggish' ? 30 : 35;
        breakDuration = energyLevel === 'sluggish' ? 15 : 10;
      } else {
        focusDuration = energyLevel === 'sluggish' ? 45 : 50;
        breakDuration = 10;
      }
      
      // Generate sensory boost suggestion
      const sensoryBoost = generateSensoryBoost(energyLevel);
      
      // Generate motivational message
      const motivationalMessage = generateMotivationalMessage(energyLevel);
      
      // Set the generated plan
      setGeneratedPlan({
        tasks,
        breakDuration,
        sensoryBoost,
        motivationalMessage,
        focusDuration
      });
      
      setStep(5);
    } catch (err) {
      console.error('Error generating focus session:', err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const selectAutomaticTasks = (): Task[] => {
    if (userTasks.length === 0) return [];
    
    // Choose up to 3 tasks based on priority and energy level
    let tasksToReturn: Task[] = [];
    
    // Copy tasks array to avoid mutation
    const availableTasks = [...userTasks];
    
    // Filter by priority
    const highPriorityTasks = availableTasks.filter(t => t.priority === 'high');
    const mediumPriorityTasks = availableTasks.filter(t => t.priority === 'medium');
    const lowPriorityTasks = availableTasks.filter(t => t.priority === 'low');
    
    // Select based on energy level
    if (energyLevel === 'sluggish') {
      // Start with easier tasks when sluggish
      tasksToReturn = [...lowPriorityTasks, ...mediumPriorityTasks].slice(0, 2);
    } else if (energyLevel === 'wired' || energyLevel === 'anxious') {
      // Mix of medium and low priority when wired/anxious
      tasksToReturn = [...mediumPriorityTasks, ...lowPriorityTasks].slice(0, 2);
    } else {
      // Focus on high priority when energized/balanced
      tasksToReturn = [...highPriorityTasks, ...mediumPriorityTasks].slice(0, 3);
    }
    
    // If we didn't get any tasks, just take what we have
    if (tasksToReturn.length === 0 && availableTasks.length > 0) {
      tasksToReturn = availableTasks.slice(0, Math.min(2, availableTasks.length));
    }
    
    return tasksToReturn;
  };
  
  const generateSensoryBoost = (energy: EnergyLevel): string => {
    const suggestions: Record<EnergyLevel, string[]> = {
      sluggish: [
        'Listen to upbeat music (70-90 BPM) to increase energy',
        'Keep a cold drink nearby to help maintain alertness',
        'Use peppermint or citrus essential oil for an alertness boost',
        'Try bright lighting or natural daylight to increase wakefulness'
      ],
      wired: [
        'Listen to instrumental music without lyrics to channel your energy',
        'Have a fidget toy nearby for restless energy',
        'Keep the room slightly cooler to help manage excess energy',
        'Use background white noise to help steady your thoughts'
      ],
      energized: [
        'Match your music tempo to your current energy for optimal flow',
        'Have water nearby to stay hydrated during productive work',
        'Maintain comfortable room temperature to sustain your energy',
        'Use background sounds that match your working pace'
      ],
      anxious: [
        'Listen to calming instrumental music or nature sounds',
        'Use a weighted item in your lap to provide grounding',
        'Try lavender or chamomile scents for calming effects',
        'Keep the space organized and visual clutter minimal'
      ],
      balanced: [
        'Instrumental music or familiar background sounds',
        'Comfortable lighting that reduces eye strain',
        'Keep your workspace at a comfortable temperature',
        'Have water and a small healthy snack nearby'
      ]
    };
    
    const randomIndex = Math.floor(Math.random() * suggestions[energy].length);
    return suggestions[energy][randomIndex];
  };
  
  const generateMotivationalMessage = (energy: EnergyLevel): string => {
    const messages: Record<EnergyLevel, string[]> = {
      sluggish: [
        "Remember: starting is often the hardest part. Just one small step.",
        "Low energy days are normal. Be kind to yourself as you work.",
        "Progress comes from consistency, not intensity. Small steps count.",
        "Your brain needs different energy modes. Work with what you have today."
      ],
      wired: [
        "Channel your energy into focused bursts with clear boundaries.",
        "Your extra energy can be your superpower when directed effectively.",
        "One thing at a time - your mind may race but your hands can only do one task.",
        "Each time you redirect your focus, you're building that mental muscle."
      ],
      energized: [
        "Your energy today is a gift - use it wisely on what matters most.",
        "This is a perfect time to make progress on meaningful work.",
        "Remember to pace yourself to maintain this great energy.",
        "Your enthusiasm and focus right now are the perfect combination."
      ],
      anxious: [
        "Working on something concrete can help calm an anxious mind.",
        "Each small step reduces uncertainty and builds confidence.",
        "Focus on what you can control right now - just this task.",
        "Anxiety and productivity can coexist. Be patient with yourself."
      ],
      balanced: [
        "This balanced state is ideal for steady, meaningful progress.",
        "Trust your pace - consistency beats intensity every time.",
        "Small steps in the right direction add up to big progress.",
        "You're in a great state to make meaningful progress. Trust yourself."
      ]
    };
    
    const randomIndex = Math.floor(Math.random() * messages[energy].length);
    return messages[energy][randomIndex];
  };
  
  const handleStartSession = () => {
    if (!generatedPlan) return;
    
    onStart(
      generatedPlan.tasks, 
      generatedPlan.focusDuration, 
      generatedPlan.breakDuration, 
      generatedPlan.sensoryBoost
    );
  };
  
  const renderEnergyOptions = () => {
    const options = [
      { value: 'sluggish', label: 'Sluggish', icon: <Battery className="h-6 w-6 mb-2" />, 
        description: 'Low energy, hard to get started' },
      { value: 'wired', label: 'Wired', icon: <Zap className="h-6 w-6 mb-2" />, 
        description: 'Restless, hard to focus on one thing' },
      { value: 'energized', label: 'Energized', icon: <Activity className="h-6 w-6 mb-2" />, 
        description: 'Good energy, ready to work' },
      { value: 'anxious', label: 'Anxious', icon: <Brain className="h-6 w-6 mb-2" />, 
        description: 'Worried or overwhelmed' },
      { value: 'balanced', label: 'Balanced', icon: <Brain className="h-6 w-6 mb-2" />, 
        description: 'Steady, even energy' }
    ];
    
    return (
      <div className="grid grid-cols-2 gap-3">
        {options.map(option => (
          <motion.button
            key={option.value}
            onClick={() => handleEnergySelect(option.value as EnergyLevel)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:border-blue-300 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              {option.icon}
            </div>
            <span className="mt-2 text-lg font-medium text-slate-900 dark:text-white">{option.label}</span>
            <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{option.description}</span>
          </motion.button>
        ))}
      </div>
    );
  };
  
  const renderTimeOptions = () => {
    const options = [
      { value: 15, label: '15 min', description: 'Short burst' },
      { value: 30, label: '30 min', description: 'Quick session' },
      { value: 45, label: '45 min', description: 'Standard session' },
      { value: 60, label: '60 min', description: 'Extended focus' }
    ];
    
    return (
      <div className="grid grid-cols-2 gap-3">
        {options.map(option => (
          <motion.button
            key={option.value}
            onClick={() => handleTimeSelect(option.value as TimeAvailable)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:border-blue-300 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600"
          >
            <Clock className="mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-medium text-slate-900 dark:text-white">{option.label}</span>
            <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{option.description}</span>
          </motion.button>
        ))}
      </div>
    );
  };
  
  const renderCategoryOptions = () => {
    const options = [
      { value: 'creative', label: 'Creative', icon: <Brain className="h-6 w-6 mb-2" /> },
      { value: 'analytical', label: 'Analytical', icon: <Brain className="h-6 w-6 mb-2" /> },
      { value: 'admin', label: 'Admin', icon: <List className="h-6 w-6 mb-2" /> },
      { value: 'any', label: 'Any Task Type', icon: <List className="h-6 w-6 mb-2" /> }
    ];
    
    return (
      <div className="grid grid-cols-2 gap-3">
        {options.map(option => (
          <motion.button
            key={option.value}
            onClick={() => handleCategorySelect(option.value as TaskCategory)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:border-blue-300 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              {option.icon}
            </div>
            <span className="mt-2 text-lg font-medium text-slate-900 dark:text-white">{option.label}</span>
          </motion.button>
        ))}
      </div>
    );
  };
  
  const renderTaskSelectionStep = () => {
    return (
      <>
        <div className="mb-4">
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">Choose Tasks (max 3)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select 1-3 tasks for your focus session, or skip to auto-select
          </p>
        </div>
        
        {isLoadingTasks ? (
          <div className="flex items-center justify-center py-8">
            <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : userTasks.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-slate-700 dark:text-slate-300">You don't have any active tasks.</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">We'll create a focus session with time for reflection.</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
            {userTasks.map(task => (
              <div 
                key={task.id} 
                className={`mb-2 cursor-pointer rounded-lg border p-3 transition-all ${
                  selectedTasks.includes(task.id) 
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20' 
                    : 'border-slate-200 bg-white hover:border-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-800'
                }`}
                onClick={() => toggleTaskSelection(task.id)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900 dark:text-white">{task.title}</h4>
                  <div className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    task.priority === 'high' 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                      : task.priority === 'medium'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </div>
                </div>
                {task.description && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{
                    task.description.length > 100 
                      ? task.description.substring(0, 97) + '...' 
                      : task.description
                  }</p>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };
  
  const renderGeneratedPlan = () => {
    if (!generatedPlan) return null;
    
    const { tasks, breakDuration, sensoryBoost, motivationalMessage, focusDuration } = generatedPlan;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-slate-900 dark:text-white">
              {(focusDuration + breakDuration)} minute session
            </span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {tasks.length > 0 ? 
              `${focusDuration}m focus + ${breakDuration}m break` :
              `Self-guided with ${breakDuration}m break`
            }
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-lg font-medium text-slate-900 dark:text-white">Your Session Plan</h3>
          
          {tasks.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium text-slate-700 dark:text-slate-300">Focus on these tasks:</h4>
              <ul className="ml-5 list-disc space-y-1">
                {tasks.map(task => (
                  <li key={task.id} className="text-slate-700 dark:text-slate-300">
                    {task.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700">
              <p className="text-slate-700 dark:text-slate-300">
                Self-guided focus time - pick something that matches your energy level.
              </p>
            </div>
          )}
          
          <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <h4 className="flex items-center font-medium text-blue-700 dark:text-blue-300">
              <Coffee className="mr-2 h-4 w-4" />
              Break time: {breakDuration} minutes
            </h4>
            <p className="mt-1 text-sm text-blue-600 dark:text-blue-300">
              Use this time to stretch, hydrate, or rest your eyes.
            </p>
          </div>
          
          <div className="mt-4 rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
            <h4 className="flex items-center font-medium text-purple-700 dark:text-purple-300">
              <Music className="mr-2 h-4 w-4" />
              Sensory boost
            </h4>
            <p className="mt-1 text-sm text-purple-600 dark:text-purple-300">
              {sensoryBoost}
            </p>
          </div>
        </div>
        
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <h4 className="font-medium text-green-800 dark:text-green-300">Motivation</h4>
          <p className="mt-1 text-green-700 dark:text-green-400">
            "{motivationalMessage}"
          </p>
        </div>
      </div>
    );
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Focus Session Generator</h2>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Progress indicators */}
      <div className="mb-6">
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <div 
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  step >= i 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                }`}
              >
                {i}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-700">
          <div 
            className="h-1 rounded-full bg-blue-500 transition-all duration-300 ease-in-out"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Energy Level */}
          {step === 1 && (
            <div>
              <h3 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">How are you feeling right now?</h3>
              {renderEnergyOptions()}
            </div>
          )}
          
          {/* Step 2: Time Available */}
          {step === 2 && (
            <div>
              <h3 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">How much time do you have?</h3>
              {renderTimeOptions()}
              <button
                onClick={() => setStep(1)}
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowRight className="mr-1 h-3 w-3 rotate-180" />
                Back
              </button>
            </div>
          )}
          
          {/* Step 3: Task Category */}
          {step === 3 && (
            <div>
              <h3 className="mb-4 text-lg font-medium text-slate-900 dark:text-white">What type of tasks?</h3>
              {renderCategoryOptions()}
              <button
                onClick={() => setStep(2)}
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowRight className="mr-1 h-3 w-3 rotate-180" />
                Back
              </button>
            </div>
          )}
          
          {/* Step 4: Task Selection */}
          {step === 4 && (
            <div>
              {renderTaskSelectionStep()}
              <div className="mt-4 flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ArrowRight className="mr-1 h-3 w-3 rotate-180" />
                  Back
                </button>
                
                <button
                  onClick={generatePlan}
                  disabled={isGenerating}
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 dark:focus:ring-offset-slate-800"
                >
                  {isGenerating ? (
                    <span className="flex items-center">
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    <span>Generate Plan</span>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Step 5: Generated Plan */}
          {step === 5 && generatedPlan && (
            <div>
              {renderGeneratedPlan()}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(4)}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ArrowRight className="mr-1 h-3 w-3 rotate-180" />
                  Back
                </button>
                
                <motion.button
                  onClick={handleStartSession}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center rounded-md bg-green-500 px-4 py-2 text-white shadow-sm hover:bg-green-600"
                >
                  <PlayCircle className="mr-1.5 h-5 w-5" />
                  Start Session
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default FocusSessionGenerator;