-- =========================================
-- UrbanHub Cleaning Automation System
-- =========================================
-- Run via: supabase db push

-- 1. Add cleaning status to studios table
ALTER TABLE studios ADD COLUMN IF NOT EXISTS cleaning_status TEXT DEFAULT 'clean' 
  CHECK (cleaning_status IN ('clean', 'dirty', 'needs_cleaning', 'in_progress'));

ALTER TABLE studios ADD COLUMN IF NOT EXISTS last_cleaned_date DATE;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS next_cleaning_date DATE;

-- 2. Add checkout dates for students (calculated from checkin + duration)
ALTER TABLE students ADD COLUMN IF NOT EXISTS checkout_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS next_deep_clean_date DATE;

-- 3. Update existing cleaning_schedules table or create if not exists
DO $$
BEGIN
  -- Check if cleaning_schedules table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cleaning_schedules') THEN
    -- Create new table
    CREATE TABLE cleaning_schedules (
      id BIGSERIAL PRIMARY KEY,
      studio_id TEXT NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
      reservation_type TEXT NOT NULL CHECK (reservation_type IN ('student', 'tourist')),
      reservation_id INTEGER,
      scheduled_date DATE NOT NULL,
      scheduled_time TIME DEFAULT '10:00',
      checkout_trigger_date DATE,
      cleaning_type TEXT NOT NULL DEFAULT 'checkout' CHECK (cleaning_type IN ('checkout', 'deep_clean', 'maintenance', 'emergency')),
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
      assigned_cleaner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      estimated_duration INTEGER DEFAULT 120,
      notes TEXT,
      special_requirements TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE
    );
  ELSE
    -- Add missing columns to existing table
    ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS reservation_type TEXT DEFAULT 'student' CHECK (reservation_type IN ('student', 'tourist'));
    ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS reservation_id INTEGER;
    ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS scheduled_time TIME DEFAULT '10:00';
    ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS checkout_trigger_date DATE;
    ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS assigned_cleaner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 120;
    ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS special_requirements TEXT;
    ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
    
    -- Update cleaning_type constraint if needed
    DO $constraint_check$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%cleaning_type%' 
        AND check_clause LIKE '%deep_clean%'
      ) THEN
        -- Drop old constraint and add new one
        ALTER TABLE cleaning_schedules DROP CONSTRAINT IF EXISTS cleaning_schedules_cleaning_type_check;
        ALTER TABLE cleaning_schedules ADD CONSTRAINT cleaning_schedules_cleaning_type_check 
          CHECK (cleaning_type IN ('checkout', 'deep_clean', 'maintenance', 'emergency'));
      END IF;
    END $constraint_check$;
    
    -- Update status constraint if needed
    DO $status_check$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%status%' 
        AND check_clause LIKE '%overdue%'
      ) THEN
        ALTER TABLE cleaning_schedules DROP CONSTRAINT IF EXISTS cleaning_schedules_status_check;
        ALTER TABLE cleaning_schedules ADD CONSTRAINT cleaning_schedules_status_check 
          CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'));
      END IF;
    END $status_check$;
  END IF;
END$$;

-- 4. Create cleaning_tasks table for detailed task management
CREATE TABLE IF NOT EXISTS cleaning_tasks (
  id BIGSERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES cleaning_schedules(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  estimated_minutes INTEGER DEFAULT 15,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create cleaning_supplies_usage table for supply tracking
CREATE TABLE IF NOT EXISTS cleaning_supplies_usage (
  id BIGSERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES cleaning_schedules(id) ON DELETE CASCADE,
  supply_name TEXT NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  cost DECIMAL(10,2),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_by UUID REFERENCES auth.users(id)
);

-- 6. Create indexes for performance (check if they exist first)
CREATE INDEX IF NOT EXISTS idx_cleaning_schedules_studio_id ON cleaning_schedules(studio_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_schedules_date ON cleaning_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_schedules_status ON cleaning_schedules(status);

-- Only create this index if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaning_schedules' 
    AND column_name = 'assigned_cleaner_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_cleaning_schedules_cleaner ON cleaning_schedules(assigned_cleaner_id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_cleaning_schedules_type ON cleaning_schedules(cleaning_type);
CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_schedule ON cleaning_tasks(schedule_id);
CREATE INDEX IF NOT EXISTS idx_studios_cleaning_status ON studios(cleaning_status);
CREATE INDEX IF NOT EXISTS idx_students_checkout_date ON students(checkout_date);

-- 7. Enable Row Level Security
ALTER TABLE cleaning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_supplies_usage ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for cleaning_schedules
DROP POLICY IF EXISTS "Authenticated users can view cleaning schedules" ON cleaning_schedules;
CREATE POLICY "Authenticated users can view cleaning schedules" ON cleaning_schedules
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Cleaners and managers can update cleaning schedules" ON cleaning_schedules;
CREATE POLICY "Cleaners and managers can update cleaning schedules" ON cleaning_schedules
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.role IN ('admin', 'manager', 'cleaner')
    ) OR
    assigned_cleaner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Managers can insert cleaning schedules" ON cleaning_schedules;
CREATE POLICY "Managers can insert cleaning schedules" ON cleaning_schedules
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can delete cleaning schedules" ON cleaning_schedules;
CREATE POLICY "Managers can delete cleaning schedules" ON cleaning_schedules
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.role IN ('admin', 'manager')
    )
  );

