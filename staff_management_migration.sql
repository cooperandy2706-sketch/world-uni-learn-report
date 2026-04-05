-- ═══════════════════════════════════════════════════════════════════
-- STAFF MANAGEMENT MIGRATION
-- Adds Support for Other Staff (Cooks, Cleaners, Drivers, etc.)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Update the 'users' table role constraint to include 'staff'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'teacher'::text, 'student'::text, 'bursar'::text, 'staff'::text]));

-- 2. Add 'designation' column to users for job titles (Cook, Cleaner, etc.)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='designation') THEN
    ALTER TABLE public.users ADD COLUMN designation text;
  END IF;
END $$;

-- 3. Ensure staff accounts are visible for their school (RLS already exists for school_id)
-- No new policies needed if school-wide access is already implemented.
