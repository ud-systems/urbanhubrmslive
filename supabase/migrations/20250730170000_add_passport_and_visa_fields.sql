-- Add Passport and Current Visa Fields to Student Applications
-- Run via: npx supabase db push --linked

-- Add Passport Document Fields
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS passport_url TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS passport_filename TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS passport_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Add Current Visa Document Fields
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS current_visa_url TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS current_visa_filename TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS current_visa_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_applications_passport_url ON student_applications(passport_url);
CREATE INDEX IF NOT EXISTS idx_student_applications_current_visa_url ON student_applications(current_visa_url);

-- Add comments for documentation
COMMENT ON COLUMN student_applications.passport_url IS 'URL to uploaded passport document';
COMMENT ON COLUMN student_applications.passport_filename IS 'Original filename of uploaded passport document';
COMMENT ON COLUMN student_applications.passport_uploaded_at IS 'Timestamp when passport document was uploaded';
COMMENT ON COLUMN student_applications.current_visa_url IS 'URL to uploaded current visa document';
COMMENT ON COLUMN student_applications.current_visa_filename IS 'Original filename of uploaded current visa document';
COMMENT ON COLUMN student_applications.current_visa_uploaded_at IS 'Timestamp when current visa document was uploaded'; 