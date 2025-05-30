import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { isValidUUID } from '../utils/validation';
import { safeUUID } from '../utils/serviceHelpers';

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];

export const getCalendarEvents = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ data: CalendarEvent[] | null; error: Error | null }> => {
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
    
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });
    
    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }
    
    if (endDate) {
      query = query.lte('start_time', endDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return { data: null, error: error as Error };
  }
};

export const syncGoogleCalendar = async (
  accessToken: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      throw new Error('User not authenticated');
    }
    
    const userToken = authData.session.access_token;
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-calendar`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessToken })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync calendar');
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error syncing calendar:', error);
    return { success: false, error: error as Error };
  }
};