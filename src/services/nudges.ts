import { supabase } from '../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Database } from '../types/supabase';
import { isValidUUID } from '../utils/validation';
import { safeUUID } from '../utils/serviceHelpers';

type Task = Database['public']['Tables']['tasks']['Row'];
type Habit = Database['public']['Tables']['habits']['Row'];
type HabitCompletion = Database['public']['Tables']['habit_completions']['Row'];

export type NudgeType = 'streak' | 'missed' | 'complete';

export interface Nudge {
  type: NudgeType;
  message: string;
  entityId?: string; // ID of the task or habit related to this nudge
}

export const generateNudges = async (
  userId: string
): Promise<{ nudges: Nudge[]; error: Error | null }> => {
  try {
    // Validate UUID before sending to database
    if (!isValidUUID(userId)) {
      console.warn('Invalid UUID format for user_id:', userId);
      
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        userId = safeUUID(userId);
      } else {
        throw new Error('Invalid UUID format for user_id');
      }
    }
    
    const nudges: Nudge[] = [];
    
    // 1. Check for missed tasks from yesterday
    const yesterday = subDays(new Date(), 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);
    
    const { data: missedTasks, error: missedTasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('due_date', yesterdayStart.toISOString())
      .lte('due_date', yesterdayEnd.toISOString());
    
    if (missedTasksError) throw missedTasksError;
    
    if (missedTasks && missedTasks.length > 0) {
      nudges.push({
        type: 'missed',
        message: `You have ${missedTasks.length} unfinished ${missedTasks.length === 1 ? 'task' : 'tasks'} from yesterday. Want to try again today?`
      });
    }
    
    // 2. Check for habit streaks
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);
    
    if (habitsError) throw habitsError;
    
    if (habits && habits.length > 0) {
      for (const habit of habits) {
        // Get completions for the last 5 days
        const fiveDaysAgo = subDays(startOfDay(new Date()), 5);
        
        const { data: completions, error: completionsError } = await supabase
          .from('habit_completions')
          .select('*')
          .eq('habit_id', habit.id)
          .gte('completed_at', fiveDaysAgo.toISOString())
          .order('completed_at', { ascending: false });
        
        if (completionsError) throw completionsError;
        
        if (completions && completions.length >= 3) {
          // Check if these completions form a consecutive 3-day streak
          const dateMap = new Map<string, boolean>();
          
          // Create a map of dates with completions
          for (const completion of completions) {
            const date = format(new Date(completion.completed_at), 'yyyy-MM-dd');
            dateMap.set(date, true);
          }
          
          // Check for 3 consecutive days
          let streakCount = 0;
          
          for (let i = 0; i < 3; i++) {
            const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
            if (dateMap.has(checkDate)) {
              streakCount++;
            } else {
              break; // Break the streak
            }
          }
          
          if (streakCount >= 3) {
            nudges.push({
              type: 'streak',
              message: `You're on a ${streakCount}-day streak with "${habit.title}"! You're building momentum!`,
              entityId: habit.id
            });
            break; // Just show one streak message to avoid overwhelming the user
          }
        }
      }
    }
    
    // 3. Check completed tasks today
    const today = new Date();
    const todayStart = startOfDay(today);
    
    const { data: completedToday, error: completedError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('updated_at', todayStart.toISOString());
    
    if (completedError) throw completedError;
    
    if (completedToday && completedToday.length >= 3) {
      nudges.push({
        type: 'complete',
        message: `Great job! You've completed ${completedToday.length} tasks today. Keep up the momentum!`
      });
    }
    
    return { nudges, error: null };
  } catch (error) {
    console.error('Error generating nudges:', error);
    return { nudges: [], error: error as Error };
  }
};