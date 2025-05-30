/*
  # Add unique constraint to user_preferences table

  1. Changes
     - Removes duplicate user_preference records, keeping only the most recent one for each user
     - Adds a unique constraint on the `user_id` column of the `user_preferences` table
       This allows upsert operations to work correctly with onConflict: 'user_id'
  
  2. Purpose
     - Fixes the error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
     - Ensures each user can have only one preferences record
*/

-- Step 1: Delete duplicate records, keeping only the most recent one for each user_id
DO $$ 
BEGIN
  -- Check if the table exists
  IF EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences'
  ) THEN
    -- Create a temporary table to store the latest record for each user_id
    CREATE TEMP TABLE latest_preferences AS
    SELECT DISTINCT ON (user_id) *
    FROM public.user_preferences
    ORDER BY user_id, updated_at DESC;
    
    -- Delete all records from the original table
    DELETE FROM public.user_preferences;
    
    -- Reinsert only the latest records for each user
    INSERT INTO public.user_preferences
    SELECT * FROM latest_preferences;
    
    -- Drop the temporary table
    DROP TABLE latest_preferences;
    
    -- Now add the unique constraint
    IF NOT EXISTS (
      SELECT FROM pg_constraint 
      WHERE conname = 'user_preferences_user_id_key' 
      AND conrelid = 'public.user_preferences'::regclass
    ) THEN
      ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);
    END IF;
  END IF;
END $$;