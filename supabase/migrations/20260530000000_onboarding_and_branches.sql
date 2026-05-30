-- Schools: slug, branch support
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS parent_school_id uuid REFERENCES public.schools(id),
  ADD COLUMN IF NOT EXISTS branch_name text,
  ADD COLUMN IF NOT EXISTS is_branch boolean DEFAULT false;

-- School settings: curriculum tracking, branch flag
ALTER TABLE public.school_settings
  ADD COLUMN IF NOT EXISTS curriculums text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shs_programmes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_branches boolean DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schools_slug ON public.schools(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schools_parent ON public.schools(parent_school_id) WHERE parent_school_id IS NOT NULL;

-- Public profile RLS: anyone can read schools
DROP POLICY IF EXISTS "Public school profiles" ON public.schools;
CREATE POLICY "Public school profiles" ON public.schools
  FOR SELECT USING (true);
