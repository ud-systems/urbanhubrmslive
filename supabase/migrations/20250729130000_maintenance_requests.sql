-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id BIGSERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  studio_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'asap', 'emergency')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add foreign key constraints
ALTER TABLE maintenance_requests 
  ADD CONSTRAINT maintenance_requests_student_fk 
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE maintenance_requests 
  ADD CONSTRAINT maintenance_requests_studio_fk 
  FOREIGN KEY (studio_id) REFERENCES studios(id) ON DELETE SET NULL;

ALTER TABLE maintenance_requests 
  ADD CONSTRAINT maintenance_requests_assigned_to_fk 
  FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_student_id ON maintenance_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_studio_id ON maintenance_requests(studio_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_created_at ON maintenance_requests(created_at);

-- Enable Row Level Security
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Students can view and create their own requests
CREATE POLICY "Students can view their own maintenance requests"
  ON maintenance_requests FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create maintenance requests"
  ON maintenance_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Staff can view and manage all requests
CREATE POLICY "Staff can view all maintenance requests"
  ON maintenance_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_roles ur ON u.id = ur.user_id 
      WHERE u.id = auth.uid() 
      AND ur.role IN ('admin', 'manager', 'cleaner')
    )
  );

CREATE POLICY "Staff can update maintenance requests"
  ON maintenance_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_roles ur ON u.id = ur.user_id 
      WHERE u.id = auth.uid() 
      AND ur.role IN ('admin', 'manager', 'cleaner')
    )
  );

CREATE POLICY "Staff can delete maintenance requests"
  ON maintenance_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN user_roles ur ON u.id = ur.user_id 
      WHERE u.id = auth.uid() 
      AND ur.role IN ('admin', 'manager', 'cleaner')
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maintenance_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_requests_updated_at(); 