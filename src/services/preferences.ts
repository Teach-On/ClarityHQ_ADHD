import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { isValidUUID } from '../utils/validation';
import { safeUUID } from '../utils/serviceHelpers';

type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

export const createUserPreferences = async (
  preferences: UserPreferencesInsert
): Promise<{ data: UserPreferences | null; error: Error | null }> => {
  try {
    console.log('Creating user preferences for:', preferences.user_id);
    
    // Validate UUID format
    if (!isValidUUID(preferences.user_id)) {
      console.warn('Invalid UUID format for user_id:', preferences.user_id);
      
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        preferences.user_id = safeUUID(preferences.user_id);
      } else {
        throw new Error('Invalid UUID format for user_id');
      }
    }
    
    // First check if preferences already exist for this user
    const { data: existingPrefs, error: checkError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', preferences.user_id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing preferences:', checkError);
      throw checkError;
    }
    
    if (existingPrefs) {
      console.log('Found existing preferences, updating instead of creating');
      // If preferences exist, update them instead of creating new ones
      const { data: updatedPrefs, error: updateError } = await supabase
        .from('user_preferences')
        .update({
          theme: preferences.theme,
          habit_reminders: preferences.habit_reminders,
          task_view_mode: preferences.task_view_mode,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPrefs.id)
        .select()
        .maybeSingle();
      
      if (updateError) throw updateError;
      console.log('Preferences updated successfully');
      return { data: updatedPrefs, error: null };
    } else {
      console.log('No existing preferences found, creating new record');
      // If no preferences exist, create new ones
      const { data, error } = await supabase
        .from('user_preferences')
        .insert(preferences)
        .select()
        .maybeSingle();

      if (error) throw error;
      console.log('New preferences created successfully');
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error creating/updating user preferences:', error);
    return { data: null, error: error as Error };
  }
};

export const updateUserPreferences = async (
  id: string,
  updates: UserPreferencesUpdate
): Promise<{ data: UserPreferences | null; error: Error | null }> => {
  try {
    console.log('Updating preferences with ID:', id);
    
    // Validate UUID format
    if (!isValidUUID(id)) {
      console.warn('Invalid UUID format for preference id:', id);
      
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        id = safeUUID(id);
      } else {
        throw new Error('Invalid UUID format for preference id');
      }
    }
    
    // Validate user_id if it's being updated
    if (updates.user_id && !isValidUUID(updates.user_id)) {
      console.warn('Invalid UUID format for user_id in update:', updates.user_id);
      
      if (import.meta.env.DEV) {
        updates.user_id = safeUUID(updates.user_id);
      } else {
        throw new Error('Invalid UUID format for user_id');
      }
    }
    
    // First check if preferences exist with this ID
    const { data: existingPrefs, error: checkError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing preferences:', checkError);
      throw checkError;
    }
    
    if (!existingPrefs) {
      console.error('No preferences found with ID:', id);
      return { 
        data: null, 
        error: new Error(`No preferences found with ID: ${id}`) 
      };
    }
    
    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    
    console.log('Preferences updated successfully');
    return { data, error: null };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return { data: null, error: error as Error };
  }
};

export const getUserPreferences = async (
  userId: string
): Promise<{ data: UserPreferences | null; error: Error | null }> => {
  try {
    console.log('Fetching preferences for user:', userId);
    
    // Validate UUID before querying
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
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error in getUserPreferences query:', error);
      throw error;
    }
    
    if (data) {
      console.log('Preferences found for user');
    } else {
      console.log('No preferences found for user');
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return { data: null, error: error as Error };
  }
};