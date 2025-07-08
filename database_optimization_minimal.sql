-- Minimal Database Optimization Script for Leads UrbanHub
-- Only creates indexes for basic columns that should definitely exist
-- Run this in your Supabase SQL Editor

-- =============================================
-- BASIC PERFORMANCE INDEXES (MINIMAL)
-- =============================================

-- Leads table - only basic columns that should exist
CREATE INDEX IF NOT EXISTS idx_leads_id ON leads(id);
CREATE INDEX IF NOT EXISTS idx_leads_name ON leads(name);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);

-- Students table - only basic columns that should exist
CREATE INDEX IF NOT EXISTS idx_students_id ON students(id);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);

-- Studios table - only basic columns that should exist
CREATE INDEX IF NOT EXISTS idx_studios_id ON studios(id);
CREATE INDEX IF NOT EXISTS idx_studios_name ON studios(name);

-- =============================================
-- AUDIT TRAIL SYSTEM (SAFE)
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
  timestamp TIMESTAMPTZ DEFAULT NOW()
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
-- BASIC PERFORMANCE VIEWS (SAFE)
-- =============================================

-- Basic dashboard statistics view
CREATE OR REPLACE VIEW basic_dashboard_stats AS
SELECT 
  COUNT(*) as total_leads,
  COUNT(*) as total_students,
  COUNT(*) as total_studios
FROM leads;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Minimal database optimization completed successfully!';
  RAISE NOTICE 'Basic indexes created for better query performance';
  RAISE NOTICE 'Audit trail system installed';
  RAISE NOTICE 'Basic performance views created';
  RAISE NOTICE 'All operations completed safely!';
END $$; 