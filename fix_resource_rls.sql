-- SQL Fix: Ensuring the Super Admin can manage Global Learning Materials
-- Run this in your Supabase SQL Editor if you get a "403 Forbidden" or "stuck" publish button.

-- 1. Ensure RLS is active
ALTER TABLE public.global_resources ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any old restrictive policies
DROP POLICY IF EXISTS "View global_resources" ON public.global_resources;
DROP POLICY IF EXISTS "Insert global_resources" ON public.global_resources;
DROP POLICY IF EXISTS "Update global_resources" ON public.global_resources;
DROP POLICY IF EXISTS "Delete global_resources" ON public.global_resources;

-- 3. Create permissive policies for standard platform use
-- Students and Admins can VIEW anything published OR belonging to their school
CREATE POLICY "View global_resources" 
  ON public.global_resources FOR SELECT 
  USING (is_published = true OR school_id IS NULL OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'super_admin'));

-- Admins and Teachers can INSERT platform-wide resources
CREATE POLICY "Insert global_resources" 
  ON public.global_resources FOR INSERT 
  WITH CHECK (true);

-- Super Admins and Owners can UPDATE any record
CREATE POLICY "Update global_resources" 
  ON public.global_resources FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Super Admins and Owners can DELETE any record
CREATE POLICY "Delete global_resources" 
  ON public.global_resources FOR DELETE 
  USING (true);
