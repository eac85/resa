-- Update profiles RLS to allow viewing all profiles (for user dropdown)
-- Run this in Supabase SQL Editor after add-auth-support.sql

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policy: Users can view all profiles (for collaboration features)
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

-- Keep the other policies (update and insert are still restricted)
-- Users can still only update their own profile
-- Users can still only insert their own profile
