-- Comprehensive Student System Migration
-- Academic Years, Payment Plans, Deposit Tracking, and Audit Trail
-- Run via: npx supabase db push --linked

-- 1. Create Academic Years Table
CREATE TABLE IF NOT EXISTS academic_years (
  id BIGSERIAL PRIMARY KEY,
  year_code TEXT UNIQUE NOT NULL, -- e.g., '25/26', '26/27'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  weeks_45_start DATE NOT NULL, -- 45-week accommodation start
  weeks_45_end DATE NOT NULL,   -- 45-week accommodation end
  weeks_51_start DATE NOT NULL, -- 51-week accommodation start  
  weeks_51_end DATE NOT NULL,   -- 51-week accommodation end
  is_active BOOLEAN DEFAULT FALSE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert current academic year
INSERT INTO academic_years (year_code, start_date, end_date, weeks_45_start, weeks_45_end, weeks_51_start, weeks_51_end, is_active, is_current)
VALUES 
  ('25/26', '2025-09-01', '2026-07-31', '2025-09-15', '2026-06-30', '2025-08-15', '2026-07-31', true, true)
ON CONFLICT (year_code) DO NOTHING;

-- 2. Add Academic Year to Students Table
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_year_id BIGINT REFERENCES academic_years(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS duration_weeks INTEGER; -- 45 or 51
ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_cycles INTEGER; -- 3, 4, or 10
ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_plan_id BIGINT REFERENCES payment_plans(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_rebooker BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_academic_years TEXT[]; -- Track rebooking history

-- 3. Add Deposit Paid to Student Applications
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE;

-- 4. Update Payment Plans Structure (cycle-based)
ALTER TABLE payment_plans DROP COLUMN IF EXISTS duration_months;
ALTER TABLE payment_plans ADD COLUMN IF NOT EXISTS duration_weeks INTEGER; -- 45 or 51
ALTER TABLE payment_plans ADD COLUMN IF NOT EXISTS payment_cycles INTEGER; -- 3, 4, or 10
ALTER TABLE payment_plans ADD COLUMN IF NOT EXISTS academic_year_id BIGINT REFERENCES academic_years(id);

-- 5. Create Student Payment Progress Table
CREATE TABLE IF NOT EXISTS student_payment_progress (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  payment_plan_id BIGINT REFERENCES payment_plans(id),
  total_installments INTEGER NOT NULL,
  paid_installments INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  deposit_amount DECIMAL(10,2) DEFAULT 99.00,
  deposit_paid BOOLEAN DEFAULT FALSE,
  deposit_paid_date TIMESTAMP WITH TIME ZONE,
  next_payment_due DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Comprehensive Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_trail (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'student', 'application', 'payment', 'document', etc.
  entity_id BIGINT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'uploaded', 'assigned', etc.
  field_name TEXT, -- specific field that changed
  old_value TEXT, -- previous value (JSON for complex objects)
  new_value TEXT, -- new value (JSON for complex objects)
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT,
  user_name TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON students(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_students_deposit_paid ON students(deposit_paid);
CREATE INDEX IF NOT EXISTS idx_payment_plans_academic_year ON payment_plans(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_payment_progress_student ON student_payment_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);

-- Add unique constraint for student_payment_progress
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_student_payment_progress'
    AND table_name = 'student_payment_progress'
  ) THEN
    ALTER TABLE student_payment_progress ADD CONSTRAINT unique_student_payment_progress UNIQUE (student_id);
  END IF;
END$$;

-- 8. Create function to automatically detect rebookers
CREATE OR REPLACE FUNCTION detect_rebooker()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if student already exists with different academic year
  IF EXISTS (
    SELECT 1 FROM students 
    WHERE email = NEW.email 
    AND academic_year_id != NEW.academic_year_id
  ) THEN
    NEW.is_rebooker = TRUE;
    
    -- Update previous academic years array
    NEW.previous_academic_years = COALESCE(NEW.previous_academic_years, ARRAY[]::TEXT[]) || 
      ARRAY(
        SELECT ay.year_code 
        FROM students s 
        JOIN academic_years ay ON s.academic_year_id = ay.id
        WHERE s.email = NEW.email 
        AND s.academic_year_id != NEW.academic_year_id
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for rebooker detection
DROP TRIGGER IF EXISTS trigger_detect_rebooker ON students;
CREATE TRIGGER trigger_detect_rebooker
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION detect_rebooker();

-- 10. Create function to automatically create payment progress (created later after students table is updated)
-- This will be created after students table has payment_plan_id column

-- 12. Enable Row Level Security
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_payment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS Policies
-- Academic Years - everyone can read active years
CREATE POLICY "Anyone can view active academic years" ON academic_years
  FOR SELECT USING (is_active = true);

-- Student Payment Progress - users can view their own or admins can view all
CREATE POLICY "Students can view own payment progress" ON student_payment_progress
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM students WHERE id = student_payment_progress.student_id
    )
  );

CREATE POLICY "Staff can manage payment progress" ON student_payment_progress
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'manager', 'accountant')
  );

-- Audit Trail - users can view their own actions, admins can view all
CREATE POLICY "Users can view own audit trail" ON audit_trail
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Staff can view all audit trail" ON audit_trail
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'manager')
  );

