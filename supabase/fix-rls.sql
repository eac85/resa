-- Fix RLS Policies - Run this in Supabase SQL Editor if you get 403 errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on trips" ON trips;
DROP POLICY IF EXISTS "Allow all operations on days" ON days;
DROP POLICY IF EXISTS "Allow all operations on lodging_info" ON lodging_info;
DROP POLICY IF EXISTS "Allow all operations on activities" ON activities;
DROP POLICY IF EXISTS "Allow all operations on food_research" ON food_research;

-- Recreate policies with proper syntax
CREATE POLICY "Allow all operations on trips" 
  ON trips 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on days" 
  ON days 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on lodging_info" 
  ON lodging_info 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on activities" 
  ON activities 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on food_research" 
  ON food_research 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);
