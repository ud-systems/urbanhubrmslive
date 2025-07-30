-- Simplify Payment Plan Names
-- Remove duration suffixes and ensure only cycle-based plans exist
-- Run via: npx supabase db push --linked

-- 1. Update existing payment plan names to be simpler
UPDATE payment_plans 
SET 
  name = CASE 
    WHEN payment_cycles = 3 THEN '3 Cycle Plan'
    WHEN payment_cycles = 4 THEN '4 Cycle Plan' 
    WHEN payment_cycles = 10 THEN '10 Cycle Plan'
    ELSE name
  END,
  description = CASE
    WHEN payment_cycles = 3 THEN 'Pay accommodation fees in 3 installments'
    WHEN payment_cycles = 4 THEN 'Pay accommodation fees in 4 installments'
    WHEN payment_cycles = 10 THEN 'Pay accommodation fees in 10 installments'
    ELSE description
  END
WHERE payment_cycles IN (3, 4, 10);

-- 2. Deactivate any unwanted plan types (annual, monthly, quarterly, semester)
UPDATE payment_plans 
SET is_active = false
WHERE LOWER(name) LIKE '%annual%' 
   OR LOWER(name) LIKE '%monthly%' 
   OR LOWER(name) LIKE '%quarterly%' 
   OR LOWER(name) LIKE '%semester%'
   OR LOWER(description) LIKE '%annual%'
   OR LOWER(description) LIKE '%monthly%'
   OR LOWER(description) LIKE '%quarterly%'
   OR LOWER(description) LIKE '%semester%';

-- 3. Ensure we have clean cycle-based plans only
-- Update any plans that might have been created with old naming
UPDATE payment_plans 
SET 
  name = REGEXP_REPLACE(name, '\s*\(\d+\s*weeks?\)', '', 'i'),
  description = REGEXP_REPLACE(description, '\s*over\s+\d+\s*weeks?\s*accommodation', '', 'i')
WHERE is_active = true;