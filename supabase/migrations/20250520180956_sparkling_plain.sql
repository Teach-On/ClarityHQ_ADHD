/*
  # Art Gallery Schema Implementation

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, linked to auth.users)
      - `email` (text, unique)
      - `full_name` (text, nullable)
      - `role` (text, limited to 'teacher' or 'student')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `artworks`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text, nullable)
      - `image_url` (text)
      - `feedback` (text, nullable)
      - `status` (text: 'pending', 'analyzed', 'reviewed', 'completed')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `rubrics`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `rubric_scores`
      - `id` (uuid, primary key)
      - `artwork_id` (uuid, references artworks)
      - `criterion` (text)
      - `score` (integer, 0-5)
      - `feedback` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Create appropriate policies for teachers and students
*/

-- First create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  role text NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create artworks table
CREATE TABLE IF NOT EXISTS public.artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  feedback text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'reviewed', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for artworks
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

-- Create policies for artworks
CREATE POLICY "Students can create artworks"
  ON public.artworks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own artworks"
  ON public.artworks
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = student_id) OR 
         (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher')));

CREATE POLICY "Teachers can update artworks"
  ON public.artworks
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'));

-- Create rubrics table
CREATE TABLE IF NOT EXISTS public.rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for rubrics
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;

-- Create policies for rubrics
CREATE POLICY "Teachers can manage rubrics"
  ON public.rubrics
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'));

-- Create rubric scores table
CREATE TABLE IF NOT EXISTS public.rubric_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id uuid REFERENCES public.artworks(id) ON DELETE CASCADE,
  criterion text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 5),
  feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for rubric scores
ALTER TABLE public.rubric_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for rubric scores
CREATE POLICY "Students can view own scores"
  ON public.rubric_scores
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM artworks 
    WHERE artworks.id = rubric_scores.artwork_id 
    AND artworks.student_id = auth.uid()
  ));

CREATE POLICY "Teachers can manage scores"
  ON public.rubric_scores
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'teacher'
  ));

-- Add trigger for updated_at on all tables
DO $$ 
BEGIN
  -- Check if trigger exists for profiles table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_timestamp' AND tgrelid = 'public.profiles'::regclass) THEN
    CREATE TRIGGER set_updated_at_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Check if trigger exists for artworks table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_timestamp' AND tgrelid = 'public.artworks'::regclass) THEN
    CREATE TRIGGER set_updated_at_timestamp
    BEFORE UPDATE ON public.artworks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Check if trigger exists for rubrics table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_timestamp' AND tgrelid = 'public.rubrics'::regclass) THEN
    CREATE TRIGGER set_updated_at_timestamp
    BEFORE UPDATE ON public.rubrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Check if trigger exists for rubric_scores table
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_timestamp' AND tgrelid = 'public.rubric_scores'::regclass) THEN
    CREATE TRIGGER set_updated_at_timestamp
    BEFORE UPDATE ON public.rubric_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;