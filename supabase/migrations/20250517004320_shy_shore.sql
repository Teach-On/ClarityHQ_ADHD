/*
  # Fix focus_sessions table

  This migration fixes the focus_sessions table by:
  1. Dropping the existing table if it exists
  2. Creating a new table with a consistent schema
  3. Setting up proper constraints and RLS policies

  This ensures all column types are correct and prevents type conversion errors.
*/

-- Drop the existing table if it exists
DROP TABLE IF EXISTS public.focus_sessions;

-- Create the focus_sessions table with the correct schema
CREATE TABLE public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  energy_level text NOT NULL,
  duration integer NOT NULL,
  tasks_completed integer DEFAULT 0,
  reflection text,
  satisfaction_rating integer,
  barriers text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  -- Add constraint to ensure satisfaction_rating is between 1 and 5 when not null
  CONSTRAINT focus_sessions_satisfaction_rating_check 
    CHECK (satisfaction_rating IS NULL OR (satisfaction_rating BETWEEN 1 AND 5))
);

-- Enable RLS on the table
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own focus sessions" 
  ON public.focus_sessions 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own focus sessions" 
  ON public.focus_sessions 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own focus sessions" 
  ON public.focus_sessions 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus sessions" 
  ON public.focus_sessions 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);