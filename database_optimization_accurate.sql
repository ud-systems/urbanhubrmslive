-- Database Optimization Script for Leads UrbanHub (ACCURATE VERSION)
-- Based on actual TypeScript types - using exact column names
-- Run this in your Supabase SQL Editor

-- =============================================
-- PERFORMANCE INDEXES (ACCURATE - FROM TYPESCRIPT TYPES)
-- =============================================

-- Leads table indexes (exact column names from TypeScript)
CREATE INDEX IF NOT EXISTS idx_leads_dateofinquiry ON leads(dateofinquiry);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assignedto ON leads(assignedto);
CREATE INDEX IF NOT EXISTS idx_leads_responsecategory ON leads(responsecategory);
CREATE INDEX IF NOT EXISTS idx_leads_followupstage ON leads(followupstage);
CREATE INDEX IF NOT EXISTS idx_leads_roomgrade ON leads(roomgrade);
CREATE INDEX IF NOT EXISTS idx_leads_duration ON leads(duration);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_status_date ON leads(status, dateofinquiry);
CREATE INDEX IF NOT EXISTS idx_leads_source_status ON leads(source, status);
CREATE INDEX IF NOT EXISTS idx_leads_assignedto_status ON leads(assignedto, status);

-- Students table indexes (exact column names from TypeScript)
CREATE INDEX IF NOT EXISTS idx_students_roomgrade ON students(roomgrade);
CREATE INDEX IF NOT EXISTS idx_students_duration ON students(duration);
CREATE INDEX IF NOT EXISTS idx_students_assignedto ON students(assignedto);
CREATE INDEX IF NOT EXISTS idx_students_dateofinquiry ON students(dateofinquiry);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_students_checkin ON students(checkin);
CREATE INDEX IF NOT EXISTS idx_students_checkout ON students(checkout);

-- Studios table indexes (exact column names from TypeScript)
CREATE INDEX IF NOT EXISTS idx_studios_occupied ON studios(occupied);
CREATE INDEX IF NOT EXISTS idx_studios_roomgrade ON studios(roomgrade);
CREATE INDEX IF NOT EXISTS idx_studios_occupiedby ON studios(occupiedby);
CREATE INDEX IF NOT EXISTS idx_studios_floor ON studios(floor);
CREATE INDEX IF NOT EXISTS idx_studios_view ON studios(view);

-- Configuration tables indexes
CREATE INDEX IF NOT EXISTS idx_room_grades_name ON room_grades(name);
CREATE INDEX IF NOT EXISTS idx_stay_durations_name ON stay_durations(name);
CREATE INDEX IF NOT EXISTS idx_lead_sources_name ON lead_sources(name);
CREATE INDEX IF NOT EXISTS idx_response_categories_name ON response_categories(name);
CREATE INDEX IF NOT EXISTS idx_lead_status_name ON lead_status(name);
CREATE INDEX IF NOT EXISTS idx_follow_up_stages_name ON follow_up_stages(name);

-- =============================================
-- DATA VALIDATION TRIGGERS (ACCURATE)
-- =============================================

-- Trigger to validate email format
CREATE OR REPLACE FUNCTION validate_email_format()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply email validation triggers (only if email column exists)
DO $$
BEGIN
  -- Check if leads table exists and has email column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email') THEN
    DROP TRIGGER IF EXISTS trigger_validate_email_leads ON leads;
    CREATE TRIGGER trigger_validate_email_leads
      BEFORE INSERT OR UPDATE ON leads
      FOR EACH ROW EXECUTE FUNCTION validate_email_format();
  END IF;

  -- Check if students table exists and has email column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'email') THEN
    DROP TRIGGER IF EXISTS trigger_validate_email_students ON students;
    CREATE TRIGGER trigger_validate_email_students
      BEFORE INSERT OR UPDATE ON students
      FOR EACH ROW EXECUTE FUNCTION validate_email_format();
  END IF;
END $$;

-- =============================================
-- AUDIT TRAIL SYSTEM
-- =============================================

-- Create audit trail table
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id, user_email)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'INSERT', to_jsonb(NEW), auth.uid(), auth.jwt() ->> 'email');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id, user_email)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid(), auth.jwt() ->> 'email');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, user_id, user_email)
    VALUES (TG_TABLE_NAME, OLD.id::TEXT, 'DELETE', to_jsonb(OLD), auth.uid(), auth.jwt() ->> 'email');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to main tables (only if they exist)
