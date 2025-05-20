/*
  # Focus Sessions Table Update

  1. Changes
    - Create focus_sessions table with required fields
    - Add constraints and row level security
    - Enable policies for user management of their own sessions
  
  2. Fields
    - session_id (uuid, primary key)
    - user_id (uuid, foreign key to auth.users)
    - energy_level (text)
    - session_length (minutes, integer)
    - tasks_planned (text)
    - tasks_completed (integer, optional)
    - reflection_response (text, optional)
    - date_created (timestamp)
*/

-- Create focus_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  energy_level text NOT NULL,
  session_length integer NOT NULL,
  tasks_planned text NOT NULL,
  tasks_completed integer DEFAULT 0,
  reflection_response text,
  date_created timestamptz DEFAULT now() NOT NULL
);

-- Enable row level security
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Insert policy
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can insert their own focus sessions'
  ) THEN
    CREATE POLICY "Users can insert their own focus sessions" 
      ON public.focus_sessions 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Select policy
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can read their own focus sessions'
  ) THEN
    CREATE POLICY "Users can read their own focus sessions" 
      ON public.focus_sessions 
      FOR SELECT 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can update their own focus sessions'
  ) THEN
    CREATE POLICY "Users can update their own focus sessions" 
      ON public.focus_sessions 
      FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can delete their own focus sessions'
  ) THEN
    CREATE POLICY "Users can delete their own focus sessions" 
      ON public.focus_sessions 
      FOR DELETE 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;
END $$;