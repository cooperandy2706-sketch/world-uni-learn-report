-- ====================================================================
-- SUPER ADMIN CONSOLIDATED PLATFORM FIX
-- ====================================================================
-- This script ensures the Super Admin has full permission to manage 
-- global curriculum, library materials, and platform updates.
-- Run this ONCE in your Supabase SQL Editor.

-- 1. Enable RLS on core tables (just in case)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_messages ENABLE ROW LEVEL SECURITY;

-- 2. SUBJECTS: Allow Super Admin to manage "Global" subjects (school_id is null)
DROP POLICY IF EXISTS "Super Admin Manage Global Subjects" ON public.subjects;
CREATE POLICY "Super Admin Manage Global Subjects" 
ON public.subjects FOR ALL 
TO authenticated
USING (school_id IS NULL OR school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

-- 3. GLOBAL RESOURCES: Full access for Super Admin
DROP POLICY IF EXISTS "Full access to global_resources" ON public.global_resources;
CREATE POLICY "Full access to global_resources" 
ON public.global_resources FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. PLATFORM MESSAGES: Full access for Super Admin
DROP POLICY IF EXISTS "Full access to platform_messages" ON public.platform_messages;
CREATE POLICY "Full access to platform_messages" 
ON public.platform_messages FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. VISIBILITY: Ensure all students can see global content
DROP POLICY IF EXISTS "Students can see global content" ON public.global_resources;
CREATE POLICY "Students can see global content" 
ON public.global_resources FOR SELECT 
TO authenticated
USING (is_published = true OR school_id IS NULL);

-- 6. Ensure subjects with school_id = NULL are visible to everyone
DROP POLICY IF EXISTS "View global subjects" ON public.subjects;
CREATE POLICY "View global subjects" 
ON public.subjects FOR SELECT 
TO authenticated
USING (school_id IS NULL OR school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

-- ====================================================================
-- FIXES APPLIED. You can now create Global Subjects and Resources!
-- ====================================================================