DO $$
BEGIN
  -- Check if leads table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    DROP TRIGGER IF EXISTS trigger_audit_leads ON leads;
    CREATE TRIGGER trigger_audit_leads
      AFTER INSERT OR UPDATE OR DELETE ON leads
      FOR EACH ROW EXECUTE FUNCTION log_audit_event();
  END IF;

  -- Check if students table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
    DROP TRIGGER IF EXISTS trigger_audit_students ON students;
    CREATE TRIGGER trigger_audit_students
      AFTER INSERT OR UPDATE OR DELETE ON students
      FOR EACH ROW EXECUTE FUNCTION log_audit_event();
  END IF;

  -- Check if studios table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'studios') THEN
    DROP TRIGGER IF EXISTS trigger_audit_studios ON studios;
    CREATE TRIGGER trigger_audit_studios
      AFTER INSERT OR UPDATE OR DELETE ON studios
      FOR EACH ROW EXECUTE FUNCTION log_audit_event();
  END IF;
END $$;

-- =============================================
-- PERFORMANCE VIEWS (ACCURATE)
-- =============================================

-- Dashboard statistics view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'New' THEN 1 END) as new_leads,
  COUNT(CASE WHEN status = 'Hot' THEN 1 END) as hot_leads,
  COUNT(CASE WHEN status = 'Cold' THEN 1 END) as cold_leads,
  COUNT(CASE WHEN status = 'Converted' THEN 1 END) as converted_leads,
  COUNT(CASE WHEN status = 'Dead' THEN 1 END) as dead_leads,
  COUNT(CASE WHEN dateofinquiry >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as leads_this_week,
  COUNT(CASE WHEN dateofinquiry >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as leads_this_month
FROM leads;

-- Studio occupancy view (using exact column names)
CREATE OR REPLACE VIEW studio_occupancy AS
SELECT 
  s.id,
  s.name,
  s.roomgrade,
  s.occupied,
  s.occupiedby,
  s.view,
  s.floor,
  st.name as student_name,
  st.checkin,
  st.checkout
FROM studios s
LEFT JOIN students st ON s.occupiedby = st.id;

-- Lead conversion view
CREATE OR REPLACE VIEW lead_conversion_stats AS
SELECT 
  source,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'Converted' THEN 1 END) as converted_leads,
  ROUND(
    (COUNT(CASE WHEN status = 'Converted' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as conversion_rate
FROM leads 
GROUP BY source
ORDER BY conversion_rate DESC;

-- Student occupancy view
CREATE OR REPLACE VIEW student_occupancy AS
SELECT 
  st.id,
  st.name,
  st.roomgrade,
  st.duration,
  st.checkin,
  st.checkout,
  st.assignedto,
  s.name as studio_name,
  s.view,
  s.floor
FROM students st
LEFT JOIN studios s ON st.assignedto = s.id;

-- =============================================
-- DATA CLEANUP FUNCTIONS (ACCURATE)
-- =============================================

-- Function to clean up orphaned records
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS void AS $$
BEGIN
  -- Clean up students with invalid studio assignments
  UPDATE students 
  SET assignedto = NULL 
  WHERE assignedto IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM studios WHERE id = students.assignedto);
  
  -- Clean up studios with invalid student assignments
  UPDATE studios 
  SET occupiedby = NULL, occupied = false 
  WHERE occupiedby IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM students WHERE id = studios.occupiedby);
END;
$$ LANGUAGE plpgsql;

-- Function to validate data integrity
CREATE OR REPLACE FUNCTION validate_data_integrity()
RETURNS TABLE(issue_type TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 'leads_without_email'::TEXT, COUNT(*)::BIGINT
  FROM leads WHERE email IS NULL OR email = ''
  UNION ALL
  SELECT 'students_without_phone'::TEXT, COUNT(*)::BIGINT
  FROM students WHERE phone IS NULL OR phone = ''
  UNION ALL
  SELECT 'studios_without_roomgrade'::TEXT, COUNT(*)::BIGINT
  FROM studios WHERE roomgrade IS NULL OR roomgrade = ''
  UNION ALL
  SELECT 'leads_without_status'::TEXT, COUNT(*)::BIGINT
  FROM leads WHERE status IS NULL OR status = ''
  UNION ALL
  SELECT 'leads_without_source'::TEXT, COUNT(*)::BIGINT
  FROM leads WHERE source IS NULL OR source = ''
  UNION ALL
  SELECT 'students_without_checkin'::TEXT, COUNT(*)::BIGINT
  FROM students WHERE checkin IS NULL OR checkin = ''
  UNION ALL
  SELECT 'students_without_checkout'::TEXT, COUNT(*)::BIGINT
  FROM students WHERE checkout IS NULL OR checkout = '';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- MONITORING QUERIES (ACCURATE)
-- =============================================

-- Query to check system health
SELECT 
  'leads' as table_name,
  COUNT(*) as record_count,
  'N/A' as last_record
FROM leads
UNION ALL
SELECT 
  'students' as table_name,
  COUNT(*) as record_count,
  'N/A' as last_record
FROM students
UNION ALL
SELECT 
  'studios' as table_name,
  COUNT(*) as record_count,
  'N/A' as last_record
FROM studios;

-- Query to find potential data issues
SELECT * FROM validate_data_integrity();

-- Query to check recent activity (based on dateofinquiry)
SELECT 
  'recent_leads' as activity_type,
  COUNT(*) as count
FROM leads 
WHERE dateofinquiry >= CURRENT_DATE - INTERVAL '7 days'
UNION ALL
SELECT 
  'recent_students' as activity_type,
  COUNT(*) as count
FROM students 
WHERE dateofinquiry >= CURRENT_DATE - INTERVAL '7 days';

-- =============================================
-- HELPER FUNCTIONS (ACCURATE)
-- =============================================

-- Function to get lead statistics by date range
CREATE OR REPLACE FUNCTION get_lead_stats_by_date_range(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  total_leads BIGINT,
  new_leads BIGINT,
  hot_leads BIGINT,
  cold_leads BIGINT,
  converted_leads BIGINT,
  dead_leads BIGINT,
  conversion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_leads,
    COUNT(CASE WHEN status = 'New' THEN 1 END)::BIGINT as new_leads,
    COUNT(CASE WHEN status = 'Hot' THEN 1 END)::BIGINT as hot_leads,
    COUNT(CASE WHEN status = 'Cold' THEN 1 END)::BIGINT as cold_leads,
    COUNT(CASE WHEN status = 'Converted' THEN 1 END)::BIGINT as converted_leads,
    COUNT(CASE WHEN status = 'Dead' THEN 1 END)::BIGINT as dead_leads,
    ROUND(
      (COUNT(CASE WHEN status = 'Converted' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    ) as conversion_rate
  FROM leads 
  WHERE dateofinquiry >= start_date AND dateofinquiry <= end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get studio occupancy statistics
CREATE OR REPLACE FUNCTION get_studio_occupancy_stats()
RETURNS TABLE(
  total_studios BIGINT,
  occupied_studios BIGINT,
  vacant_studios BIGINT,
  occupancy_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_studios,
    COUNT(CASE WHEN occupied = true THEN 1 END)::BIGINT as occupied_studios,
    COUNT(CASE WHEN occupied = false THEN 1 END)::BIGINT as vacant_studios,
    ROUND(
      (COUNT(CASE WHEN occupied = true THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    ) as occupancy_rate
  FROM studios;
END;
$$ LANGUAGE plpgsql;

-- Function to get student statistics
CREATE OR REPLACE FUNCTION get_student_stats()
RETURNS TABLE(
  total_students BIGINT,
  active_students BIGINT,
  completed_students BIGINT,
  avg_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_students,
    COUNT(CASE WHEN checkout IS NULL OR checkout = '' THEN 1 END)::BIGINT as active_students,
    COUNT(CASE WHEN checkout IS NOT NULL AND checkout != '' THEN 1 END)::BIGINT as completed_students,
    ROUND(AVG(COALESCE(revenue, 0)), 2) as avg_revenue
  FROM students;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Database optimization completed successfully!';
  RAISE NOTICE 'Indexes created for better query performance';
  RAISE NOTICE 'Audit trail system installed';
  RAISE NOTICE 'Data validation triggers added';
  RAISE NOTICE 'Performance views created';
  RAISE NOTICE 'Helper functions added';
  RAISE NOTICE 'All operations completed with accurate column names!';
END $$; 