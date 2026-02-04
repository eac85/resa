-- Add icon column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'fa-hiking';

-- Update existing activities to have default icon if null
UPDATE activities 
SET icon = 'fa-hiking' 
WHERE icon IS NULL;
