-- Fix missing columns in invoices table
-- This migration adds the missing description, invoice_number, and issued_date columns

-- Add missing columns to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS issued_date DATE DEFAULT CURRENT_DATE;

-- Make invoice_number unique if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_invoice_number_key'
  ) THEN
    ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);
  END IF;
END$$;

-- Update existing invoices to have proper invoice numbers if missing
UPDATE invoices 
SET invoice_number = 'INV-' || id || '-' || EXTRACT(EPOCH FROM created_at)::bigint
WHERE invoice_number IS NULL OR invoice_number = '';

-- Update existing invoices to have issued_date if missing
UPDATE invoices 
SET issued_date = CURRENT_DATE
WHERE issued_date IS NULL;

COMMENT ON COLUMN invoices.description IS 'Description of the invoice (accommodation fees, etc.)';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice number for tracking';
COMMENT ON COLUMN invoices.issued_date IS 'Date when the invoice was issued'; 