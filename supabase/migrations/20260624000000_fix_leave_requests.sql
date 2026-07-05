-- ====================================================================
-- Migration: Fix leave_requests missing columns and type renaming
-- Fixes "Could not find a relationship" and "column does not exist" errors
-- ====================================================================

-- 1. Rename 'type' to 'leave_type' to match frontend models
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='leave_requests' and column_name='type') THEN
      ALTER TABLE public.leave_requests RENAME COLUMN type TO leave_type;
  END IF;
END $$;

-- 2. Add 'substitute_id' foreign key mapping to users table
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS substitute_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Add 'admin_notes'
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS admin_notes text;

-- 4. Reload PostgREST schema cache to immediately resolve the "Could not find a relationship" errors
NOTIFY pgrst, 'reload schema';
