-- Add employment_type to teachers table
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS employment_type text DEFAULT 'full_time'::text;
