-- Phase 1: Flexible Gradebook Migration
-- Run this in your Supabase SQL Editor

-- 1. Create Grading Scales
CREATE TABLE IF NOT EXISTS public.grading_scales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(department_id) -- Ensures 1-to-1 mapping for now to keep it simple per department
);

-- 2. Create Grading Scale Levels (e.g. A, B, C)
CREATE TABLE IF NOT EXISTS public.grading_scale_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scale_id uuid NOT NULL REFERENCES public.grading_scales(id) ON DELETE CASCADE,
  label text NOT NULL,
  min_score numeric NOT NULL,
  max_score numeric NOT NULL,
  gpa_value numeric,
  color_code text,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create Department Grading Categories (e.g. Classwork 30%, Exam 70%)
CREATE TABLE IF NOT EXISTS public.department_grading_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  weight_percentage numeric NOT NULL,
  max_score numeric NOT NULL DEFAULT 100,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Alter scores table to support JSONB category_scores
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS category_scores jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.scores ALTER COLUMN class_score DROP NOT NULL;
ALTER TABLE public.scores ALTER COLUMN exam_score DROP NOT NULL;
ALTER TABLE public.scores ALTER COLUMN total_score DROP EXPRESSION;

-- Security / RLS Configuration
ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_scale_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_grading_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view grading scales for their school"
ON public.grading_scales FOR SELECT
USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage grading scales"
ON public.grading_scales FOR ALL
USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Users can view grading scale levels for their school"
ON public.grading_scale_levels FOR SELECT
USING (scale_id IN (SELECT id FROM public.grading_scales WHERE school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid())));

CREATE POLICY "Admins can manage grading scale levels"
ON public.grading_scale_levels FOR ALL
USING (scale_id IN (SELECT id FROM public.grading_scales WHERE school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))));

CREATE POLICY "Users can view department grading categories for their school"
ON public.department_grading_categories FOR SELECT
USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage department grading categories"
ON public.department_grading_categories FOR ALL
USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
