-- Create Websites Table
-- This migration creates a websites table for managing property websites and landing pages

-- Step 1: Create the websites table
CREATE TABLE IF NOT EXISTS websites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    type TEXT NOT NULL DEFAULT 'landing_page' CHECK (type IN ('landing_page', 'booking_site', 'marketing_site', 'portal')),
    analytics_enabled BOOLEAN DEFAULT false,
    seo_optimized BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_websites_status ON websites(status);
CREATE INDEX IF NOT EXISTS idx_websites_type ON websites(type);
CREATE INDEX IF NOT EXISTS idx_websites_created_at ON websites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_websites_created_by ON websites(created_by);

-- Step 3: Enable Row Level Security
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for admin-only access

-- Policy for SELECT operations (admin only)
CREATE POLICY websites_select_policy ON websites
    FOR SELECT USING (
        -- Only allow admin users to view websites
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy for INSERT operations (admin only)
CREATE POLICY websites_insert_policy ON websites
    FOR INSERT WITH CHECK (
        -- Only allow admin users to create websites
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
        AND
        -- Set created_by to current user
        created_by = auth.uid()
    );

-- Policy for UPDATE operations (admin only)
CREATE POLICY websites_update_policy ON websites
    FOR UPDATE USING (
        -- Only allow admin users to update websites
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    ) WITH CHECK (
        -- Same conditions for the check
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
        AND
        -- Set updated_by to current user
        updated_by = auth.uid()
    );

-- Policy for DELETE operations (admin only)
CREATE POLICY websites_delete_policy ON websites
    FOR DELETE USING (
        -- Only allow admin users to delete websites
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Step 5: Grant necessary permissions
GRANT ALL ON websites TO authenticated;

-- Step 6: Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_websites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to automatically update updated_at
CREATE TRIGGER update_websites_updated_at_trigger
    BEFORE UPDATE ON websites
    FOR EACH ROW
    EXECUTE FUNCTION update_websites_updated_at();

-- Step 8: Insert some sample data for testing (only if table is empty)
INSERT INTO websites (name, url, description, status, type, analytics_enabled, seo_optimized)
SELECT 
    'UrbanHub Main Site',
    'https://urbanhub.com',
    'Main property management website with booking functionality',
    'active',
    'booking_site',
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM websites);

INSERT INTO websites (name, url, description, status, type, analytics_enabled, seo_optimized)
SELECT 
    'Student Portal',
    'https://portal.urbanhub.com',
    'Student portal for managing applications and payments',
    'active',
    'portal',
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM websites WHERE name = 'Student Portal');

INSERT INTO websites (name, url, description, status, type, analytics_enabled, seo_optimized)
SELECT 
    'Marketing Landing Page',
    'https://landing.urbanhub.com',
    'Marketing landing page for lead generation',
    'active',
    'landing_page',
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM websites WHERE name = 'Marketing Landing Page');

-- Step 9: Create a view for public website information (if needed for public access)
CREATE OR REPLACE VIEW public_websites AS
SELECT 
    id,
    name,
    url,
    description,
    status,
    type,
    created_at
FROM websites
WHERE status = 'active';

-- Grant read access to the public view
GRANT SELECT ON public_websites TO anon;
GRANT SELECT ON public_websites TO authenticated; 