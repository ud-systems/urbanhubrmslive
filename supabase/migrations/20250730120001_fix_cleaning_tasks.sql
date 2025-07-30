-- Fix cleaning_tasks table structure
-- Add missing estimated_minutes column if it doesn't exist

ALTER TABLE cleaning_tasks ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 15;

-- The template tasks will be created dynamically by the application when needed
-- No need to insert template tasks with foreign key constraints

-- Ensure the table has all necessary columns
ALTER TABLE cleaning_tasks ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id);
ALTER TABLE cleaning_tasks ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add any missing columns to cleaning_schedules table
ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 120;
ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS reservation_type TEXT DEFAULT 'student' CHECK (reservation_type IN ('student', 'tourist'));
ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS reservation_id INTEGER;
ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS checkout_trigger_date DATE;
ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS special_requirements TEXT;
ALTER TABLE cleaning_schedules ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Add checkout_date column to students table if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS checkout_date DATE; 