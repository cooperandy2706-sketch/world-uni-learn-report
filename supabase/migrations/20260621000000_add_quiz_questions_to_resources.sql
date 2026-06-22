-- Add quiz_questions column to global_resources table
ALTER TABLE public.global_resources 
ADD COLUMN IF NOT EXISTS quiz_questions JSONB;
