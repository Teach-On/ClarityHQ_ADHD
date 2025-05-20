import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { isValidUUID } from '../utils/validation';
import { safeUUID } from '../utils/serviceHelpers';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export const getTasks = async (
  userId: string,
  filter: 'today' | 'all' = 'all'
): Promise<{ data: Task[] | null; error: Error | null }> => {
  try {
    // Always ensure userId is a valid UUID format
    if (!isValidUUID(userId)) {
      console.warn('Invalid UUID format for user_id:', userId);
      
      // In development, use a safe UUID instead
      if (import.meta.env.DEV) {
        userId = safeUUID(userId);
      } else {
        throw new Error('Invalid UUID format for user_id');
      }
    }
    
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    
    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query = query
        .gte('due_date', today.toISOString())
        .lt('due_date', tomorrow.toISOString());
    }
    
    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { data: null, error: error as Error };
  }
};

export const createTask = async (
  task: TaskInsert
): Promise<{ data: Task | null; error: Error | null }> => {
  try {
    console.log('Creating task with data:', task);
    
    // Validate required fields
    if (!task.user_id) {
      throw new Error('Missing user_id in task data');
    }
    
    // Always ensure user_id is a valid UUID format for RLS policies to work
    if (!isValidUUID(task.user_id)) {
      console.warn('Invalid UUID format for user_id in task:', task.user_id);
      
      // In development, use a safe UUID instead
      if (import.meta.env.DEV) {
        task = {
          ...task,
          user_id: safeUUID(task.user_id)
        };
        console.log('Using safe UUID for development:', task.user_id);
      } else {
        throw new Error('Invalid UUID format for user_id');
      }
    }
    
    if (!task.title || !task.title.trim()) {
      throw new Error('Task title is required');
    }
    
    // Check if we have an auth session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.warn('No active auth session when creating task');
      // Continue anyway if in development mode
      if (!import.meta.env.DEV) {
        throw new Error('Authentication required to create tasks');
      }
    } else {
      // Verify auth.uid() matches task.user_id to avoid RLS issues
      const authUserId = sessionData.session.user.id;
      
      // In production, enforce strict matching
      if (!import.meta.env.DEV && authUserId !== task.user_id) {
        throw new Error('Task user_id does not match authenticated user');
      }
    }
    
    // Insert the task
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating task:', error);
      throw error;
    }
    
    if (!data) {
      console.error('No data returned from task creation');
      throw new Error('Failed to create task - no data returned');
    }
    
    console.log('Task created successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error creating task:', error);
    return { data: null, error: error as Error };
  }
};

export const updateTask = async (
  id: string,
  updates: TaskUpdate
): Promise<{ data: Task | null; error: Error | null }> => {
  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        id = safeUUID(id);
      } else {
        throw new Error('Invalid UUID format for task id');
      }
    }
    
    // If user_id is being updated, validate it too
    if (updates.user_id && !isValidUUID(updates.user_id)) {
      if (import.meta.env.DEV) {
        updates = {
          ...updates,
          user_id: safeUUID(updates.user_id)
        };
      } else {
        throw new Error('Invalid UUID format for user_id');
      }
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating task:', error);
    return { data: null, error: error as Error };
  }
};

export const deleteTask = async (
  id: string
): Promise<{ error: Error | null }> => {
  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      // In development, try to use a safe UUID instead
      if (import.meta.env.DEV) {
        id = safeUUID(id);
      } else {
        throw new Error('Invalid UUID format for task id');
      }
    }
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { error: error as Error };
  }
};