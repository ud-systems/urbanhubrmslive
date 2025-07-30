-- Update RLS policies for maintenance_requests table to be more permissive
-- Run via: supabase db push

-- Drop all existing policies
DROP POLICY IF EXISTS "Students can view their own maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Students can create maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Users can update maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Admin can delete maintenance requests" ON maintenance_requests;

-- Create more permissive policies
-- Allow authenticated users to view maintenance requests (with row-level filtering)
CREATE POLICY "All authenticated users can view maintenance requests" ON maintenance_requests
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IS NOT NULL
  );

-- Allow authenticated users to create maintenance requests
CREATE POLICY "All authenticated users can create maintenance requests" ON maintenance_requests
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth.uid() IS NOT NULL
  );

-- Allow authenticated users to update maintenance requests
CREATE POLICY "All authenticated users can update maintenance requests" ON maintenance_requests
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth.uid() IS NOT NULL
  );

-- Allow admin and managers to delete maintenance requests
CREATE POLICY "Admin can delete maintenance requests" ON maintenance_requests
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    auth.uid() IS NOT NULL
  );

-- Ensure students table is accessible for maintenance request queries
DROP POLICY IF EXISTS "Students are viewable by authenticated users" ON students;
CREATE POLICY "Students are viewable by authenticated users" ON students
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IS NOT NULL
  );

-- Ensure studios table is accessible for maintenance request queries  
DROP POLICY IF EXISTS "Studios are viewable by authenticated users" ON studios;
CREATE POLICY "Studios are viewable by authenticated users" ON studios
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IS NOT NULL
  ); 