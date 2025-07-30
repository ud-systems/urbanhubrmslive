-- Database Optimization Migration
-- This migration consolidates multiple options tables into a unified structure

-- Step 1: Create application_options table with proper schema
CREATE TABLE IF NOT EXISTS application_options (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Migrate data from existing options tables
INSERT INTO application_options (category, name, sort_order, active)
SELECT 'ethnicity', name, sort_order, is_active 
FROM ethnicity_options 
WHERE NOT EXISTS (SELECT 1 FROM application_options WHERE category = 'ethnicity' AND name = ethnicity_options.name);

INSERT INTO application_options (category, name, sort_order, active)
SELECT 'gender', name, sort_order, is_active 
FROM gender_options 
WHERE NOT EXISTS (SELECT 1 FROM application_options WHERE category = 'gender' AND name = gender_options.name);

INSERT INTO application_options (category, name, sort_order, active)
SELECT 'country', name, sort_order, is_active 
FROM country_options 
WHERE NOT EXISTS (SELECT 1 FROM application_options WHERE category = 'country' AND name = country_options.name);

INSERT INTO application_options (category, name, sort_order, active)
SELECT 'year_of_study', name, sort_order, is_active 
FROM year_of_study_options 
WHERE NOT EXISTS (SELECT 1 FROM application_options WHERE category = 'year_of_study' AND name = year_of_study_options.name);

INSERT INTO application_options (category, name, sort_order, active)
SELECT 'entry_uk', name, sort_order, is_active 
FROM entry_uk_options 
WHERE NOT EXISTS (SELECT 1 FROM application_options WHERE category = 'entry_uk' AND name = entry_uk_options.name);

INSERT INTO application_options (category, name, sort_order, active)
SELECT 'payment_installment', name, sort_order, is_active 
FROM payment_installment_options 
WHERE NOT EXISTS (SELECT 1 FROM application_options WHERE category = 'payment_installment' AND name = payment_installment_options.name);

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_options_category ON application_options(category);
CREATE INDEX IF NOT EXISTS idx_application_options_active ON application_options(active);

-- Step 4: Add RLS policies for application_options
ALTER TABLE application_options ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read application options
CREATE POLICY "Allow authenticated users to read application options" ON application_options
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to manage application options
CREATE POLICY "Allow service role to manage application options" ON application_options
    FOR ALL USING (auth.role() = 'service_role');

-- Step 5: Create a function to get options by category
CREATE OR REPLACE FUNCTION get_application_options(category_name TEXT)
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    sort_order INTEGER,
    active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ao.id,
        ao.name,
        ao.sort_order,
        ao.active
    FROM application_options ao
    WHERE ao.category = category_name
    AND ao.active = true
    ORDER BY ao.sort_order, ao.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON application_options TO authenticated;
GRANT ALL ON application_options TO service_role; 