-- 9. Create RLS policies for cleaning_tasks
DROP POLICY IF EXISTS "Authenticated users can view cleaning tasks" ON cleaning_tasks;
CREATE POLICY "Authenticated users can view cleaning tasks" ON cleaning_tasks
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Cleaners can update cleaning tasks" ON cleaning_tasks;
CREATE POLICY "Cleaners can update cleaning tasks" ON cleaning_tasks
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.role IN ('admin', 'manager', 'cleaner')
    ) OR
    auth.uid() IN (
      SELECT cs.assigned_cleaner_id FROM cleaning_schedules cs WHERE cs.id = cleaning_tasks.schedule_id
    )
  );

-- 10. Create functions for automation

-- Function to calculate checkout date from checkin and duration
CREATE OR REPLACE FUNCTION calculate_checkout_date(checkin_date DATE, duration_text TEXT)
RETURNS DATE AS $$
BEGIN
  IF duration_text ILIKE '%45 weeks%' OR duration_text ILIKE '%45weeks%' THEN
    RETURN checkin_date + INTERVAL '45 weeks';
  ELSIF duration_text ILIKE '%51 weeks%' OR duration_text ILIKE '%51weeks%' THEN
    RETURN checkin_date + INTERVAL '51 weeks';
  ELSIF duration_text ILIKE '%days%' THEN
    -- Extract number of days from text like "30 days"
    RETURN checkin_date + (REGEXP_REPLACE(duration_text, '[^0-9]', '', 'g')::INTEGER || ' days')::INTERVAL;
  ELSIF duration_text ILIKE '%weeks%' THEN
    -- Extract number of weeks from text like "12 weeks"
    RETURN checkin_date + (REGEXP_REPLACE(duration_text, '[^0-9]', '', 'g')::INTEGER || ' weeks')::INTERVAL;
  ELSE
    -- Default to 45 weeks if duration is unclear
    RETURN checkin_date + INTERVAL '45 weeks';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign cleaners based on availability
CREATE OR REPLACE FUNCTION auto_assign_cleaner(schedule_date DATE, schedule_time TIME DEFAULT '10:00')
RETURNS UUID AS $$
DECLARE
  cleaner_id UUID;
BEGIN
  -- Find cleaner with least assignments on that day
  SELECT u.id INTO cleaner_id
  FROM users u
  WHERE u.role = 'cleaner'
  ORDER BY (
    SELECT COUNT(*) 
    FROM cleaning_schedules cs 
    WHERE cs.assigned_cleaner_id = u.id 
    AND cs.scheduled_date = schedule_date
    AND cs.status IN ('scheduled', 'in_progress')
  ) ASC
  LIMIT 1;
  
  RETURN cleaner_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark studio as dirty on checkout
CREATE OR REPLACE FUNCTION mark_studio_dirty_on_checkout()
RETURNS TRIGGER AS $$
BEGIN
  -- When student/tourist is deleted or studio assignment removed
  IF TG_OP = 'DELETE' AND OLD.assignedto IS NOT NULL THEN
    UPDATE studios 
    SET cleaning_status = 'dirty',
        occupied = false,
        occupiedby = NULL
    WHERE id = OLD.assignedto;
    
    -- Schedule immediate checkout cleaning (only if assigned_cleaner_id column exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'cleaning_schedules' 
      AND column_name = 'assigned_cleaner_id'
    ) THEN
      INSERT INTO cleaning_schedules (
        studio_id,
        reservation_type,
        reservation_id,
        scheduled_date,
        scheduled_time,
        cleaning_type,
        priority,
        assigned_cleaner_id,
        notes
      ) VALUES (
        OLD.assignedto,
        CASE 
          WHEN TG_TABLE_NAME = 'students' THEN 'student'
          WHEN TG_TABLE_NAME = 'tourists' THEN 'tourist'
          ELSE 'student'
        END,
        OLD.id,
        CURRENT_DATE,
        '14:00', -- 2 PM default for checkout cleaning
        'checkout',
        'high',
        auto_assign_cleaner(CURRENT_DATE, '14:00'),
        'Automated: Post-checkout cleaning for ' || OLD.name
      );
    ELSE
      -- Insert without cleaner assignment if column doesn't exist yet
      INSERT INTO cleaning_schedules (
        studio_id,
        scheduled_date,
        cleaning_type,
        notes
      ) VALUES (
        OLD.assignedto,
        CURRENT_DATE,
        'checkout',
        'Automated: Post-checkout cleaning for ' || OLD.name
      );
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule upcoming cleaning (7 days before checkout)
CREATE OR REPLACE FUNCTION schedule_upcoming_cleaning()
RETURNS TRIGGER AS $$
DECLARE
  pre_checkout_date DATE;
  deep_clean_date DATE;
