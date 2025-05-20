/*
  # Focus Sessions Table

  1. New Tables
    - `focus_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `energy_level` (text)
      - `duration` (integer)
      - `tasks_completed` (integer)
      - `reflection` (text, optional)
      - `satisfaction_rating` (integer, optional)
      - `barriers` (text[], optional)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on `focus_sessions` table
    - Add policies for authenticated users to manage their own sessions
*/

-- Create focus_sessions table
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  energy_level text NOT NULL,
  duration integer NOT NULL,
  tasks_completed integer DEFAULT 0,
  reflection text,
  satisfaction_rating integer,
  barriers text[],
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable row level security
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