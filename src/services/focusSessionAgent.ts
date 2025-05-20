import { Task } from '../types/supabase';

export type EnergyLevel = 'sluggish' | 'wired' | 'energized' | 'anxious' | 'balanced';
export type TimeAvailable = 15 | 30 | 45 | 60;
export type FocusArea = 'creative' | 'analytical' | 'admin' | 'any';

export interface FocusSessionPlan {
  tasks: FocusTask[];
  breakSuggestion: string;
  sensoryBoost: string;
  motivationalMessage: string;
  focusTime: number;
  breakTime: number;
  totalTime: number;
}

export interface FocusTask {
  id?: string;
  title: string;
  durationMinutes: number;
  encouragement: string;
  existingTask?: Task; // If we're using an existing task
}

/**
 * Focus Session Generator Agent
 * 
 * This agent takes user inputs (energy level, time, focus area) and generates
 * a personalized focus plan with tasks, breaks, sensory suggestions, and motivational messages.
 */
export class FocusSessionAgent {
  /**
   * Generate a personalized focus session plan
   */
  static generateFocusSessionPlan(
    energyLevel: EnergyLevel,
    timeAvailable: TimeAvailable,
    focusArea: FocusArea = 'any',
    existingTasks: Task[] = []
  ): FocusSessionPlan {
    // Calculate time distribution based on energy level and time available
    const { focusTime, breakTime } = this.calculateTimeDistribution(energyLevel, timeAvailable);
    
    // Generate tasks
    const tasks = this.generateTasks(energyLevel, focusTime, focusArea, existingTasks);
    
    // Generate break suggestion
    const breakSuggestion = this.generateBreakSuggestion(energyLevel);
    
    // Generate sensory boost
    const sensoryBoost = this.generateSensoryBoost(energyLevel);
    
    // Generate motivational message
    const motivationalMessage = this.generateMotivationalMessage(energyLevel);
    
    return {
      tasks,
      breakSuggestion,
      sensoryBoost,
      motivationalMessage,
      focusTime,
      breakTime,
      totalTime: focusTime + breakTime
    };
  }
  
  /**
   * Convert existing tasks into focus tasks with durations and encouragement
   */
  static convertExistingTasksToFocusTasks(
    tasks: Task[],
    energyLevel: EnergyLevel,
    totalFocusTime: number
  ): FocusTask[] {
    if (!tasks || tasks.length === 0) return [];
    
    // Limit to 3 tasks max
    const selectedTasks = tasks.slice(0, 3);
    
    // Calculate time per task (evenly distributed)
    const taskCount = selectedTasks.length;
    const baseTimePerTask = Math.floor(totalFocusTime / taskCount);
    
    return selectedTasks.map((task, index) => {
      // Last task gets any remaining minutes
      let taskTime = baseTimePerTask;
      if (index === taskCount - 1) {
        const timeUsedSoFar = baseTimePerTask * (taskCount - 1);
        taskTime = totalFocusTime - timeUsedSoFar;
      }
      
      return {
        id: task.id,
        title: task.title,
        durationMinutes: taskTime,
        encouragement: this.generateEncouragement(energyLevel),
        existingTask: task
      };
    });
  }
  
  /**
   * Calculate how to distribute the available time between focus and breaks
   */
  private static calculateTimeDistribution(
    energyLevel: EnergyLevel,
    timeAvailable: TimeAvailable
  ): { focusTime: number; breakTime: number } {
    let focusPercentage: number;
    
    // Adjust focus/break ratio based on energy level
    switch (energyLevel) {
      case 'sluggish':
        // When sluggish, more frequent breaks help maintain focus
        focusPercentage = 0.7;
        break;
      case 'wired':
      case 'anxious':
        // When wired/anxious, slightly longer breaks help calm the mind
        focusPercentage = 0.75;
        break;
      case 'energized':
        // When energized, can sustain focus for longer
        focusPercentage = 0.85;
        break;
      case 'balanced':
      default:
        // Standard Pomodoro-ish ratio
        focusPercentage = 0.8;
        break;
    }
    
    // Calculate focus and break time in minutes
    let focusTime = Math.floor(timeAvailable * focusPercentage);
    let breakTime = timeAvailable - focusTime;
    
    // Ensure minimum break time of 5 minutes
    if (breakTime < 5 && timeAvailable > 15) {
      breakTime = 5;
      focusTime = timeAvailable - breakTime;
    }
    
    return { focusTime, breakTime };
  }
  
  /**
   * Generate tasks based on energy level, focus time, and focus area
   */
  private static generateTasks(
    energyLevel: EnergyLevel,
    focusTime: number,
    focusArea: FocusArea,
    existingTasks: Task[]
  ): FocusTask[] {
    // If we have existing tasks, use those
    if (existingTasks.length > 0) {
      return this.convertExistingTasksToFocusTasks(existingTasks, energyLevel, focusTime);
    }
    
    // Otherwise, generate suggested tasks
    let taskCount: number;
    
    // Determine number of tasks based on energy level and focus time
    if (focusTime <= 15) {
      taskCount = 1; // For very short sessions, just one task
    } else if (focusTime <= 30) {
      taskCount = energyLevel === 'sluggish' ? 1 : 2;
    } else {
      taskCount = energyLevel === 'sluggish' ? 2 : 
                  energyLevel === 'wired' || energyLevel === 'anxious' ? 3 : 2;
    }
    
    // Generate tasks based on focus area and energy level
    const tasks: FocusTask[] = [];
    const timePerTask = Math.floor(focusTime / taskCount);
    
    for (let i = 0; i < taskCount; i++) {
      // For the last task, use any remaining time
      const taskTime = i === taskCount - 1 
        ? focusTime - (timePerTask * (taskCount - 1)) 
        : timePerTask;
      
      tasks.push({
        title: this.generateTaskTitle(energyLevel, focusArea, i),
        durationMinutes: taskTime,
        encouragement: this.generateEncouragement(energyLevel)
      });
    }
    
    return tasks;
  }
  
  /**
   * Generate a task title based on energy level, focus area, and task index
   */
  private static generateTaskTitle(
    energyLevel: EnergyLevel,
    focusArea: FocusArea,
    taskIndex: number
  ): string {
    const tasks: Record<FocusArea, string[]> = {
      creative: [
        'Brainstorm ideas for your current project',
        'Sketch or outline your next creative piece',
        'Write freely for 10 minutes',
        'Design a mock-up or prototype'
      ],
      analytical: [
        'Review and analyze recent data',
        'Solve a complex problem step-by-step',
        'Research a topic in depth',
        'Organize information into categories'
      ],
      admin: [
        'Process emails and messages',
        'Organize digital files or physical space',
        'Update your calendar and deadlines',
        'Review and update your to-do list'
      ],
      any: [
        'Work on your highest priority task',
        'Complete a task you've been avoiding',
        'Focus on something meaningful to you',
        'Make progress on an ongoing project'
      ]
    };
    
    // Adjust task selection based on energy level
    let areaToUse = focusArea;
    
    // If energy is sluggish, maybe suggest admin tasks as they're often easier to start
    if (energyLevel === 'sluggish' && focusArea === 'any') {
      const random = Math.random();
      if (random < 0.6) {
        areaToUse = 'admin';
      }
    }
    
    // If anxious or wired, concrete tasks are better than abstract ones
    if ((energyLevel === 'anxious' || energyLevel === 'wired') && focusArea === 'creative') {
      const random = Math.random();
      if (random < 0.5) {
        areaToUse = 'admin';
      }
    }
    
    // Select a task based on the modified focus area and task index
    const taskPool = tasks[areaToUse];
    // Use task index if available, otherwise pick randomly
    const taskIndex2 = taskIndex < taskPool.length ? taskIndex : Math.floor(Math.random() * taskPool.length);
    
    return taskPool[taskIndex2];
  }
  
  /**
   * Generate a personalized break suggestion based on energy level
   */
  private static generateBreakSuggestion(energyLevel: EnergyLevel): string {
    const suggestions: Record<EnergyLevel, string[]> = {
      sluggish: [
        'Do 10 jumping jacks to get your blood flowing',
        'Take a short walk outside for fresh air',
        'Stretch your arms and legs while taking deep breaths',
        'Do a quick 2-minute dance to upbeat music'
      ],
      wired: [
        'Practice deep breathing for 2 minutes',
        'Do a quick body scan meditation',
        'Stretch slowly while focusing on your breath',
        'Write down any racing thoughts to clear your mind'
      ],
      energized: [
        'Take a brisk walk around the block',
        'Do a quick set of bodyweight exercises',
        'Dance to one of your favorite songs',
        'Stretch fully while taking deep breaths'
      ],
      anxious: [
        'Practice 4-7-8 breathing (inhale 4, hold 7, exhale 8)',
        'Put your hand on your chest and feel your heartbeat slow down',
        'Make a cup of calming tea and drink it mindfully',
        'Write down your worries on paper to externalize them'
      ],
      balanced: [
        'Stretch your body and shoulders',
        'Get some fresh air for a few minutes',
        'Hydrate and rest your eyes',
        'Take a few moments of mindfulness'
      ]
    };
    
    return suggestions[energyLevel][Math.floor(Math.random() * suggestions[energyLevel].length)];
  }
  
  /**
   * Generate a sensory boost suggestion based on energy level
   */
  private static generateSensoryBoost(energyLevel: EnergyLevel): string {
    const suggestions: Record<EnergyLevel, string[]> = {
      sluggish: [
        'Put on upbeat music with around 80-120 BPM',
        'Try bright lighting or natural sunlight',
        'Use a citrus or peppermint essential oil diffuser',
        'Keep a fidget toy or stress ball nearby'
      ],
      wired: [
        'Play calming instrumental or lo-fi music',
        'Use softer, dimmer lighting',
        'Try lavender or chamomile scents',
        'Keep a weighted item in your lap or on your shoulders'
      ],
      energized: [
        'Put on music that matches your productivity pace',
        'Adjust lighting to be bright but not harsh',
        'Keep a cold drink nearby to sip',
        'Use a favorite textured object for occasional grounding'
      ],
      anxious: [
        'Play gentle nature sounds or white noise',
        'Use soft, warm lighting',
        'Try lavender, sandalwood, or jasmine scents',
        'Keep a smooth stone or soft fabric to touch when needed'
      ],
      balanced: [
        'Play instrumental music without lyrics',
        'Ensure comfortable lighting (not too bright/dim)',
        'Keep a glass of water nearby',
        'Have a small object to fidget with if needed'
      ]
    };
    
    return suggestions[energyLevel][Math.floor(Math.random() * suggestions[energyLevel].length)];
  }
  
  /**
   * Generate a motivational message based on energy level
   */
  private static generateMotivationalMessage(energyLevel: EnergyLevel): string {
    const messages: Record<EnergyLevel, string[]> = {
      sluggish: [
        "Remember: starting is the hardest part. Just begin, even if it's small.",
        "It's okay to go slowly. Momentum builds over time, not all at once.",
        "One tiny step forward is still progress. Be gentle with yourself.",
        "Low energy days are normal. Give yourself permission to work differently today."
      ],
      wired: [
        "Channel your energy into one thing at a time. Your enthusiasm is your superpower.",
        "Take it one step at a time. Your racing mind can focus when given the right challenge.",
        "Harness that energy for brief, powerful bursts of focus.",
        "Your energy can power through this. Just aim it in one direction."
      ],
      energized: [
        "Great energy today! Ride this wave while being mindful not to burn out.",
        "You're in the zone! Remember to pause briefly between tasks to maintain this flow.",
        "This is your time to shine. Trust your capabilities and follow through.",
        "Your energy is your ally today. Direct it purposefully and you'll accomplish great things."
      ],
      anxious: [
        "It's okay to feel anxious. Focus on what you can control right now.",
        "One small step is all you need. The worry often fades when we start.",
        "Your worth isn't measured by productivity. Be kind to yourself today.",
        "Anxiety is just energy waiting for direction. Let's channel it purposefully."
      ],
      balanced: [
        "This balanced energy is perfect for steady progress. Trust your pace.",
        "Today is a good day for meaningful work. You've got this.",
        "Steady and consistent wins the race. You're in a great mindset for progress.",
        "This balanced state is your sweet spot for focus. Make the most of it!"
      ]
    };
    
    return messages[energyLevel][Math.floor(Math.random() * messages[energyLevel].length)];
  }
  
  /**
   * Generate encouragement tailored to the current energy level
   */
  private static generateEncouragement(energyLevel: EnergyLevel): string {
    const encouragements: Record<EnergyLevel, string[]> = {
      sluggish: [
        "Just focus on getting started",
        "Small progress is still progress",
        "It's okay to work at a slower pace today",
        "One step at a time"
      ],
      wired: [
        "Channel that energy into this one task",
        "Let's harness that restlessness",
        "This is perfect for your quick mind",
        "Focus this energy right here"
      ],
      energized: [
        "Great time to tackle this",
        "Your energy is perfect for this",
        "You're on a roll!",
        "Keep that momentum going"
      ],
      anxious: [
        "This task has clear steps to follow",
        "You've got this - one piece at a time",
        "Focus here to calm your mind",
        "Just this one task for now"
      ],
      balanced: [
        "You're in a great state for this",
        "Steady focus works wonders",
        "Perfect mindset for this task",
        "You've got the right energy for this"
      ]
    };
    
    return encouragements[energyLevel][Math.floor(Math.random() * encouragements[energyLevel].length)];
  }
  
  /**
   * Format a focus session plan for display
   */
  static formatPlan(plan: FocusSessionPlan): string {
    let output = `# Your Personalized Focus Session\n`;
    output += `Time Available: ${plan.totalTime} minutes\n`;
    output += `Current Mood: ${plan.tasks[0]?.encouragement || 'Ready to focus'}\n\n`;
    
    output += `Tasks:\n`;
    plan.tasks.forEach(task => {
      output += `- Task: (${task.durationMinutes} min) - ${task.title} - ${task.encouragement}\n`;
    });
    
    output += `- Break: ${plan.breakTime} min - ${plan.breakSuggestion}\n\n`;
    
    output += `Sensory Boost: ${plan.sensoryBoost}\n\n`;
    
    output += `Motivational Message: "${plan.motivationalMessage}"\n`;
    
    return output;
  }
  
  /**
   * Process a natural language query to generate a focus session
   */
  static processQuery(query: string): FocusSessionPlan | null {
    // Extract energy level
    let energyLevel: EnergyLevel = 'balanced';
    if (query.includes('tired') || query.includes('exhausted') || query.includes('sluggish')) {
      energyLevel = 'sluggish';
    } else if (query.includes('wired') || query.includes('restless') || query.includes('can\'t sit still')) {
      energyLevel = 'wired';
    } else if (query.includes('energized') || query.includes('motivated') || query.includes('excited')) {
      energyLevel = 'energized';
    } else if (query.includes('anxious') || query.includes('worried') || query.includes('stressed')) {
      energyLevel = 'anxious';
    }
    
    // Extract time available
    let timeAvailable: TimeAvailable = 30;
    if (query.includes('15') || query.includes('fifteen')) {
      timeAvailable = 15;
    } else if (query.includes('30') || query.includes('thirty') || query.includes('half hour')) {
      timeAvailable = 30;
    } else if (query.includes('45') || query.includes('forty-five')) {
      timeAvailable = 45;
    } else if (query.includes('60') || query.includes('hour') || query.includes('sixty')) {
      timeAvailable = 60;
    }
    
    // Extract focus area
    let focusArea: FocusArea = 'any';
    if (query.includes('creative') || query.includes('art') || query.includes('write') || query.includes('writing')) {
      focusArea = 'creative';
    } else if (query.includes('analytical') || query.includes('analysis') || query.includes('data') || query.includes('research')) {
      focusArea = 'analytical';
    } else if (query.includes('admin') || query.includes('email') || query.includes('organize')) {
      focusArea = 'admin';
    }
    
    // Generate the plan
    return this.generateFocusSessionPlan(energyLevel, timeAvailable, focusArea);
  }
}