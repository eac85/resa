-- Insert example planning items
-- Replace 'YOUR_TRIP_ID' with an actual trip ID from your trips table
-- Or use this query to get your trip ID first:
-- SELECT id, name FROM trips LIMIT 1;

-- Example: Insert planning items for a trip
-- Replace 'YOUR_TRIP_ID' with your actual trip UUID

INSERT INTO planning_items (trip_id, title, status, notes) VALUES
  ('YOUR_TRIP_ID', 'Buy lessons', 'not_started', NULL),
  ('YOUR_TRIP_ID', 'Figure out rentals', 'not_started', NULL),
  ('YOUR_TRIP_ID', 'Make list of clothing', 'not_started', NULL),
  ('YOUR_TRIP_ID', 'Groceries', 'not_started', NULL);

-- To insert for a specific trip, first get the trip ID:
-- SELECT id FROM trips WHERE name = 'Your Trip Name';

-- Then use that ID in the INSERT above
