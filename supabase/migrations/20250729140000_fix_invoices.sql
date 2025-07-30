-- Fix invoices table to ensure it's properly configured for both students and tourists
-- Run via: supabase db push

-- Create or update invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  student_id INTEGER,
  tourist_id INTEGER,
  payment_plan_id INTEGER,
  invoice_number TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  issued_date DATE DEFAULT CURRENT_DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  -- Student foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_student_fk'
  ) THEN
    ALTER TABLE invoices 
      ADD CONSTRAINT invoices_student_fk 
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;
  END IF;

  -- Tourist foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_tourist_fk'
  ) THEN
    ALTER TABLE invoices 
      ADD CONSTRAINT invoices_tourist_fk 
      FOREIGN KEY (tourist_id) REFERENCES tourists(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tourist_id ON invoices(tourist_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view invoices related to their data
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT user_id FROM students WHERE id = invoices.student_id
    ) OR
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.role IN ('admin', 'accountant', 'manager')
    )
  );

-- Allow service role and admin/accountant users to insert invoices
DROP POLICY IF EXISTS "Service and admin can insert invoices" ON invoices;
CREATE POLICY "Service and admin can insert invoices" ON invoices
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.role IN ('admin', 'accountant', 'manager')
    )
  );

-- Allow service role and admin/accountant users to update invoices
DROP POLICY IF EXISTS "Service and admin can update invoices" ON invoices;
CREATE POLICY "Service and admin can update invoices" ON invoices
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.role IN ('admin', 'accountant', 'manager')
    )
  );

-- Allow service role and admin users to delete invoices
DROP POLICY IF EXISTS "Admin can delete invoices" ON invoices;
CREATE POLICY "Admin can delete invoices" ON invoices
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.role = 'admin'
    )
  );

-- Add constraint to ensure either student_id or tourist_id is set, but not both
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_customer_check'
  ) THEN
    ALTER TABLE invoices 
      ADD CONSTRAINT invoices_customer_check 
      CHECK (
        (student_id IS NOT NULL AND tourist_id IS NULL) OR 
        (student_id IS NULL AND tourist_id IS NOT NULL)
      );
  END IF;
END$$;

-- Update existing invoices to ensure they have proper invoice numbers if missing
UPDATE invoices 
SET invoice_number = 'INV-' || id || '-' || EXTRACT(EPOCH FROM created_at)::bigint
WHERE invoice_number IS NULL OR invoice_number = '';

COMMENT ON TABLE invoices IS 'Financial invoices for students and tourists';
COMMENT ON COLUMN invoices.student_id IS 'Reference to student (for long-term stays)';
COMMENT ON COLUMN invoices.tourist_id IS 'Reference to tourist (for short-term stays)';
COMMENT ON COLUMN invoices.amount IS 'Invoice amount in specified currency';
COMMENT ON COLUMN invoices.status IS 'Payment status: pending, paid, overdue, cancelled'; 