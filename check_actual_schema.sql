-- Check actual database schema
-- Run this in Supabase SQL Editor to see your exact table structure

-- Check leads table structure
SELECT 
  'leads' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;

-- Check students table structure
SELECT 
  'students' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Check studios table structure
SELECT 
  'studios' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'studios' 
ORDER BY ordinal_position; 