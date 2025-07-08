-- Check actual database schema
-- Run this in Supabase SQL Editor to see your actual table structure

-- Check leads table structure
SELECT 
  'leads' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;

-- Check students table structure
SELECT 
  'students' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Check studios table structure
SELECT 
  'studios' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'studios' 
ORDER BY ordinal_position;

-- Check room_grades table structure
SELECT 
  'room_grades' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'room_grades' 
ORDER BY ordinal_position;

-- Check stay_durations table structure
SELECT 
  'stay_durations' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'stay_durations' 
ORDER BY ordinal_position;

-- Check lead_sources table structure
SELECT 
  'lead_sources' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'lead_sources' 
ORDER BY ordinal_position;

-- Check response_categories table structure
SELECT 
  'response_categories' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'response_categories' 
ORDER BY ordinal_position;

-- Check lead_status table structure
SELECT 
  'lead_status' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'lead_status' 
ORDER BY ordinal_position;

-- Check follow_up_stages table structure
SELECT 
  'follow_up_stages' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'follow_up_stages' 
ORDER BY ordinal_position;

-- Check profiles table structure
SELECT 
  'profiles' as table_name,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position; 