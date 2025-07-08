-- Create tables for lead comments and audit functionality
-- Run this in your Supabase SQL Editor

-- =============================================
-- LEAD COMMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS lead_comments (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_comments_lead_id ON lead_comments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_comments_user_id ON lead_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_comments_created_at ON lead_comments(created_at);

-- Enable Row Level Security
ALTER TABLE lead_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for lead_comments
CREATE POLICY "Users can view comments for leads they have access to" ON lead_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE leads.id = lead_comments.lead_id
    )
  );

CREATE POLICY "Authenticated users can insert comments" ON lead_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON lead_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON lead_comments
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- AUDIT LOGS TABLE (if not already created)
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs("timestamp");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs (read-only for authenticated users)
CREATE POLICY "Authenticated users can view audit logs" ON audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- TRIGGER FUNCTION FOR AUDIT LOGGING
-- =============================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  user_email TEXT;
BEGIN
  -- Get current user email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Convert old and new data to JSONB
  IF TG_OP = 'DELETE' THEN
    old_data = to_jsonb(OLD);
    new_data = NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data = to_jsonb(OLD);
    new_data = to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    old_data = NULL;
    new_data = to_jsonb(NEW);
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    user_id,
    user_email,
    "timestamp"
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(OLD.id::text, NEW.id::text),
    TG_OP,
    old_data,
    new_data,
    auth.uid(),
    user_email,
    NOW()
  );
  
  RETURN COALESCE(OLD, NEW);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CREATE TRIGGERS FOR AUDIT LOGGING
-- =============================================

-- Create triggers for leads table
DROP TRIGGER IF EXISTS audit_leads_trigger ON leads;
CREATE TRIGGER audit_leads_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create triggers for students table
DROP TRIGGER IF EXISTS audit_students_trigger ON students;
CREATE TRIGGER audit_students_trigger
  AFTER INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create triggers for studios table
DROP TRIGGER IF EXISTS audit_studios_trigger ON studios;
CREATE TRIGGER audit_studios_trigger
  AFTER INSERT OR UPDATE OR DELETE ON studios
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get lead comments with user info
CREATE OR REPLACE FUNCTION get_lead_comments(lead_id_param BIGINT)
RETURNS TABLE (
  id BIGINT,
  lead_id BIGINT,
  text TEXT,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lc.id,
    lc.lead_id,
    lc.text,
    lc.user_id,
    COALESCE(p.name, 'Unknown User') as user_name,
    COALESCE(p.email, '') as user_email,
    lc.created_at
  FROM lead_comments lc
  LEFT JOIN profiles p ON lc.user_id = p.id
  WHERE lc.lead_id = lead_id_param
  ORDER BY lc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit trail for a specific record
CREATE OR REPLACE FUNCTION get_audit_trail(table_name_param TEXT, record_id_param TEXT)
RETURNS TABLE (
  id BIGINT,
  table_name TEXT,
  record_id TEXT,
  action TEXT,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  user_email TEXT,
  "timestamp" TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.table_name,
    al.record_id,
    al.action,
    al.old_data,
    al.new_data,
    al.user_id,
    al.user_email,
    al."timestamp"
  FROM audit_logs al
  WHERE al.table_name = table_name_param 
    AND al.record_id = record_id_param
  ORDER BY al."timestamp" DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SAMPLE DATA (OPTIONAL)
-- =============================================

-- Insert some sample comments if you want to test
-- Uncomment the lines below to add sample data

/*
INSERT INTO lead_comments (lead_id, text, user_id) VALUES
(1, 'Initial contact made via WhatsApp. Customer interested in September intake.', 'your-user-id-here'),
(1, 'Follow-up call scheduled for tomorrow to discuss room options.', 'your-user-id-here'),
(2, 'Customer requested information about premium rooms.', 'your-user-id-here');
*/

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if tables were created successfully
SELECT 'lead_comments' as table_name, COUNT(*) as row_count FROM lead_comments
UNION ALL
SELECT 'audit_logs' as table_name, COUNT(*) as row_count FROM audit_logs;

-- Check if triggers are working
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%'; 