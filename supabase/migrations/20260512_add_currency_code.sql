-- Add currency_code to fee_structures and fee_payments tables
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS currency_code varchar(3) DEFAULT 'GHS';
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS currency_code varchar(3) DEFAULT 'GHS';
