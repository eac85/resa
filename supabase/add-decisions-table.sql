-- Add decisions table for trip decisions
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, decided, rejected
  decision TEXT, -- the actual decision made
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_decisions_trip_id ON decisions(trip_id);

-- Add trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_decisions_updated_at BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for now (or add policies)
ALTER TABLE decisions DISABLE ROW LEVEL SECURITY;
