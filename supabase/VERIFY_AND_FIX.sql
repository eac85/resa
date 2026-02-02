-- VERIFY AND FIX RLS - Run this in Supabase SQL Editor
-- This will show you the current state and fix it

-- Step 1: Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trips', 'days', 'lodging_info', 'activities', 'food_research')
ORDER BY tablename;

-- Step 2: Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('trips', 'days', 'lodging_info', 'activities', 'food_research')
ORDER BY tablename, policyname;

-- Step 3: DISABLE RLS (Easiest fix for development)
ALTER TABLE IF EXISTS trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS days DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lodging_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS food_research DISABLE ROW LEVEL SECURITY;

-- Step 4: Drop any existing policies (cleanup)
DROP POLICY IF EXISTS "Allow all operations on trips" ON trips;
DROP POLICY IF EXISTS "Allow all operations on days" ON days;
DROP POLICY IF EXISTS "Allow all operations on lodging_info" ON lodging_info;
DROP POLICY IF EXISTS "Allow all operations on activities" ON activities;
DROP POLICY IF EXISTS "Allow all operations on food_research" ON food_research;

-- Step 5: Verify RLS is now disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled (should be false)"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trips', 'days', 'lodging_info', 'activities', 'food_research')
ORDER BY tablename;

-- If you see "RLS Enabled" as false for all tables, you're good to go!
