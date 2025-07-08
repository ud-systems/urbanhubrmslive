-- Database Optimization Verification Script
-- Run this to check if all optimizations were applied successfully

-- =============================================
-- CHECK INDEXES CREATED
-- =============================================

-- Check leads table indexes
SELECT 
  'leads' as table_name,
  indexname as index_name,
  indexdef as index_definition
FROM pg_indexes 
WHERE tablename = 'leads' 
  AND indexname LIKE 'idx_leads_%'
ORDER BY indexname;

-- Check students table indexes
SELECT 
  'students' as table_name,
  indexname as index_name,
  indexdef as index_definition
FROM pg_indexes 
WHERE tablename = 'students' 
  AND indexname LIKE 'idx_students_%'
ORDER BY indexname;

-- Check studios table indexes
SELECT 
  'studios' as table_name,
  indexname as index_name,
  indexdef as index_definition
FROM pg_indexes 
WHERE tablename = 'studios' 
  AND indexname LIKE 'idx_studios_%'
ORDER BY indexname;

-- Check audit_logs table indexes
SELECT 
  'audit_logs' as table_name,
  indexname as index_name,
  indexdef as index_definition
FROM pg_indexes 
WHERE tablename = 'audit_logs' 
  AND indexname LIKE 'idx_audit_logs_%'
ORDER BY indexname;

-- =============================================
-- CHECK AUDIT TRAIL SYSTEM
-- =============================================

-- Check if audit_logs table exists
SELECT 
  'audit_logs_table' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check audit_logs table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- Check if audit triggers exist
SELECT 
  'audit_triggers' as check_type,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_audit_%'
ORDER BY trigger_name;

-- =============================================
-- CHECK PERFORMANCE VIEWS
-- =============================================

-- Check if views exist
SELECT 
  'performance_views' as check_type,
  viewname as view_name,
  definition
FROM pg_views 
WHERE viewname LIKE '%dashboard%' OR viewname LIKE '%stats%'
ORDER BY viewname;

-- =============================================
-- CHECK FUNCTIONS
-- =============================================

-- Check if audit function exists
SELECT 
  'audit_function' as check_type,
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'log_audit_event';

-- =============================================
-- TEST AUDIT SYSTEM
-- =============================================

-- Test audit system by checking if it's working
SELECT 
  'audit_system_test' as test_type,
  COUNT(*) as audit_records_count
FROM audit_logs;

-- Check recent audit activity
SELECT 
  'recent_audit_activity' as test_type,
  table_name,
  action,
  COUNT(*) as action_count
FROM audit_logs 
WHERE timestamp >= NOW() - INTERVAL '1 hour'
GROUP BY table_name, action
ORDER BY table_name, action;

-- =============================================
-- CHECK TABLE STRUCTURES
-- =============================================

-- Check leads table structure
SELECT 
  'leads_structure' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads' 
ORDER BY ordinal_position;

-- Check students table structure
SELECT 
  'students_structure' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Check studios table structure
SELECT 
  'studios_structure' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'studios' 
ORDER BY ordinal_position;

-- =============================================
-- PERFORMANCE TESTS
-- =============================================

-- Test basic query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM leads;

-- Test indexed query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM leads WHERE email IS NOT NULL LIMIT 10;

-- Test view performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM basic_dashboard_stats;

-- =============================================
-- SUMMARY REPORT
-- =============================================

-- Create a summary of all checks
WITH checks AS (
  -- Index checks
  SELECT 'Indexes Created' as check_category, COUNT(*) as count
  FROM pg_indexes 
  WHERE indexname LIKE 'idx_%' 
    AND tablename IN ('leads', 'students', 'studios', 'audit_logs')
  
  UNION ALL
  
  -- Audit system checks
  SELECT 'Audit System' as check_category, 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') 
    THEN 1 ELSE 0 END as count
  
  UNION ALL
  
  -- Trigger checks
  SELECT 'Audit Triggers' as check_category, COUNT(*) as count
  FROM information_schema.triggers 
  WHERE trigger_name LIKE 'trigger_audit_%'
  
  UNION ALL
  
  -- View checks
  SELECT 'Performance Views' as check_category, COUNT(*) as count
  FROM pg_views 
  WHERE viewname LIKE '%dashboard%' OR viewname LIKE '%stats%'
  
  UNION ALL
  
  -- Function checks
  SELECT 'Audit Functions' as check_category, COUNT(*) as count
  FROM pg_proc 
  WHERE proname = 'log_audit_event'
)
SELECT 
  check_category,
  count,
  CASE 
    WHEN check_category = 'Indexes Created' AND count >= 10 THEN '✅ GOOD'
    WHEN check_category = 'Audit System' AND count = 1 THEN '✅ GOOD'
    WHEN check_category = 'Audit Triggers' AND count >= 3 THEN '✅ GOOD'
    WHEN check_category = 'Performance Views' AND count >= 1 THEN '✅ GOOD'
    WHEN check_category = 'Audit Functions' AND count = 1 THEN '✅ GOOD'
    ELSE '❌ NEEDS ATTENTION'
  END as status
FROM checks
ORDER BY check_category;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Database optimization verification completed!';
  RAISE NOTICE 'Check the results above to see the status of all optimizations.';
  RAISE NOTICE '✅ = Good, ❌ = Needs attention';
END $$; 