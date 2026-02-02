-- Migration: Change activities from day-based to trip-based
-- Run this in Supabase SQL Editor

-- Step 1: Add trip_id column to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE CASCADE;

-- Step 2: Populate trip_id from the day's trip_id for existing activities
UPDATE activities 
SET trip_id = (
  SELECT trip_id 
  FROM days 
  WHERE days.id = activities.day_id
)
WHERE trip_id IS NULL;

-- Step 3: Make trip_id NOT NULL (after populating)
ALTER TABLE activities ALTER COLUMN trip_id SET NOT NULL;

-- Step 4: Drop the day_id foreign key constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_day_id_fkey;

-- Step 5: Drop the day_id column
ALTER TABLE activities DROP COLUMN IF EXISTS day_id;

-- Step 6: Update index
DROP INDEX IF EXISTS idx_activities_day_id;
CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON activities(trip_id);
