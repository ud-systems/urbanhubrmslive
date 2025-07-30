-- Add Guarantor and Payment Fields to Student Applications
-- Run via: npx supabase db push --linked

-- 1. Add Payment Installment Question
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS wants_installments BOOLEAN;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS selected_installment_plan TEXT;

-- 2. Add Guarantor Information Fields
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS guarantor_name TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS guarantor_email TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS guarantor_phone TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS guarantor_date_of_birth DATE;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS guarantor_relationship TEXT;

-- 3. Add Document Upload Fields
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS utility_bill_url TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS utility_bill_filename TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS utility_bill_uploaded_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS identity_document_url TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS identity_document_filename TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS identity_document_uploaded_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS bank_statement_url TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS bank_statement_filename TEXT;
ALTER TABLE student_applications ADD COLUMN IF NOT EXISTS bank_statement_uploaded_at TIMESTAMP WITH TIME ZONE;

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_applications_wants_installments ON student_applications(wants_installments);
CREATE INDEX IF NOT EXISTS idx_student_applications_guarantor_email ON student_applications(guarantor_email);

-- 5. Add constraints for data validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'valid_guarantor_relationship' AND table_name = 'student_applications'
  ) THEN
    ALTER TABLE student_applications ADD CONSTRAINT valid_guarantor_relationship
      CHECK (guarantor_relationship IN ('Mother', 'Father', 'Guardian', 'Sibling', 'Other'));
  END IF;
END $$;

-- 6. Add comments for documentation
COMMENT ON COLUMN student_applications.wants_installments IS 'Whether the student wants to pay in installments';
COMMENT ON COLUMN student_applications.selected_installment_plan IS 'The selected installment plan (3, 4, or 10 cycles)';
COMMENT ON COLUMN student_applications.guarantor_name IS 'Full name of the guarantor';
COMMENT ON COLUMN student_applications.guarantor_email IS 'Email address of the guarantor';
COMMENT ON COLUMN student_applications.guarantor_phone IS 'Phone number of the guarantor';
COMMENT ON COLUMN student_applications.guarantor_date_of_birth IS 'Date of birth of the guarantor';
COMMENT ON COLUMN student_applications.guarantor_relationship IS 'Relationship of guarantor to student';
COMMENT ON COLUMN student_applications.utility_bill_url IS 'URL to uploaded utility bill document';
COMMENT ON COLUMN student_applications.identity_document_url IS 'URL to uploaded identity document (passport/drivers license/birth certificate)';
COMMENT ON COLUMN student_applications.bank_statement_url IS 'URL to uploaded bank statement document'; 