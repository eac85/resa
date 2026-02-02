# Quick Fix for 403 Error

Your service role key is set, but you still need to fix the RLS policies in Supabase.

## 🚀 EASIEST FIX (Recommended for Development):

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/zzyjetghkyzacwdpgpew/sql

2. **Click on "SQL Editor"** in the left sidebar

3. **Copy and paste the contents of `supabase/disable-rls-temporary.sql`** (or use the SQL below):

```sql
-- Disable RLS completely (for development)
ALTER TABLE IF EXISTS trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS days DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lodging_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS food_research DISABLE ROW LEVEL SECURITY;
```

4. **Click "Run"** (or press Cmd/Ctrl + Enter)

5. **Try creating a trip again** - it should work immediately!

---

## 🔧 PROPER FIX (Recommended for Production):

If you want to keep RLS enabled but fix the policies:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/zzyjetghkyzacwdpgpew/sql

2. **Copy and paste the contents of `supabase/fix-rls-complete.sql`** (or use the SQL below):

```sql
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
```

4. **Click "Run"** (or press Cmd/Ctrl + Enter)

5. **Try creating a trip again** - it should work now!

## Alternative: Disable RLS (Not Recommended for Production)

If you want to completely disable RLS for now (only for development):

```sql
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE days DISABLE ROW LEVEL SECURITY;
ALTER TABLE lodging_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE food_research DISABLE ROW LEVEL SECURITY;
```

But fixing the policies (first option) is better!
