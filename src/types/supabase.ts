export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: string
          habit_reminders: boolean
          task_view_mode: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          habit_reminders?: boolean
          task_view_mode?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          habit_reminders?: boolean
          task_view_mode?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string | null
          priority: 'low' | 'medium' | 'high'
          status: 'pending' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          frequency: 'daily' | 'weekly' | 'monthly'
          time_of_day: 'morning' | 'afternoon' | 'evening' | 'anytime'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'monthly'
          time_of_day?: 'morning' | 'afternoon' | 'evening' | 'anytime'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'monthly'
          time_of_day?: 'morning' | 'afternoon' | 'evening' | 'anytime'
          created_at?: string
          updated_at?: string
        }
      }
      habit_completions: {
        Row: {
          id: string
          habit_id: string
          completed_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          completed_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          completed_at?: string
        }
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          start_time: string
          end_time: string
          location: string | null
          google_event_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          start_time: string
          end_time: string
          location?: string | null
          google_event_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          start_time?: string
          end_time?: string
          location?: string | null
          google_event_id?: string | null
          created_at?: string
        }
      }
      focus_sessions: {
        Row: {
          id: string
          user_id: string
          energy_level: string
          duration: number
          tasks_completed: number
          reflection: string | null
          satisfaction_rating: number | null
          barriers: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          energy_level: string
          duration: number
          tasks_completed?: number
          reflection?: string | null
          satisfaction_rating?: number | null
          barriers?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          energy_level?: string
          duration?: number
          tasks_completed?: number
          reflection?: string | null
          satisfaction_rating?: number | null
          barriers?: string[] | null
          created_at?: string
        }
      }
    }
  }
}

export type Task = Database['public']['Tables']['tasks']['Row'];
export type Habit = Database['public']['Tables']['habits']['Row'];
export type HabitCompletion = Database['public']['Tables']['habit_completions']['Row'];
export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];
export type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];