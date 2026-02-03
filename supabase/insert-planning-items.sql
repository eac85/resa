-- Insert planning items from the screenshot
-- First, get your trip ID (run this to see your trips):
-- SELECT id, name FROM trips;

-- Then replace 'YOUR_TRIP_ID_HERE' below with your actual trip UUID
-- Or use the version at the bottom that automatically uses your first trip

-- Option 1: Insert for a specific trip ID
INSERT INTO planning_items (trip_id, title, status, notes) VALUES
  ('YOUR_TRIP_ID_HERE', 'Buy lessons', 'not_started', NULL),
  ('YOUR_TRIP_ID_HERE', 'Figure out rentals', 'not_started', NULL),
  ('YOUR_TRIP_ID_HERE', 'Make list of clothing', 'not_started', NULL),
  ('YOUR_TRIP_ID_HERE', 'Groceries', 'not_started', NULL);

-- Option 2: Insert for your first trip automatically
-- Uncomment the lines below and comment out Option 1 above
/*
WITH first_trip AS (
  SELECT id FROM trips ORDER BY created_at LIMIT 1
)
INSERT INTO planning_items (trip_id, title, status, notes)
SELECT 
  id,
  'Buy lessons',
  'not_started',
  NULL
FROM first_trip

UNION ALL

SELECT 
  id,
  'Figure out rentals',
  'not_started',
  NULL
FROM first_trip

UNION ALL

SELECT 
  id,
  'Make list of clothing',
  'not_started',
  NULL
FROM first_trip

UNION ALL

SELECT 
  id,
  'Groceries',
  'not_started',
  NULL
FROM first_trip;
*/

-- Option 3: Insert for a specific trip by name (replace 'butternut' with your trip name)
/*
INSERT INTO planning_items (trip_id, title, status, notes)
SELECT 
  id,
  'Buy lessons',
  'not_started',
  NULL
FROM trips 
WHERE name = 'butternut'

UNION ALL

SELECT 
  id,
  'Figure out rentals',
  'not_started',
  NULL
FROM trips 
WHERE name = 'butternut'

UNION ALL

SELECT 
  id,
  'Make list of clothing',
  'not_started',
  NULL
FROM trips 
WHERE name = 'butternut'

UNION ALL

SELECT 
  id,
  'Groceries',
  'not_started',
  NULL
FROM trips 
WHERE name = 'butternut';
*/
