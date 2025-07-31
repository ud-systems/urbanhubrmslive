-- Fix Guarantor Relationship Constraint
-- This migration fixes the constraint violation for guarantor_relationship field

-- Step 1: Check if the constraint exists and drop it if it's too restrictive
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_guarantor_relationship') THEN
        ALTER TABLE student_applications DROP CONSTRAINT valid_guarantor_relationship;
    END IF;
END $$;

-- Step 2: Create a more flexible constraint that allows empty strings and null values
ALTER TABLE student_applications 
ADD CONSTRAINT valid_guarantor_relationship 
CHECK (guarantor_relationship IS NULL OR guarantor_relationship = '' OR guarantor_relationship IN (
    'Parent', 'Guardian', 'Sibling', 'Spouse', 'Other', 'Friend', 'Relative'
));

-- Step 3: Update existing records to have valid guarantor_relationship values
UPDATE student_applications 
SET guarantor_relationship = NULL 
WHERE guarantor_relationship = '' OR guarantor_relationship NOT IN (
    'Parent', 'Guardian', 'Sibling', 'Spouse', 'Other', 'Friend', 'Relative'
); 