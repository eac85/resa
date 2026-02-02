-- TEMPORARY FIX: Disable RLS completely (for development only)
-- This allows all operations without policies
-- ⚠️ WARNING: Only use this for development/testing!

ALTER TABLE IF EXISTS trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS days DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lodging_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS food_research DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('trips', 'days', 'lodging_info', 'activities', 'food_research');
