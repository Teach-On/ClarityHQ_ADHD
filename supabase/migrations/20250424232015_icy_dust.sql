/*
  # Add unique constraint to user_preferences table

  1. Changes
    - Add a unique constraint on the user_id column in the user_preferences table
    - First remove any duplicate rows to ensure the constraint can be added
  
  This migration safely handles the case where duplicate user_id entries exist
  by keeping only the most recently updated row for each user_id.
*/

-- First, delete any duplicate rows, keeping only the most recently updated one
DELETE FROM public.user_preferences a
USING (
  SELECT user_id, MAX(updated_at) as max_updated_at
  FROM public.user_preferences
  GROUP BY user_id
  HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id
AND a.updated_at < b.max_updated_at;

-- Now add the unique constraint
DO $$ 
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT FROM pg_constraint 
    WHERE conname = 'user_preferences_user_id_key' 
    AND conrelid = 'public.user_preferences'::regclass
  ) THEN
    -- Add the unique constraint
    ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);
  END IF;
END $$;