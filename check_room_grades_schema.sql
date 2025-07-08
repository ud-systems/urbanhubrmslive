-- Check room_grades table schema
-- Run this in Supabase SQL Editor to see the current structure

SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'room_grades' 
ORDER BY ordinal_position;

-- Also check if there are any existing room grades
SELECT * FROM room_grades LIMIT 5; 