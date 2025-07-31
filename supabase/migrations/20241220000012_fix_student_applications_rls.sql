-- Fix Student Applications RLS Policies
-- This migration fixes the RLS policy violations that prevent creating student applications

-- Step 1: Enable RLS on student_applications table if not already enabled
ALTER TABLE student_applications ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DO $$ 
BEGIN
    -- Drop policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_applications' AND policyname = 'student_applications_select_policy') THEN
        DROP POLICY student_applications_select_policy ON student_applications;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_applications' AND policyname = 'student_applications_insert_policy') THEN
        DROP POLICY student_applications_insert_policy ON student_applications;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_applications' AND policyname = 'student_applications_update_policy') THEN
        DROP POLICY student_applications_update_policy ON student_applications;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_applications' AND policyname = 'student_applications_delete_policy') THEN
        DROP POLICY student_applications_delete_policy ON student_applications;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_applications' AND policyname = 'student_applications_all_policy') THEN
        DROP POLICY student_applications_all_policy ON student_applications;
    END IF;
END $$;

-- Step 3: Create comprehensive RLS policies for student_applications

-- Policy for SELECT operations
CREATE POLICY student_applications_select_policy ON student_applications
    FOR SELECT USING (
        -- Allow users to see their own applications
        auth.uid()::text = user_id::text
        OR
        -- Allow authenticated users to see all applications (for admin purposes)
        auth.role() = 'authenticated'
    );

-- Policy for INSERT operations
CREATE POLICY student_applications_insert_policy ON student_applications
    FOR INSERT WITH CHECK (
        -- Allow authenticated users to create applications
        auth.role() = 'authenticated'
        AND
        -- Ensure the user_id matches the authenticated user (if provided)
        (user_id IS NULL OR auth.uid()::text = user_id::text)
    );

-- Policy for UPDATE operations
CREATE POLICY student_applications_update_policy ON student_applications
    FOR UPDATE USING (
        -- Allow users to update their own applications
        auth.uid()::text = user_id::text
        OR
        -- Allow authenticated users to update any application (for admin purposes)
        auth.role() = 'authenticated'
    ) WITH CHECK (
        -- Same conditions for the check
        auth.uid()::text = user_id::text
        OR
        auth.role() = 'authenticated'
    );

-- Policy for DELETE operations
CREATE POLICY student_applications_delete_policy ON student_applications
    FOR DELETE USING (
        -- Allow authenticated users to delete applications (for admin purposes)
        auth.role() = 'authenticated'
    );

-- Step 4: Grant necessary permissions to authenticated users
GRANT ALL ON student_applications TO authenticated;
GRANT USAGE ON SEQUENCE student_applications_id_seq TO authenticated;

-- Step 5: Create a function to bypass RLS for service role operations (if needed)
CREATE OR REPLACE FUNCTION create_student_application_service(
    p_user_id UUID,
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT,
    p_mobile TEXT,
    p_birthday DATE,
    p_age INTEGER,
    p_ethnicity TEXT,
    p_gender TEXT,
    p_ucas_id TEXT,
    p_country TEXT,
    p_address_line_1 TEXT,
    p_address_line_2 TEXT,
    p_post_code TEXT,
    p_town TEXT,
    p_year_of_study TEXT,
    p_field_of_study TEXT,
    p_is_disabled BOOLEAN,
    p_is_smoker BOOLEAN,
    p_medical_requirements TEXT,
    p_entry_into_uk TEXT,
    p_wants_installments BOOLEAN,
    p_selected_installment_plan TEXT,
    p_payment_installments TEXT,
    p_data_consent BOOLEAN,
    p_deposit_paid BOOLEAN,
    p_guarantor_name TEXT,
    p_guarantor_email TEXT,
    p_guarantor_phone TEXT,
    p_guarantor_date_of_birth DATE,
    p_guarantor_relationship TEXT,
    p_utility_bill_url TEXT,
    p_utility_bill_filename TEXT,
    p_identity_document_url TEXT,
    p_identity_document_filename TEXT,
    p_bank_statement_url TEXT,
    p_bank_statement_filename TEXT,
    p_passport_url TEXT,
    p_passport_filename TEXT,
    p_current_visa_url TEXT,
    p_current_visa_filename TEXT,
    p_current_step INTEGER,
    p_is_complete BOOLEAN,
    p_date_of_inquiry DATE,
    p_lead_notes TEXT,
    p_source TEXT
) RETURNS student_applications AS $$
DECLARE
    new_application student_applications;
BEGIN
    INSERT INTO student_applications (
        user_id, first_name, last_name, email, mobile, birthday, age, ethnicity, gender,
        ucas_id, country, address_line_1, address_line_2, post_code, town, year_of_study,
        field_of_study, is_disabled, is_smoker, medical_requirements, entry_into_uk,
        wants_installments, selected_installment_plan, payment_installments, data_consent,
        deposit_paid, guarantor_name, guarantor_email, guarantor_phone, guarantor_date_of_birth,
        guarantor_relationship, utility_bill_url, utility_bill_filename, identity_document_url,
        identity_document_filename, bank_statement_url, bank_statement_filename, passport_url,
        passport_filename, current_visa_url, current_visa_filename, current_step, is_complete,
        date_of_inquiry, lead_notes, source
    ) VALUES (
        p_user_id, p_first_name, p_last_name, p_email, p_mobile, p_birthday, p_age, p_ethnicity, p_gender,
        p_ucas_id, p_country, p_address_line_1, p_address_line_2, p_post_code, p_town, p_year_of_study,
        p_field_of_study, p_is_disabled, p_is_smoker, p_medical_requirements, p_entry_into_uk,
        p_wants_installments, p_selected_installment_plan, p_payment_installments, p_data_consent,
        p_deposit_paid, p_guarantor_name, p_guarantor_email, p_guarantor_phone, p_guarantor_date_of_birth,
        p_guarantor_relationship, p_utility_bill_url, p_utility_bill_filename, p_identity_document_url,
        p_identity_document_filename, p_bank_statement_url, p_bank_statement_filename, p_passport_url,
        p_passport_filename, p_current_visa_url, p_current_visa_filename, p_current_step, p_is_complete,
        p_date_of_inquiry, p_lead_notes, p_source
    ) RETURNING * INTO new_application;
    
    RETURN new_application;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_student_application_service TO authenticated;
GRANT EXECUTE ON FUNCTION create_student_application_service TO service_role;

-- Step 6: Create a trigger to automatically set created_at and updated_at
CREATE OR REPLACE FUNCTION update_student_applications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF TG_OP = 'INSERT' THEN
        NEW.created_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_student_applications_timestamp') THEN
        CREATE TRIGGER update_student_applications_timestamp
            BEFORE INSERT OR UPDATE ON student_applications
            FOR EACH ROW
            EXECUTE FUNCTION update_student_applications_timestamp();
    END IF;
END $$; 