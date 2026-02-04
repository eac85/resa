-- Add Supabase Auth Support
-- This creates a profiles table and adds user_id to trips
-- Run this in Supabase SQL Editor

-- 1. Create profiles table (extends auth.users with additional info)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 4. Create policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Create policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Add user_id column to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Create index for user_id on trips
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);

-- 8. Update RLS policies for trips to be user-specific
DROP POLICY IF EXISTS "Allow all operations on trips" ON trips;

CREATE POLICY "Users can view own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON trips
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Update RLS policies for days (cascades from trips)
DROP POLICY IF EXISTS "Allow all operations on days" ON days;

CREATE POLICY "Users can view own days" ON days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = days.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own days" ON days
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = days.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own days" ON days
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = days.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own days" ON days
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = days.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- 10. Update RLS policies for lodging_info
DROP POLICY IF EXISTS "Allow all operations on lodging_info" ON lodging_info;

CREATE POLICY "Users can view own lodging" ON lodging_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = lodging_info.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own lodging" ON lodging_info
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = lodging_info.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own lodging" ON lodging_info
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = lodging_info.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own lodging" ON lodging_info
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = lodging_info.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- 11. Update RLS policies for activities
DROP POLICY IF EXISTS "Allow all operations on activities" ON activities;

CREATE POLICY "Users can view own activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips 
      JOIN days ON days.trip_id = trips.id
      WHERE days.id = activities.day_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own activities" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      JOIN days ON days.trip_id = trips.id
      WHERE days.id = activities.day_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips 
      JOIN days ON days.trip_id = trips.id
      WHERE days.id = activities.day_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own activities" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips 
      JOIN days ON days.trip_id = trips.id
      WHERE days.id = activities.day_id 
      AND trips.user_id = auth.uid()
    )
  );

-- 12. Update RLS policies for food_research
DROP POLICY IF EXISTS "Allow all operations on food_research" ON food_research;

CREATE POLICY "Users can view own food" ON food_research
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = food_research.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own food" ON food_research
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = food_research.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own food" ON food_research
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = food_research.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own food" ON food_research
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = food_research.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

-- 13. Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. Add trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
