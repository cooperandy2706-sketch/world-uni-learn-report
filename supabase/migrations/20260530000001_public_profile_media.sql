-- ============================================================
-- Public Profile: extended school columns + media table
-- ============================================================

-- 1. Extend schools table with public profile fields
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS description        text,
  ADD COLUMN IF NOT EXISTS tags               text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location_lat       numeric,
  ADD COLUMN IF NOT EXISTS location_lng       numeric,
  ADD COLUMN IF NOT EXISTS location_label     text,
  ADD COLUMN IF NOT EXISTS profile_views      bigint   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_likes      bigint   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_followers  bigint   DEFAULT 0;

-- 2. School profile media (photos + videos)
CREATE TABLE IF NOT EXISTS public.school_profile_media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  media_type  text NOT NULL CHECK (media_type IN ('photo', 'video')),
  url         text NOT NULL,          -- storage URL (photo) or embed URL (video)
  thumbnail   text,                   -- optional thumbnail for video
  caption     text,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_media_school ON public.school_profile_media(school_id);

-- 3. School followers table (so we can track unique follows)
CREATE TABLE IF NOT EXISTS public.school_follows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  follower_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(school_id, follower_id)
);

-- 4. School likes table
CREATE TABLE IF NOT EXISTS public.school_likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(school_id, user_id)
);

-- 5. RLS for media — school admins can manage their own
ALTER TABLE public.school_profile_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages own media"    ON public.school_profile_media;
DROP POLICY IF EXISTS "Public reads school media"  ON public.school_profile_media;

CREATE POLICY "Admin manages own media" ON public.school_profile_media
  FOR ALL USING (
    school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Public reads school media" ON public.school_profile_media
  FOR SELECT USING (true);

-- 6. RLS for follows
ALTER TABLE public.school_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own follows" ON public.school_follows;
CREATE POLICY "Users manage own follows" ON public.school_follows
  FOR ALL USING (follower_id = auth.uid());

CREATE POLICY "Public reads follows" ON public.school_follows
  FOR SELECT USING (true);

-- 7. RLS for likes
ALTER TABLE public.school_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own likes" ON public.school_likes;
CREATE POLICY "Users manage own likes" ON public.school_likes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public reads likes" ON public.school_likes
  FOR SELECT USING (true);

-- 8. Fix: Ensure all schools can be read publicly so they show up in the directory
DROP POLICY IF EXISTS "Public school profiles" ON public.schools;
CREATE POLICY "Public school profiles" ON public.schools
  FOR SELECT USING (true);