-- 14. Insert sample payment plans for current academic year
INSERT INTO payment_plans (name, description, amount, currency, duration_weeks, payment_cycles, academic_year_id, is_active)
SELECT 
  '3 Cycle Plan (45 weeks)',
  'Pay in 3 installments over 45 weeks accommodation',
  4500.00,
  'GBP',
  45,
  3,
  ay.id,
  true
FROM academic_years ay WHERE ay.year_code = '25/26'
ON CONFLICT DO NOTHING;

INSERT INTO payment_plans (name, description, amount, currency, duration_weeks, payment_cycles, academic_year_id, is_active)
SELECT 
  '4 Cycle Plan (51 weeks)',
  'Pay in 4 installments over 51 weeks accommodation',
  5100.00,
  'GBP',
  51,
  4,
  ay.id,
  true
FROM academic_years ay WHERE ay.year_code = '25/26'
ON CONFLICT DO NOTHING;

INSERT INTO payment_plans (name, description, amount, currency, duration_weeks, payment_cycles, academic_year_id, is_active)
SELECT 
  '10 Cycle Plan (51 weeks)',
  'Pay in 10 installments over 51 weeks accommodation',
  5100.00,
  'GBP',
  51,
  10,
  ay.id,
  true
FROM academic_years ay WHERE ay.year_code = '25/26'
ON CONFLICT DO NOTHING;

-- 15. Update existing students with current academic year (if any exist)
UPDATE students 
SET academic_year_id = (SELECT id FROM academic_years WHERE year_code = '25/26' LIMIT 1)
WHERE academic_year_id IS NULL;

-- 16. Now create the payment progress trigger function (after students table has all columns)
CREATE OR REPLACE FUNCTION create_payment_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Create payment progress record when student is assigned to payment plan
  IF NEW.payment_plan_id IS NOT NULL AND (OLD IS NULL OR OLD.payment_plan_id IS NULL OR OLD.payment_plan_id != NEW.payment_plan_id) THEN
    INSERT INTO student_payment_progress (
      student_id,
      payment_plan_id,
      total_installments,
      total_amount,
      deposit_paid,
      deposit_paid_date
    )
    SELECT 
      NEW.id,
      NEW.payment_plan_id,
      pp.payment_cycles,
      pp.amount,
      NEW.deposit_paid,
      CASE WHEN NEW.deposit_paid THEN NOW() ELSE NULL END
    FROM payment_plans pp
    WHERE pp.id = NEW.payment_plan_id
    ON CONFLICT (student_id) DO UPDATE SET
      payment_plan_id = EXCLUDED.payment_plan_id,
      total_installments = EXCLUDED.total_installments,
      total_amount = EXCLUDED.total_amount,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 17. Create trigger for payment progress
DROP TRIGGER IF EXISTS trigger_create_payment_progress ON students;
CREATE TRIGGER trigger_create_payment_progress
  AFTER INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_progress();

COMMENT ON TABLE academic_years IS 'Tracks different academic years for student accommodation booking cycles';
COMMENT ON TABLE student_payment_progress IS 'Tracks individual student payment progress and installment status';
COMMENT ON TABLE audit_trail IS 'Comprehensive audit trail for all student-related activities and changes';