import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { isValidUUID } from '../utils/validation';
import { safeUUID } from '../utils/serviceHelpers';

type Habit = Database['public']['Tables']['habits']['Row'];
type HabitInsert = Database['public']['Tables']['habits']['Insert'];
type HabitUpdate = Database['public']['Tables']['habits']['Update'];
type HabitCompletion = Database['public']['Tables']['habit_completions']['Row'];
type HabitCompletionInsert = Database['public']['Tables']['habit_completions']['Insert'];

export const getHabits = async (
  userId: string
): Promise<{ data: Habit[] | null; error: Error | null }> => {
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
    
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching habits:', error);
    return { data: null, error: error as Error };
  }
};

export const getHabitsWithCompletions = async (
  userId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{ data: (Habit & { completions: HabitCompletion[] })[] | null; error: Error | null }> => {
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
    
    // First get all habits for the user
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (habitsError) throw habitsError;
    if (!habits) return { data: null, error: null };

    // Now for each habit, get its completions
    const habitsWithCompletions = await Promise.all(
      habits.map(async (habit) => {
        let query = supabase
          .from('habit_completions')
          .select('*')
          .eq('habit_id', habit.id);

        if (dateFrom) {
          query = query.gte('completed_at', dateFrom);
        }

        if (dateTo) {
          query = query.lte('completed_at', dateTo);
        }

        const { data: completions, error: completionsError } = await query;

        if (completionsError) throw completionsError;
        
        return {
          ...habit,
          completions: completions || []
        };
      })
    );

    return { data: habitsWithCompletions, error: null };
  } catch (error) {
    console.error('Error fetching habits with completions:', error);
    return { data: null, error: error as Error };
  }
};

export const createHabit = async (
  habit: HabitInsert
): Promise<{ data: Habit | null; error: Error | null }> => {
  try {
    // Validate required fields
    if (!habit.user_id) {
      throw new Error('Missing user_id in habit data');
    }
    
    // Validate UUID before sending to database
    if (!isValidUUID(habit.user_id)) {
      console.warn('Invalid UUID format for user_id in habit:', habit.user_id);
      
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        habit.user_id = safeUUID(habit.user_id);
      } else {
        throw new Error('Invalid UUID format for user_id');
      }
    }
    
    if (!habit.title || !habit.title.trim()) {
      throw new Error('Habit title is required');
    }
    
    const { data, error } = await supabase
      .from('habits')
      .insert(habit)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating habit:', error);
    return { data: null, error: error as Error };
  }
};

export const updateHabit = async (
  id: string,
  updates: HabitUpdate
): Promise<{ data: Habit | null; error: Error | null }> => {
  try {
    // Validate UUID before sending to database
    if (!isValidUUID(id)) {
      console.warn('Invalid UUID format for habit id:', id);
      
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        id = safeUUID(id);
      } else {
        throw new Error('Invalid UUID format for habit id');
      }
    }
    
    // Validate user_id if it's being updated
    if (updates.user_id && !isValidUUID(updates.user_id)) {
      console.warn('Invalid UUID format for user_id in habit update:', updates.user_id);
      
      if (import.meta.env.DEV) {
        updates.user_id = safeUUID(updates.user_id);
      } else {
        throw new Error('Invalid UUID format for user_id');
      }
    }
    
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating habit:', error);
    return { data: null, error: error as Error };
  }
};

export const deleteHabit = async (
  id: string
): Promise<{ error: Error | null }> => {
  try {
    // Validate UUID before sending to database
    if (!isValidUUID(id)) {
      console.warn('Invalid UUID format for habit id:', id);
      
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        id = safeUUID(id);
      } else {
        throw new Error('Invalid UUID format for habit id');
      }
    }
    
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting habit:', error);
    return { error: error as Error };
  }
};

export const completeHabit = async (
  habitId: string
): Promise<{ data: HabitCompletion | null; error: Error | null }> => {
  try {
    // Validate UUID before sending to database
    if (!isValidUUID(habitId)) {
      console.warn('Invalid UUID format for habit id:', habitId);
      
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        habitId = safeUUID(habitId);
      } else {
        throw new Error('Invalid UUID format for habit id');
      }
    }
    
    const { data, error } = await supabase
      .from('habit_completions')
      .insert({ habit_id: habitId })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error completing habit:', error);
    return { data: null, error: error as Error };
  }
};

export const uncompleteHabit = async (
  habitId: string,
  date: Date
): Promise<{ error: Error | null }> => {
  try {
    // Validate UUID before sending to database
    if (!isValidUUID(habitId)) {
      console.warn('Invalid UUID format for habit id:', habitId);
      
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        habitId = safeUUID(habitId);
      } else {
        throw new Error('Invalid UUID format for habit id');
      }
    }
    
    // Get the ISO date format for the beginning and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .gte('completed_at', startOfDay.toISOString())
      .lte('completed_at', endOfDay.toISOString());

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error uncompleting habit:', error);
    return { error: error as Error };
  }
};