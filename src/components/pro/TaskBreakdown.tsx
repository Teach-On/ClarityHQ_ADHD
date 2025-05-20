import { useState } from 'react';
import { motion } from 'framer-motion';
import { ListChecks, Plus, X } from 'lucide-react';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { createTask } from '../../services/tasks';
import { useUserStore } from '../../stores/userStore';
import TextareaAutosize from 'react-textarea-autosize';

type SubTask = {
  id: string;
  title: string;
};

const TaskBreakdown = () => {
  const { user } = useUserStore();
  const { isProUser } = useSubscriptionStore();
  const [taskTitle, setTaskTitle] = useState('');
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return;
    
    setSubTasks([
      ...subTasks,
      { id: `subtask-${Date.now()}`, title: newSubTask.trim() }
    ]);
    setNewSubTask('');
  };
  
  const handleRemoveSubTask = (id: string) => {
    setSubTasks(subTasks.filter(task => task.id !== id));
  };
  
  const handleCreateTasks = async () => {
    if (!user || !taskTitle.trim() || subTasks.length === 0) return;
    
    setIsCreating(true);
    
    try {
      // Create main task
      const { data: mainTask, error: mainTaskError } = await createTask({
        user_id: user.id,
        title: taskTitle.trim(),
        description: `This task has ${subTasks.length} subtasks`,
        priority: 'medium',
      });
      
      if (mainTaskError) throw mainTaskError;
      
      // Create all subtasks
      const subtaskPromises = subTasks.map(subtask => 
        createTask({
          user_id: user.id,
          title: subtask.title,
          description: `Subtask of: ${taskTitle}`,
          priority: 'low',
        })
      );
      
      await Promise.all(subtaskPromises);
      
      // Reset form
      setTaskTitle('');
      setSubTasks([]);
      setShowForm(false);
      
      // Show success message or notification
      window.dispatchEvent(new CustomEvent('goalComplete'));
      
    } catch (err) {
      console.error('Error creating task breakdown:', err);
    } finally {
      setIsCreating(false);
    }
  };
  
  if (!isProUser) {
    return (
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
        <h3 className="flex items-center font-medium text-purple-800 dark:text-purple-300">
          <ListChecks className="mr-2 h-5 w-5" />
          Task Breakdown
        </h3>
        <p className="mt-2 text-sm text-purple-700 dark:text-purple-400">
          Break down complex tasks into manageable subtasks with ClarityHQ Pro.
        </p>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-5 dark:border-purple-800 dark:bg-purple-900/20">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center font-medium text-purple-700 dark:text-purple-300">
          <ListChecks className="mr-2 h-5 w-5" />
          Task Breakdown
        </h3>
        
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-800"
          >
            <Plus className="mr-1 inline-block h-4 w-4" />
            New
          </button>
        )}
      </div>
      
      {!showForm ? (
        <p className="text-center text-sm text-purple-700 dark:text-purple-400">
          Break down big tasks into smaller, manageable steps.
        </p>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-purple-700 dark:text-purple-400">
              Main Task
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Complete project proposal"
              className="w-full rounded-md border border-purple-300 bg-white p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-purple-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
            />
          </div>
          
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-purple-700 dark:text-purple-400">
              Subtasks
            </label>
            
            <div className="space-y-2">
              {subTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2">
                  <span className="flex-1 rounded-md bg-white p-2 text-sm dark:bg-slate-800 dark:text-white">
                    {task.title}
                  </span>
                  <button
                    onClick={() => handleRemoveSubTask(task.id)}
                    className="rounded-full p-1 text-purple-700 hover:bg-purple-200 dark:text-purple-400 dark:hover:bg-purple-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                placeholder="Add a subtask"
                className="flex-1 rounded-md border border-purple-300 bg-white p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-purple-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubTask();
                  }
                }}
              />
              <button
                onClick={handleAddSubTask}
                className="rounded-md bg-purple-500 px-3 text-white hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border border-purple-300 bg-white px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:bg-slate-800 dark:text-purple-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTasks}
              disabled={isCreating || !taskTitle.trim() || subTasks.length === 0}
              className="rounded-md bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:bg-purple-300 dark:bg-purple-600 dark:hover:bg-purple-700 dark:disabled:bg-purple-800/50"
            >
              {isCreating ? (
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
                  Creating...
                </span>
              ) : (
                'Create Tasks'
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TaskBreakdown;