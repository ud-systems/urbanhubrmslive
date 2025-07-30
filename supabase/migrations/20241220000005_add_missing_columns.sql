-- Add missing columns to existing student_applications table
ALTER TABLE student_applications 
ADD COLUMN IF NOT EXISTS student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_student_applications_student_id ON student_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_applications_is_complete ON student_applications(is_complete); 