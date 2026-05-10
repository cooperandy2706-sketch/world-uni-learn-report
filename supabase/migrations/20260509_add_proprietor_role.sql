-- Migration: Add proprietor role to user_role type if it exists
-- Created: 2026-05-09

DO $$ 
BEGIN
  -- Check if the enum type exists, and if so, add the 'proprietor' value
  -- This handles the case where user_role is defined as a custom ENUM
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    BEGIN
      ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'proprietor';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
  END IF;
  
  -- If there's a CHECK constraint on a text column instead, you would drop and recreate it:
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'teacher', 'student', 'bursar', 'driver', 'security', 'nurse', 'librarian', 'staff', 'parent', 'super_admin', 'proprietor'));
END $$;
