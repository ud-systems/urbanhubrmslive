-- Payment Plan System Improvements
-- Add computed columns and indexes for better performance
-- Run via: npx supabase db push --linked

-- 1. Create a view for payment plan statistics
CREATE OR REPLACE VIEW payment_plan_stats AS
SELECT 
  pp.payment_cycles,
  pp.duration_weeks,
  COUNT(s.id) as total_students,
  COUNT(CASE WHEN s.deposit_paid = true THEN 1 END) as students_with_deposit,
  COUNT(CASE WHEN s.deposit_paid = false THEN 1 END) as students_without_deposit,
  AVG(spp.paid_installments::float / spp.total_installments::float * 100) as avg_payment_progress
FROM payment_plans pp
LEFT JOIN students s ON s.payment_cycles = pp.payment_cycles
LEFT JOIN student_payment_progress spp ON spp.student_id = s.id
WHERE pp.is_active = true
GROUP BY pp.payment_cycles, pp.duration_weeks;

-- 2. Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_payment_cycles ON students(payment_cycles);
CREATE INDEX IF NOT EXISTS idx_students_duration_weeks ON students(duration_weeks);
CREATE INDEX IF NOT EXISTS idx_students_payment_cycles_duration ON students(payment_cycles, duration_weeks);

-- 3. Add a computed column for payment plan display name
ALTER TABLE payment_plans ADD COLUMN IF NOT EXISTS display_name TEXT GENERATED ALWAYS AS (
  payment_cycles || ' Cycle Plan'
) STORED;

-- 4. Add constraint to ensure valid payment cycles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_payment_cycles' AND table_name = 'students'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT valid_payment_cycles 
      CHECK (payment_cycles IN (3, 4, 10));
  END IF;
END $$;

-- 5. Add constraint to ensure valid duration weeks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_duration_weeks' AND table_name = 'students'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT valid_duration_weeks 
      CHECK (duration_weeks IN (45, 51));
  END IF;
END $$;

-- 6. Create a function to get students by payment cycle with stats
CREATE OR REPLACE FUNCTION get_students_by_payment_cycle(cycle_count INTEGER)
RETURNS TABLE (
  student_id INTEGER,
  student_name TEXT,
  student_email TEXT,
  studio_allocated TEXT,
  deposit_paid BOOLEAN,
  duration_weeks INTEGER,
  paid_installments INTEGER,
  total_installments INTEGER,
  payment_progress_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.name as student_name,
    s.email as student_email,
    COALESCE(s.assignedto, s.room, 'Not Assigned') as studio_allocated,
    s.deposit_paid,
    s.duration_weeks,
    COALESCE(spp.paid_installments, 0) as paid_installments,
    COALESCE(spp.total_installments, cycle_count) as total_installments,
    ROUND(
      COALESCE(spp.paid_installments::NUMERIC / spp.total_installments::NUMERIC * 100, 0), 
      1
    ) as payment_progress_percentage
  FROM students s
  LEFT JOIN student_payment_progress spp ON spp.student_id = s.id
  WHERE s.payment_cycles = cycle_count
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

-- 7. Grant permissions for the view and function
GRANT SELECT ON payment_plan_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_students_by_payment_cycle(INTEGER) TO authenticated; 