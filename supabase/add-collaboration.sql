-- Add Collaboration Support
-- Allows multiple users on a trip and tracks who created/updated what
-- Run this in Supabase SQL Editor

-- 1. Create trip_users junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS trip_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'owner', 'member'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- 2. Add created_by and updated_by to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 3. Add created_by and updated_by to other tables
ALTER TABLE days ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE days ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE lodging_info ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE lodging_info ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE activities ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE food_research ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE food_research ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE decisions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE planning_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE planning_items ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_trip_users_trip_id ON trip_users(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_users_user_id ON trip_users(user_id);

-- 5. Migrate existing trips to trip_users
-- Set the owner for existing trips
INSERT INTO trip_users (trip_id, user_id, role)
SELECT id, user_id, 'owner'
FROM trips
WHERE user_id IS NOT NULL
ON CONFLICT (trip_id, user_id) DO NOTHING;

-- 6. Enable RLS on trip_users
ALTER TABLE trip_users ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for trip_users
CREATE POLICY "Users can view trips they're part of" ON trip_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Trip owners can add members" ON trip_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_users tu
      WHERE tu.trip_id = trip_users.trip_id
      AND tu.user_id = auth.uid()
      AND tu.role = 'owner'
    )
  );

CREATE POLICY "Trip owners can remove members" ON trip_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trip_users tu
      WHERE tu.trip_id = trip_users.trip_id
      AND tu.user_id = auth.uid()
      AND tu.role = 'owner'
    )
  );

-- 8. Update RLS policies for trips to allow all members
DROP POLICY IF EXISTS "Users can view own trips" ON trips;
DROP POLICY IF EXISTS "Users can create own trips" ON trips;
DROP POLICY IF EXISTS "Users can update own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON trips;

-- New policies that check trip_users
CREATE POLICY "Users can view trips they're part of" ON trips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_users
      WHERE trip_users.trip_id = trips.id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Trip members can update trips" ON trips
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trip_users
      WHERE trip_users.trip_id = trips.id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip owners can delete trips" ON trips
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trip_users
      WHERE trip_users.trip_id = trips.id
      AND trip_users.user_id = auth.uid()
      AND trip_users.role = 'owner'
    )
  );

-- 9. Update RLS policies for days to allow all trip members
DROP POLICY IF EXISTS "Users can view own days" ON days;
DROP POLICY IF EXISTS "Users can create own days" ON days;
DROP POLICY IF EXISTS "Users can update own days" ON days;
DROP POLICY IF EXISTS "Users can delete own days" ON days;

CREATE POLICY "Trip members can view days" ON days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = days.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can create days" ON days
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = days.trip_id
      AND trip_users.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Trip members can update days" ON days
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = days.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can delete days" ON days
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = days.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

-- 10. Update RLS policies for lodging_info
DROP POLICY IF EXISTS "Users can view own lodging" ON lodging_info;
DROP POLICY IF EXISTS "Users can create own lodging" ON lodging_info;
DROP POLICY IF EXISTS "Users can update own lodging" ON lodging_info;
DROP POLICY IF EXISTS "Users can delete own lodging" ON lodging_info;

CREATE POLICY "Trip members can view lodging" ON lodging_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = lodging_info.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can create lodging" ON lodging_info
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = lodging_info.trip_id
      AND trip_users.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Trip members can update lodging" ON lodging_info
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = lodging_info.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can delete lodging" ON lodging_info
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = lodging_info.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

-- 11. Update RLS policies for activities
DROP POLICY IF EXISTS "Users can view own activities" ON activities;
DROP POLICY IF EXISTS "Users can create own activities" ON activities;
DROP POLICY IF EXISTS "Users can update own activities" ON activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON activities;

CREATE POLICY "Trip members can view activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN days ON days.trip_id = trips.id
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE days.id = activities.day_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can create activities" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      JOIN days ON days.trip_id = trips.id
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE days.id = activities.day_id
      AND trip_users.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Trip members can update activities" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN days ON days.trip_id = trips.id
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE days.id = activities.day_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can delete activities" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN days ON days.trip_id = trips.id
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE days.id = activities.day_id
      AND trip_users.user_id = auth.uid()
    )
  );

-- 12. Update RLS policies for food_research
DROP POLICY IF EXISTS "Users can view own food" ON food_research;
DROP POLICY IF EXISTS "Users can create own food" ON food_research;
DROP POLICY IF EXISTS "Users can update own food" ON food_research;
DROP POLICY IF EXISTS "Users can delete own food" ON food_research;

CREATE POLICY "Trip members can view food" ON food_research
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = food_research.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can create food" ON food_research
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = food_research.trip_id
      AND trip_users.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Trip members can update food" ON food_research
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = food_research.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can delete food" ON food_research
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = food_research.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

-- 13. Update RLS policies for decisions
DROP POLICY IF EXISTS "Users can view own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can create own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can update own decisions" ON decisions;
DROP POLICY IF EXISTS "Users can delete own decisions" ON decisions;

CREATE POLICY "Trip members can view decisions" ON decisions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = decisions.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can create decisions" ON decisions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = decisions.trip_id
      AND trip_users.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Trip members can update decisions" ON decisions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = decisions.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can delete decisions" ON decisions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = decisions.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

-- 14. Update RLS policies for planning_items
CREATE POLICY "Trip members can view planning items" ON planning_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = planning_items.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can create planning items" ON planning_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = planning_items.trip_id
      AND trip_users.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Trip members can update planning items" ON planning_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = planning_items.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can delete planning items" ON planning_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips
      JOIN trip_users ON trip_users.trip_id = trips.id
      WHERE trips.id = planning_items.trip_id
      AND trip_users.user_id = auth.uid()
    )
  );

-- 15. Function to automatically add creator to trip_users when trip is created
CREATE OR REPLACE FUNCTION add_trip_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trip_users (trip_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT (trip_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Trigger to add owner to trip_users
DROP TRIGGER IF EXISTS on_trip_created ON trips;
CREATE TRIGGER on_trip_created
  AFTER INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION add_trip_owner();

-- 17. Function to update updated_by on update
CREATE OR REPLACE FUNCTION update_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 18. Add triggers for updated_by (we'll handle this in the backend, but this is a backup)
-- Note: This won't work perfectly with RLS, so we'll set updated_by in the backend
