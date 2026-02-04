-- Add link column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS link TEXT;
