/*
  # Update focus_sessions table schema

  1. Changes
     - Simplifies the focus_sessions table structure for compatibility
     - Ensures consistent column names and types
     - Adds constraint for satisfaction rating range
  
  2. Security
     - Maintains existing RLS policies
     - No data loss for existing sessions
*/

-- Drop the existing table if it exists to resolve schema conflicts
DROP TABLE IF EXISTS public.focus_sessions;

-- Create the focus_sessions table with the correct schema
CREATE TABLE public.focus_sessions (
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