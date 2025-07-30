-- Add weekly_rate field to room_grades table
-- This will store default weekly rates for each room grade

ALTER TABLE room_grades 
ADD COLUMN IF NOT EXISTS weekly_rate DECIMAL(10,2) DEFAULT 320.00;

-- Update existing room grades with default weekly rates
UPDATE room_grades 
SET weekly_rate = CASE 
  WHEN name ILIKE '%platinum%' OR name ILIKE '%luxury%' OR name ILIKE '%deluxe%' THEN 450.00
  WHEN name ILIKE '%gold%' OR name ILIKE '%premium%' THEN 380.00
  WHEN name ILIKE '%silver%' OR name ILIKE '%standard%' THEN 320.00
  WHEN name ILIKE '%economy%' OR name ILIKE '%basic%' THEN 280.00
  ELSE 320.00
END
WHERE weekly_rate IS NULL OR weekly_rate = 0;

-- Add comment to document the field
COMMENT ON COLUMN room_grades.weekly_rate IS 'Default weekly rate for this room grade in GBP'; 