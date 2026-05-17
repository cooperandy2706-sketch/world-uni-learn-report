-- Migration: Fix SECURITY DEFINER on audit_log_summary view
-- Purpose: Recreate the view using SECURITY INVOKER (the default) so that
--          Postgres enforces the querying user's own permissions and RLS policies,
--          rather than those of the view owner.
--
-- Supabase Security Advisory: "View public.audit_log_summary is defined with
-- the SECURITY DEFINER property"
-- Reference: https://supabase.com/docs/guides/database/database-advisors

-- Step 1: Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS public.audit_log_summary;

-- Step 2: Recreate it as a SECURITY INVOKER view (the safe default).
--         This ensures each caller's RLS policies on public.audit_logs are respected.
CREATE OR REPLACE VIEW public.audit_log_summary
WITH (security_invoker = true)
AS
SELECT
  al.id,
  al.school_id,
  al.user_id,
  u.full_name   AS user_name,
  u.role        AS user_role,
  al.table_name,
  al.action,
  al.record_id,
  al.old_data,
  al.new_data,
  al.created_at
FROM public.audit_logs al
LEFT JOIN public.users u ON u.id = al.user_id;

-- Step 3: Grant SELECT to authenticated users (RLS on audit_logs handles row filtering)
GRANT SELECT ON public.audit_log_summary TO authenticated;

-- Step 4: Revoke from anon to be safe
REVOKE ALL ON public.audit_log_summary FROM anon;
