/*
  # Update to calendar_events table (safe migration)
  
  This migration safely ensures the calendar_events table and its policies exist
  without causing errors if they already exist in the database.
  
  1. Checks if the table exists before creating it
  2. Checks if each policy exists before creating it
  3. Uses DO blocks with condition checks for safe idempotent operations
*/

-- Check if table exists before creation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_events'
  ) THEN
    CREATE TABLE calendar_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users NOT NULL,
      title text NOT NULL,
      start_time timestamptz NOT NULL,
      end_time timestamptz NOT NULL,
      location text,
      google_event_id text,
      created_at timestamptz DEFAULT now() NOT NULL
    );
    
    ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Check if policies exist before creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can read their own calendar events'
  ) THEN
    CREATE POLICY "Users can read their own calendar events"
      ON calendar_events
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can insert their own calendar events'
  ) THEN
    CREATE POLICY "Users can insert their own calendar events"
      ON calendar_events
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can update their own calendar events'
  ) THEN
    CREATE POLICY "Users can update their own calendar events"
      ON calendar_events
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'Users can delete their own calendar events'
  ) THEN
    CREATE POLICY "Users can delete their own calendar events"
      ON calendar_events
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;