BEGIN
  -- Only process if checkout_date is being set/updated
  IF NEW.checkout_date IS NOT NULL AND (OLD.checkout_date IS NULL OR OLD.checkout_date != NEW.checkout_date) THEN
    
    -- Calculate pre-checkout cleaning date (7 days before)
    pre_checkout_date := NEW.checkout_date - INTERVAL '7 days';
    
    -- Only schedule if the date is in the future
    IF pre_checkout_date > CURRENT_DATE THEN
      -- Check if assigned_cleaner_id column exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cleaning_schedules' 
        AND column_name = 'assigned_cleaner_id'
      ) THEN
        INSERT INTO cleaning_schedules (
          studio_id,
          reservation_type,
          reservation_id,
          scheduled_date,
          checkout_trigger_date,
          cleaning_type,
          priority,
          assigned_cleaner_id,
          notes
        ) VALUES (
          NEW.assignedto,
          'student',
          NEW.id,
          pre_checkout_date,
          NEW.checkout_date,
          'checkout',
          'normal',
          auto_assign_cleaner(pre_checkout_date),
          'Automated: Pre-checkout preparation for ' || NEW.name
        );
      ELSE
        INSERT INTO cleaning_schedules (
          studio_id,
          scheduled_date,
          cleaning_type,
          notes
        ) VALUES (
          NEW.assignedto,
          pre_checkout_date,
          'checkout',
          'Automated: Pre-checkout preparation for ' || NEW.name
        );
      END IF;
    END IF;
    
    -- For students: Schedule deep clean after academic period
    IF TG_TABLE_NAME = 'students' AND NEW.duration IS NOT NULL THEN
      deep_clean_date := NEW.checkout_date + INTERVAL '1 day';
      
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cleaning_schedules' 
        AND column_name = 'assigned_cleaner_id'
      ) THEN
        INSERT INTO cleaning_schedules (
          studio_id,
          reservation_type,
          reservation_id,
          scheduled_date,
          cleaning_type,
          priority,
          estimated_duration,
          assigned_cleaner_id,
          notes
        ) VALUES (
          NEW.assignedto,
          'student',
          NEW.id,
          deep_clean_date,
          'deep_clean',
          'high',
          180, -- 3 hours for deep clean
          auto_assign_cleaner(deep_clean_date),
          'Automated: Post-academic deep clean for ' || NEW.name || ' (' || NEW.duration || ')'
        );
      ELSE
        INSERT INTO cleaning_schedules (
          studio_id,
          scheduled_date,
          cleaning_type,
          notes
        ) VALUES (
          NEW.assignedto,
          deep_clean_date,
          'deep_clean',
          'Automated: Post-academic deep clean for ' || NEW.name || ' (' || NEW.duration || ')'
        );
      END IF;
      
      -- Update student's next deep clean date
      UPDATE students 
      SET next_deep_clean_date = deep_clean_date 
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update studio cleaning status when cleaning is completed
CREATE OR REPLACE FUNCTION update_studio_on_cleaning_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When cleaning schedule is marked as completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE studios 
    SET cleaning_status = 'clean',
        last_cleaned_date = CURRENT_DATE,
        next_cleaning_date = NULL
    WHERE id = NEW.studio_id;
  ELSIF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    UPDATE studios 
    SET cleaning_status = 'in_progress'
    WHERE id = NEW.studio_id;
  ELSIF NEW.status = 'scheduled' AND OLD.status = 'in_progress' THEN
    UPDATE studios 
    SET cleaning_status = 'needs_cleaning'
    WHERE id = NEW.studio_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers
