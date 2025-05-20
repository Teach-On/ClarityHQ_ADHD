import { supabase } from '../lib/supabase';
import { FocusSession } from '../types/supabase';
import { isValidUUID } from '../utils/validation';
import { safeUUID } from '../utils/serviceHelpers';

export interface FocusSessionInsert {
  user_id: string;
  energy_level: string;
  duration: number;
  tasks_completed?: number;
  reflection?: string | null;
  satisfaction_rating?: number | null;
  barriers?: string[] | null;
}

export interface FocusSessionUpdate {
  energy_level?: string;
  duration?: number;
  tasks_completed?: number;
  reflection?: string | null;
  satisfaction_rating?: number | null;
  barriers?: string[] | null;
}

export interface FocusSessionReflectionData {
  satisfaction_rating?: number | null;
  reflection?: string | null;
  barriers?: string[] | null;
  tasks_completed: number;
}

export interface FocusSessionStats {
  total_sessions: number;
  total_time: number;
  avg_satisfaction: number | null;
  common_barriers: string[] | null;
}

/**
 * Create a new focus session
 */
export const createFocusSession = async (
  sessionData: FocusSessionInsert
): Promise<{ data: FocusSession | null; error: Error | null }> => {
  try {
    // Validate UUID before sending to database
    if (!isValidUUID(sessionData.user_id)) {
      console.warn('Invalid UUID format for user_id:', sessionData.user_id);
      
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        sessionData.user_id = safeUUID(sessionData.user_id);
      } else {
        throw new Error('Invalid UUID format for user_id');
      }
    }
    
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating focus session:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get all focus sessions for a user
 */
export const getFocusSessions = async (
  userId: string
): Promise<{ data: FocusSession[] | null; error: Error | null }> => {
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
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching focus sessions:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get a specific focus session by ID
 */
export const getFocusSession = async (
  sessionId: string
): Promise<{ data: FocusSession | null; error: Error | null }> => {
  try {
    // Validate UUID before sending to database
    if (!isValidUUID(sessionId)) {
      console.warn('Invalid UUID format for session id:', sessionId);
      
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        sessionId = safeUUID(sessionId);
      } else {
        throw new Error('Invalid UUID format for session id');
      }
    }
    
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching focus session:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Update a focus session with reflection data
 */
export const saveFocusSessionReflection = async (
  sessionId: string,
  reflectionData: FocusSessionReflectionData
): Promise<{ data: FocusSession | null; error: Error | null }> => {
  try {
    // Validate UUID before sending to database
    if (!isValidUUID(sessionId)) {
      console.warn('Invalid UUID format for session id:', sessionId);
      
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        sessionId = safeUUID(sessionId);
      } else {
        throw new Error('Invalid UUID format for session id');
      }
    }
    
    const { reflection, satisfaction_rating, barriers, tasks_completed } = reflectionData;
    
    // Ensure all values have proper types before updating
    const updateData: FocusSessionUpdate = {
      reflection: reflection || null,
      satisfaction_rating: 
        satisfaction_rating !== undefined ? 
          (typeof satisfaction_rating === 'number' ? satisfaction_rating : null) : 
          null,
      barriers: Array.isArray(barriers) ? barriers : null,
      tasks_completed: 
        tasks_completed !== undefined ? 
          (typeof tasks_completed === 'number' ? tasks_completed : 0) : 
          0
    };

    const { data, error } = await supabase
      .from('focus_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating focus session reflection:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get focus session stats for a user
 */
export const getFocusSessionStats = async (
  userId: string
): Promise<{ 
  data: FocusSessionStats | null; 
  error: Error | null 
}> => {
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
    
    // Get all sessions for this user
    const { data: sessions, error } = await supabase
      .from('focus_sessions')
      .select('duration, satisfaction_rating, barriers, tasks_completed')
      .eq('user_id', userId);

    if (error) throw error;
    
    if (!sessions || sessions.length === 0) {
      return { 
        data: { 
          total_sessions: 0,
          total_time: 0,
          avg_satisfaction: null,
          common_barriers: null
        }, 
        error: null 
      };
    }
    
    // Calculate stats
    const totalSessions = sessions.length;
    const totalTime = sessions.reduce((sum, session) => {
      // Make sure duration is a number
      const duration = typeof session.duration === 'number' ? session.duration : 0;
      return sum + duration;
    }, 0);
    
    // Calculate average satisfaction rating
    let avgSatisfaction = null;
    const satisfactionRatings = sessions
      .map(s => s.satisfaction_rating)
      .filter((rating): rating is number => 
        rating !== null && rating !== undefined && typeof rating === 'number');
    
    if (satisfactionRatings.length > 0) {
      avgSatisfaction = satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length;
    }
    
    // Find common barriers
    let commonBarriers: string[] | null = null;
    const barrierCounts: Record<string, number> = {};
    
    // Count occurrences of each barrier
    sessions.forEach(session => {
      if (session.barriers && Array.isArray(session.barriers)) {
        session.barriers.forEach(barrier => {
          if (typeof barrier === 'string') {
            barrierCounts[barrier] = (barrierCounts[barrier] || 0) + 1;
          }
        });
      }
    });
    
    // Get the most common barriers (top 3)
    if (Object.keys(barrierCounts).length > 0) {
      commonBarriers = Object.entries(barrierCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([barrier]) => barrier);
    }
    
    return {
      data: {
        total_sessions: totalSessions,
        total_time: totalTime,
        avg_satisfaction: avgSatisfaction,
        common_barriers: commonBarriers
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting focus session stats:', error);
    return { data: null, error: error as Error };
  }
};