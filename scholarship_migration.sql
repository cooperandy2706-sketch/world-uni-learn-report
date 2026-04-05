-- ==============================================================================
-- SCHOLARSHIP FIELDS MIGRATION
-- Run this in your Supabase SQL Editor
-- Adds scholarship tracking columns to the students table
-- ==============================================================================

-- Add scholarship_type column to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS scholarship_type text NOT NULL DEFAULT 'none'
  CHECK (scholarship_type IN ('none', 'full', 'partial'));

-- Add scholarship_percentage column (0-100, e.g. 100 = full, 50 = half)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS scholarship_percentage numeric(5,2) NOT NULL DEFAULT 0;

-- Index for quick filtering
CREATE INDEX IF NOT EXISTS idx_students_scholarship
  ON public.students(school_id, scholarship_type)
  WHERE scholarship_type != 'none';

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================