DROP TRIGGER IF EXISTS trg_mark_studio_dirty_students ON students;
CREATE TRIGGER trg_mark_studio_dirty_students
  AFTER DELETE ON students
  FOR EACH ROW EXECUTE FUNCTION mark_studio_dirty_on_checkout();

DROP TRIGGER IF EXISTS trg_mark_studio_dirty_tourists ON tourists;
CREATE TRIGGER trg_mark_studio_dirty_tourists
  AFTER DELETE ON tourists
  FOR EACH ROW EXECUTE FUNCTION mark_studio_dirty_on_checkout();

DROP TRIGGER IF EXISTS trg_schedule_upcoming_cleaning ON students;
CREATE TRIGGER trg_schedule_upcoming_cleaning
  AFTER INSERT OR UPDATE OF checkout_date ON students
  FOR EACH ROW EXECUTE FUNCTION schedule_upcoming_cleaning();

DROP TRIGGER IF EXISTS trg_update_studio_cleaning_status ON cleaning_schedules;
CREATE TRIGGER trg_update_studio_cleaning_status
  AFTER UPDATE OF status ON cleaning_schedules
  FOR EACH ROW EXECUTE FUNCTION update_studio_on_cleaning_completion();

-- 12. Insert default cleaning tasks templates (only if not exist)
-- Note: These will be handled in a separate migration to ensure the table structure is correct first

-- INSERT INTO cleaning_tasks (schedule_id, task_name, description, estimated_minutes) 
-- SELECT 0, 'Bathroom Deep Clean', 'Clean toilet, shower, sink, mirrors, and floors', 30
-- WHERE NOT EXISTS (SELECT 1 FROM cleaning_tasks WHERE task_name = 'Bathroom Deep Clean' AND schedule_id = 0);

-- INSERT INTO cleaning_tasks (schedule_id, task_name, description, estimated_minutes) 
-- SELECT 0, 'Kitchen Deep Clean', 'Clean appliances, counters, sink, and cabinets', 25
-- WHERE NOT EXISTS (SELECT 1 FROM cleaning_tasks WHERE task_name = 'Kitchen Deep Clean' AND schedule_id = 0);

-- INSERT INTO cleaning_tasks (schedule_id, task_name, description, estimated_minutes) 
-- SELECT 0, 'Bedroom Cleaning', 'Vacuum, dust surfaces, clean windows', 20
-- WHERE NOT EXISTS (SELECT 1 FROM cleaning_tasks WHERE task_name = 'Bedroom Cleaning' AND schedule_id = 0);

-- INSERT INTO cleaning_tasks (schedule_id, task_name, description, estimated_minutes) 
-- SELECT 0, 'Living Area Cleaning', 'Vacuum, dust, clean surfaces', 15
-- WHERE NOT EXISTS (SELECT 1 FROM cleaning_tasks WHERE task_name = 'Living Area Cleaning' AND schedule_id = 0);

-- INSERT INTO cleaning_tasks (schedule_id, task_name, description, estimated_minutes) 
-- SELECT 0, 'Final Inspection', 'Quality check and final touches', 10
-- WHERE NOT EXISTS (SELECT 1 FROM cleaning_tasks WHERE task_name = 'Final Inspection' AND schedule_id = 0);

-- 13. Create function to auto-update student checkout dates
CREATE OR REPLACE FUNCTION update_student_checkout_dates()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  student_record RECORD;
  new_checkout_date DATE;
BEGIN
  -- Update students without checkout dates
  FOR student_record IN 
    SELECT id, checkin, duration, name
    FROM students 
    WHERE checkout_date IS NULL 
    AND checkin IS NOT NULL 
    AND duration IS NOT NULL
  LOOP
    new_checkout_date := calculate_checkout_date(student_record.checkin::DATE, student_record.duration);
    
    UPDATE students 
    SET checkout_date = new_checkout_date 
    WHERE id = student_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 14. Run initial update for existing students
SELECT update_student_checkout_dates();

-- 15. Comments for documentation
COMMENT ON TABLE cleaning_schedules IS 'Automated and manual cleaning schedules for studios';
COMMENT ON COLUMN cleaning_schedules.reservation_type IS 'Type of reservation that triggered this cleaning (student/tourist)';
COMMENT ON COLUMN cleaning_schedules.cleaning_type IS 'Type of cleaning: checkout, deep_clean, maintenance, emergency';
COMMENT ON COLUMN studios.cleaning_status IS 'Current cleaning status: clean, dirty, needs_cleaning, in_progress';
COMMENT ON COLUMN students.checkout_date IS 'Calculated checkout date based on checkin + duration';

-- Done ✅ 