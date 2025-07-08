-- Migration: Add stock column to room_grades table
-- This adds a stock field to track how many studios of each room grade are available

-- Add stock column to room_grades table
ALTER TABLE room_grades 
ADD COLUMN stock INTEGER DEFAULT 0 NOT NULL;

-- Update existing room grades to have a default stock value
-- You can adjust these values based on your actual studio inventory
UPDATE room_grades SET stock = 10 WHERE stock = 0;

-- Add a comment to document the column
COMMENT ON COLUMN room_grades.stock IS 'Number of studios available for this room grade'; 