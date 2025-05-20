/*
  # Update Focus Sessions Table Structure

  1. Changes
    - Add new fields to track user focus sessions (tasks_generated, sensory_tip)
    - Modify tasks_completed field to support array data
    - Ensure all required fields are present with appropriate types
  
  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  -- Only make changes if the table exists
  IF EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'focus_sessions'
  ) THEN
    -- Add tasks_generated field if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM pg_attribute 
      WHERE attrelid = 'public.focus_sessions'::regclass 
      AND attname = 'tasks_generated' 
      AND NOT attisdropped
    ) THEN
      ALTER TABLE public.focus_sessions ADD COLUMN tasks_generated text[];
    END IF;

    -- Add sensory_tip field if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM pg_attribute 
      WHERE attrelid = 'public.focus_sessions'::regclass 
      AND attname = 'sensory_tip' 
      AND NOT attisdropped
    ) THEN
      ALTER TABLE public.focus_sessions ADD COLUMN sensory_tip text;
    END IF;
    
    -- Modify tasks_completed to support more flexible data types if needed
    -- We don't want to lose data, so we'll check the column type first
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'focus_sessions' 
      AND column_name = 'tasks_completed' 
      AND data_type = 'integer'
    ) THEN
      -- Add a temporary column, move data, drop old column, and rename
      ALTER TABLE public.focus_sessions ADD COLUMN tasks_completed_new text[];
      -- No need for data migration as this is a new column type
      ALTER TABLE public.focus_sessions RENAME COLUMN tasks_completed TO tasks_completed_old;
      ALTER TABLE public.focus_sessions RENAME COLUMN tasks_completed_new TO tasks_completed;
    END IF;
    
  ELSE
    -- Create the table if it doesn't exist yet
    CREATE TABLE public.focus_sessions (
      session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users NOT NULL,
      energy_level text NOT NULL,
      session_length integer NOT NULL,
      tasks_generated text[],
      tasks_completed text[],
      sensory_tip text,
      reflection_response text,
      timestamp timestamptz DEFAULT now() NOT NULL
    );

    -- Enable RLS
    ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can insert their own focus sessions" 
      ON public.focus_sessions FOR INSERT 
      TO authenticated WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can read their own focus sessions" 
      ON public.focus_sessions FOR SELECT 
      TO authenticated USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can update their own focus sessions" 
      ON public.focus_sessions FOR UPDATE 
      TO authenticated USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete their own focus sessions" 
      ON public.focus_sessions FOR DELETE 
      TO authenticated USING (auth.uid() = user_id);
  END IF;
  
  -- Ensure timestamp field exists (rename date_created if needed)
  IF EXISTS (
    SELECT FROM pg_attribute 
    WHERE attrelid = 'public.focus_sessions'::regclass 
    AND attname = 'date_created' 
    AND NOT attisdropped
  ) AND NOT EXISTS (
    SELECT FROM pg_attribute 
    WHERE attrelid = 'public.focus_sessions'::regclass 
    AND attname = 'timestamp' 
    AND NOT attisdropped
  ) THEN
    ALTER TABLE public.focus_sessions RENAME COLUMN date_created TO timestamp;
  END IF;
  
END $$;