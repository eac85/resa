-- Add planning/tasks table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS planning_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_planning_trip_id ON planning_items(trip_id);

-- Add trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_planning_updated_at BEFORE UPDATE ON planning_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for now (or add policies)
ALTER TABLE planning_items DISABLE ROW LEVEL SECURITY;
