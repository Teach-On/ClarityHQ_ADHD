/*
  # Add reflections to focus_sessions table
  
  This migration ensures the focus_sessions table exists and has fields to store
  user reflections and session feedback.

  1. New Tables (if not exists)
    - `focus_sessions`
      - `id` (uuid)
      - `user_id` (uuid)
      - `energy_level` (text)
      - `duration` (integer)
      - `tasks_completed` (integer)
      - `reflection` (text)
      - `satisfaction_rating` (integer)
      - `barriers` (text[])
      - `created_at` (timestamptz)
      
  2. Security
    - Enable RLS on `focus_sessions` table
    - Add policies for authenticated users to manage their own focus sessions
*/

-- Create focus_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  energy_level text NOT NULL,
  duration integer NOT NULL,
  tasks_completed integer DEFAULT 0,
  reflection text,
  satisfaction_rating integer CHECK (satisfaction_rating BETWEEN 1 AND 5),
  barriers text[],
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable row level security
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can insert their own focus sessions'
  ) THEN
    CREATE POLICY "Users can insert their own focus sessions" 
      ON public.focus_sessions 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can read their own focus sessions'
  ) THEN
    CREATE POLICY "Users can read their own focus sessions" 
      ON public.focus_sessions 
      FOR SELECT 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'focus_sessions' AND policyname = 'Users can update their own focus sessions'
  ) THEN
    CREATE POLICY "Users can update their own focus sessions" 
      ON public.focus_sessions 
      FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = user_id);
  END IF;

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