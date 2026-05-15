-- ──────────────────────────────────────────────────────────────
-- Add currency_code to schools table
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'GHS';

-- Force GHS on existing schools just in case
UPDATE public.schools SET currency_code = 'GHS' WHERE currency_code IS NULL;
