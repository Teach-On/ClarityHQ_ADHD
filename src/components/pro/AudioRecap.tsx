import { useState } from 'react';
import { motion } from 'framer-motion';
import { Headphones, PlayCircle, PauseCircle, Calendar, ListTodo, Check, X } from 'lucide-react';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { useUserStore } from '../../stores/userStore';
import { getTasks } from '../../services/tasks';
import { format } from 'date-fns';

const AudioRecap = () => {
  const { user } = useUserStore();
  const { isProUser } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [taskSummary, setTaskSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const generateRecap = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get today's tasks
      const today = new Date();
      const { data: tasksData, error: tasksError } = await getTasks(user.id, 'today');
      
      if (tasksError) throw tasksError;
      
      if (!tasksData || tasksData.length === 0) {
        setTaskSummary("You have no tasks scheduled for today.");
      } else {
        const completedTasks = tasksData.filter(task => task.status === 'completed');
        const pendingTasks = tasksData.filter(task => task.status !== 'completed');
        
        let summary = `Here's your task recap for ${format(today, 'EEEE, MMMM d')}. `;
        
        if (completedTasks.length > 0) {
          summary += `You've completed ${completedTasks.length} ${completedTasks.length === 1 ? 'task' : 'tasks'}: `;
          summary += completedTasks.map(task => task.title).join(', ') + '. ';
        }
        
        if (pendingTasks.length > 0) {
          summary += `You have ${pendingTasks.length} ${pendingTasks.length === 1 ? 'task' : 'tasks'} remaining: `;
          summary += pendingTasks.map(task => task.title).join(', ') + '. ';
        }
        
        summary += "Keep up the good work!";
        
        setTaskSummary(summary);
      }
    } catch (err) {
      console.error('Error generating audio recap:', err);
      setError('Failed to generate recap. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const playAudioRecap = () => {
    if (!taskSummary) return;
    
    setIsPlaying(true);
    
    // Use the Web Speech API for text-to-speech
    const utterance = new SpeechSynthesisUtterance(taskSummary);
    
    // Configure voice settings
    utterance.rate = 1.0; // Speed
    utterance.pitch = 1.0; // Pitch
    utterance.volume = 1.0; // Volume
    
    // Try to use a more natural voice if available
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Samantha') || // iOS/macOS voice
      voice.name.includes('Google') || // Google voices
      voice.name.includes('Neural') // Neural voices are usually more natural
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    // Event handlers
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
      setError('An error occurred while playing the audio recap.');
    };
    
    // Play the speech
    speechSynthesis.speak(utterance);
  };
  
  const stopAudioRecap = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };
  
  if (!isProUser) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <h3 className="flex items-center font-medium text-amber-800 dark:text-amber-300">
          <Headphones className="mr-2 h-5 w-5" />
          Audio Recap
        </h3>
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
          Listen to a spoken summary of your tasks and progress with ClarityHQ Pro.
        </p>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center font-medium text-amber-700 dark:text-amber-300">
          <Headphones className="mr-2 h-5 w-5" />
          Audio Recap
        </h3>
        
        {taskSummary && !isPlaying ? (
          <button
            onClick={playAudioRecap}
            className="rounded-md bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-800"
          >
            <PlayCircle className="mr-1 inline-block h-4 w-4" />
            Play
          </button>
        ) : isPlaying ? (
          <button
            onClick={stopAudioRecap}
            className="rounded-md bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-800"
          >
            <PauseCircle className="mr-1 inline-block h-4 w-4" />
            Stop
          </button>
        ) : null}
      </div>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <div className="flex">
            <X className="mr-2 h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {taskSummary ? (
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800">
          <div className="mb-3 flex items-center text-sm text-amber-600 dark:text-amber-400">
            <Calendar className="mr-1 h-4 w-4" />
            <span>{format(new Date(), 'EEEE, MMMM d')}</span>
          </div>
          
          <p className="text-slate-700 dark:text-slate-300">
            {taskSummary}
          </p>
          
          <div className="mt-4 flex items-center text-xs text-amber-600 dark:text-amber-400">
            <motion.div
              animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Headphones className="mr-1 h-3 w-3" />
            </motion.div>
            <span>{isPlaying ? 'Playing audio...' : 'Audio available'}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Headphones className="mb-2 h-12 w-12 text-amber-400 dark:text-amber-500" />
          <p className="mb-2 text-slate-700 dark:text-slate-300">
            Generate an audio summary of your tasks and progress
          </p>
          <button
            onClick={generateRecap}
            disabled={isLoading}
            className="mt-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-70 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
                Generating...
              </span>
            ) : (
              <span className="flex items-center">
                <ListTodo className="mr-2 h-4 w-4" />
                Generate Recap
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioRecap;