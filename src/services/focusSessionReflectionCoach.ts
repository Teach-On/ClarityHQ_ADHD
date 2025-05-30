/**
 * Focus Session Reflection Coach
 * 
 * This service provides supportive, ADHD-friendly reflection prompts and
 * growth-oriented messages for users after completing focus sessions.
 */

export class FocusSessionReflectionCoach {
  /**
   * Get an appropriate reflection prompt based on session results
   */
  static getReflectionPrompt(
    completedTasks: number,
    totalTasks: number,
    focusTime: number
  ): string {
    // Calculate completion percentage
    const progressPercentage = totalTasks > 0 
      ? (completedTasks / totalTasks) * 100 
      : 0;
    
    // Determine prompt type based on completion percentage
    if (progressPercentage >= 75) {
      // High completion - ask what worked
      return this.getHighCompletionPrompt();
    } else if (progressPercentage >= 25) {
      // Partial completion - balanced prompt
      return this.getPartialCompletionPrompt();
    } else {
      // Low/no completion - compassionate prompt
      return this.getLowCompletionPrompt(focusTime);
    }
  }
  
  /**
   * Get a celebration message based on session results
   */
  static getCelebration(
    completedTasks: number,
    totalTasks: number,
    focusTime: number
  ): string {
    // Just showing up is worth celebrating
    if (completedTasks === 0 && totalTasks > 0) {
      return `You dedicated ${focusTime} minutes to focus time today. That's a win!`;
    }
    
    // Completed some tasks
    if (completedTasks > 0 && completedTasks < totalTasks) {
      return `You focused for ${focusTime} minutes and made progress. That's what matters!`;
    }
    
    // Completed all tasks
    if (completedTasks > 0 && completedTasks === totalTasks) {
      return `You completed everything you set out to do. Amazing focus!`;
    }
    
    // Default
    return `You spent ${focusTime} minutes building your focus muscle. Every minute counts!`;
  }
  
  /**
   * Get a growth-oriented message regardless of session outcome
   */
  static getGrowthMessage(progressPercentage: number): string {
    const messages = [
      // General growth messages
      "Every focus session builds your 'focusing muscle' - even the challenging ones.",
      "The fact that you tried a focus session shows commitment to your growth.",
      "Focus is a skill that develops with practice, not perfection.",
      "Each session teaches your brain something new about how you focus best.",
      
      // ADHD-specific growth messages
      "With ADHD, some days are easier than others. What matters is showing up.",
      "Your brain's unique wiring means some focus sessions will feel different than others.",
      "Small improvements in focus add up over time, especially with ADHD.",
      "Remember: progress isn't linear, especially for neurodivergent brains.",
      
      // Encouraging next steps
      "What tiny thing might make your next session 1% better?",
      "Notice what helped today, even if it was just a small thing.",
      "Every data point helps you understand your unique focus patterns.",
      "Your future self thanks you for putting in the practice today."
    ];
    
    // Return a random message, weighted by context
    let messagePool: string[];
    if (progressPercentage >= 75) {
      // Success-oriented messages for high completion
      messagePool = messages.filter((_, i) => i < 4);
    } else if (progressPercentage >= 25) {
      // Balance of general and ADHD-specific for medium completion
      messagePool = messages.filter((_, i) => i >= 0 && i < 8);
    } else {
      // More encouraging messages for low completion
      messagePool = messages.filter((_, i) => i >= 4);
    }
    
    return messagePool[Math.floor(Math.random() * messagePool.length)];
  }
  
  /**
   * Private methods for generating specific types of prompts
   */
  
  private static getHighCompletionPrompt(): string {
    const prompts = [
      "What helped you stay focused today?",
      "What was different about today that helped you focus well?",
      "Notice anything that made this session work well for you?",
      "What's one thing from this session you'd like to repeat next time?",
      "What helped you maintain momentum through this session?"
    ];
    
    return prompts[Math.floor(Math.random() * prompts.length)];
  }
  
  private static getPartialCompletionPrompt(): string {
    const prompts = [
      "What's one thing that worked, even briefly?",
      "When did you feel most focused during this session?",
      "What's one small thing you noticed about how you focus?",
      "Was there a moment when things clicked? What happened right before?",
      "What would make the next focus session 10% better?"
    ];
    
    return prompts[Math.floor(Math.random() * prompts.length)];
  }
  
  private static getLowCompletionPrompt(focusTime: number): string {
    const prompts = [
      "Focus sessions can be tough. What might help next time?",
      `You showed up and tried for ${focusTime} minutes. What did you learn?`,
      "What's one tiny adjustment that might help next time?",
      "Focus is hard some days. What would feel supportive next time?",
      "Focus isn't always about what gets done. What did you notice about yourself today?"
    ];
    
    return prompts[Math.floor(Math.random() * prompts.length)];
  }
  
  /**
   * Get a supportive response to a specific reflection
   */
  static getResponseToReflection(reflection: string): string {
    // This would be expanded in a real implementation to analyze 
    // the content of the reflection and provide personalized feedback
    
    if (!reflection || reflection.trim().length === 0) {
      return "That's okay! Reflection is optional. What matters is that you tried a focus session.";
    }
    
    // Simple keyword detection
    if (reflection.toLowerCase().includes("distract")) {
      return "Noticing distractions is actually a big step. Each time you catch yourself getting distracted, your awareness grows.";
    }
    
    if (reflection.toLowerCase().includes("hard") || reflection.toLowerCase().includes("difficult")) {
      return "It takes courage to acknowledge when things are hard. That self-awareness is really valuable.";
    }
    
    if (reflection.toLowerCase().includes("help") || reflection.toLowerCase().includes("worked")) {
      return "Great noticing! Identifying what helps you is one of the most valuable skills for managing focus.";
    }
    
    // Default supportive response
    return "Thank you for reflecting. These insights help you build better focus habits over time.";
  }
  
  /**
   * Get a motivational quote related to focus, growth, or ADHD
   */
  static getMotivationalQuote(): string {
    const quotes = [
      "The goal isn't perfect focus; it's progress and self-understanding.",
      "Focus isn't about forcing your brain to behave; it's about finding your flow.",
      "Every focus session is an experiment, not a test.",
      "Progress happens in small moments of clarity, not giant leaps.",
      "Your neurodivergent brain is learning with each session, even when it doesn't feel like it.",
      "In a world of distractions, simply showing up is a radical act.",
      "The most useful skill isn't perfect focus - it's learning how to refocus when you get distracted.",
      "Sometimes the biggest wins come from the smallest adjustments to your environment.",
      "Your brain is uniquely wired. Your path to focus will be uniquely yours."
    ];
    
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
}