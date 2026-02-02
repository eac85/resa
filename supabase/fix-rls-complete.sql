-- Complete RLS Fix for Travel Planner
-- Run this entire script in Supabase SQL Editor

-- First, let's check if tables exist and disable RLS temporarily
DO $$ 
BEGIN
  -- Disable RLS on all tables
  ALTER TABLE IF EXISTS trips DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS days DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS lodging_info DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS activities DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS food_research DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some tables may not exist yet, continuing...';
END $$;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow all operations on trips" ON trips;
DROP POLICY IF EXISTS "Allow all operations on days" ON days;
DROP POLICY IF EXISTS "Allow all operations on lodging_info" ON lodging_info;
DROP POLICY IF EXISTS "Allow all operations on activities" ON activities;
DROP POLICY IF EXISTS "Allow all operations on food_research" ON food_research;

-- Re-enable RLS
ALTER TABLE IF EXISTS trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS days ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lodging_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS food_research ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for trips
CREATE POLICY "Allow all operations on trips" 
  ON trips 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create comprehensive policies for days
CREATE POLICY "Allow all operations on days" 
  ON days 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create comprehensive policies for lodging_info
CREATE POLICY "Allow all operations on lodging_info" 
  ON lodging_info 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create comprehensive policies for activities
CREATE POLICY "Allow all operations on activities" 
  ON activities 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create comprehensive policies for food_research
CREATE POLICY "Allow all operations on food_research" 
  ON food_research 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('trips', 'days', 'lodging_info', 'activities', 'food_research')
ORDER BY tablename, policyname;
