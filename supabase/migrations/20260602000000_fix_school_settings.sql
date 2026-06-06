-- Fix missing columns in school_settings for onboarding wizard
ALTER TABLE public.school_settings
  ADD COLUMN IF NOT EXISTS school_type text DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS has_evening_classes boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false;
