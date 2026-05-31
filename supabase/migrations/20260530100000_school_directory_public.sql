-- Public school directory: ensure columns + safe read path for school type / branches

ALTER TABLE public.school_settings
  ADD COLUMN IF NOT EXISTS school_type text;

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS profile_views bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_likes bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_followers bigint DEFAULT 0;

-- Limited metadata for directory (no fees, news, or internal config)
CREATE OR REPLACE VIEW public.school_directory_meta
WITH (security_invoker = false) AS
  SELECT
    school_id,
    COALESCE(school_type, 'basic') AS school_type,
    COALESCE(has_branches, false) AS has_branches
  FROM public.school_settings;

GRANT SELECT ON public.school_directory_meta TO anon, authenticated;

-- Ensure public can read schools for directory (idempotent)
DROP POLICY IF EXISTS "Public school profiles" ON public.schools;
CREATE POLICY "Public school profiles" ON public.schools
  FOR SELECT
  USING (true);
