-- Add roomGrade column to studios table
-- Run this in your Supabase SQL Editor

ALTER TABLE studios 
ADD COLUMN "roomGrade" TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN studios."roomGrade" IS 'Room grade classification for the studio (e.g., Deluxe, Premium, Standard)';

-- Update existing studios to have a default room grade if needed
-- UPDATE studios SET "roomGrade" = 'Standard' WHERE "roomGrade" IS NULL; 