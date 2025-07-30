-- Fix student application synchronization issues
-- This migration ensures proper data flow between students and student_applications tables

-- Step 1: Add missing columns to student_applications if they don't exist
ALTER TABLE student_applications 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS mobile VARCHAR(50),
ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE;

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_applications_user_id ON student_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_student_applications_email ON student_applications(email);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- Step 3: Create a function to sync data between tables
CREATE OR REPLACE FUNCTION sync_student_application_data()
RETURNS TRIGGER AS $$
BEGIN
    -- When student_applications is updated, sync basic fields to students table
    IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
        UPDATE students 
        SET 
            name = COALESCE(NEW.first_name, students.name),
            email = COALESCE(NEW.email, students.email),
            phone = COALESCE(NEW.mobile, students.phone),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to automatically sync data
DROP TRIGGER IF EXISTS trigger_sync_student_application ON student_applications;
CREATE TRIGGER trigger_sync_student_application
    AFTER INSERT OR UPDATE ON student_applications
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_application_data();

-- Step 5: Create a function to sync from students to student_applications
CREATE OR REPLACE FUNCTION sync_student_to_application()
RETURNS TRIGGER AS $$
BEGIN
    -- When students table is updated, sync basic fields to student_applications
    IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
        UPDATE student_applications 
        SET 
            first_name = COALESCE(NEW.name, student_applications.first_name),
            email = COALESCE(NEW.email, student_applications.email),
            mobile = COALESCE(NEW.phone, student_applications.mobile),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for students table
DROP TRIGGER IF EXISTS trigger_sync_student_to_application ON students;
CREATE TRIGGER trigger_sync_student_to_application
    AFTER INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION sync_student_to_application();

-- Step 7: Add RLS policies for better security
ALTER TABLE student_applications ENABLE ROW LEVEL SECURITY;

-- Allow students to read their own application data
CREATE POLICY "Students can read own application" ON student_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Allow students to update their own application data
CREATE POLICY "Students can update own application" ON student_applications
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow students to insert their own application data
CREATE POLICY "Students can insert own application" ON student_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read application data (for staff)
CREATE POLICY "Authenticated users can read applications" ON student_applications
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role full access
CREATE POLICY "Service role full access" ON student_applications
    FOR ALL USING (auth.role() = 'service_role');

-- Step 8: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE, INSERT ON student_applications TO authenticated;
GRANT ALL ON student_applications TO service_role; 