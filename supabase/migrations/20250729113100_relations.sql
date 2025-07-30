-- =========================================
-- UrbanHub Phase-2 Relationships & Triggers
-- =========================================
-- Run via `supabase db push`

-- 1. Students ↔ Auth Users --------------------------------
ALTER TABLE IF EXISTS students
  ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'students_user_fk'
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT students_user_fk FOREIGN KEY (user_id)
      REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'students_user_unique'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_user_unique UNIQUE (user_id);
  END IF;
END$$;

-- 2. Students ↔ Studios ------------------------------------
ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS room UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'students_room_fk'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_room_fk FOREIGN KEY (room)
      REFERENCES studios(id) ON DELETE SET NULL NOT VALID;
  END IF;
END$$;

CREATE OR REPLACE FUNCTION sync_studio_occupancy() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.room <> OLD.room AND OLD.room IS NOT NULL THEN
    UPDATE studios SET occupied = false, occupiedby = NULL WHERE id = OLD.room;
  END IF;
  IF NEW.room IS NOT NULL THEN
    UPDATE studios SET occupied = true, occupiedby = NEW.id WHERE id = NEW.room;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_studio_occupancy') THEN
    CREATE TRIGGER trg_sync_studio_occupancy AFTER INSERT OR UPDATE OF room ON students
      FOR EACH ROW EXECUTE FUNCTION sync_studio_occupancy();
  END IF;
END$$;

-- 3. Leads → Students/Tourists -----------------------------
ALTER TABLE IF EXISTS leads
  ADD COLUMN IF NOT EXISTS converted_student_id INTEGER,
  ADD COLUMN IF NOT EXISTS converted_tourist_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='leads_conv_student_fk') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_conv_student_fk FOREIGN KEY(converted_student_id) REFERENCES students(id) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='leads_conv_tourist_fk') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_conv_tourist_fk FOREIGN KEY(converted_tourist_id) REFERENCES tourists(id) NOT VALID;
  END IF;
END$$;

-- 4. Invoice helper index ----------------------------------
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(status, due_date);

-- 5. updated_at auto trigger -------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['students','leads','studios','invoices'] LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at_%s BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', tbl, tbl);
  END LOOP;
END$$;

-- Done ✅ 