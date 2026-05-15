-- =============================================================
-- Migration: 20260513_extend_audit_triggers.sql
-- Purpose: Extend the immutable audit log trigger to cover ALL
--          sensitive tables (previously only fee_payments + scores).
--          Required for full GDPR / POPIA compliance.
-- =============================================================

-- The log_audit_event() function and audit_logs table already
-- exist from 20260512_compliance_audit.sql — we only attach
-- triggers to additional tables here.

-- ──────────────────────────────────────────────────────────────
-- 1. STUDENTS  (enrolment, transfers, personal data changes)
-- ──────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS audit_students_changes ON public.students;
CREATE TRIGGER audit_students_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.audit_record_changes();

-- ──────────────────────────────────────────────────────────────
-- 2. USERS  (role changes, account creation / deletion)
-- ──────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS audit_users_changes ON public.users;
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.audit_record_changes();

-- ──────────────────────────────────────────────────────────────
-- 3. ATTENDANCE_RECORDS  (manual edits to attendance are high-risk)
-- ──────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS audit_attendance_changes ON public.attendance_records;
CREATE TRIGGER audit_attendance_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_record_changes();

-- ──────────────────────────────────────────────────────────────
-- 4. PASTORAL_LOGS  (sensitive safeguarding data)
-- ──────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS audit_pastoral_changes ON public.pastoral_logs;
CREATE TRIGGER audit_pastoral_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.pastoral_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_record_changes();

-- ──────────────────────────────────────────────────────────────
-- 5. EXEAT_REQUESTS  (student movement / safety records)
-- ──────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS audit_exeat_changes ON public.exeat_requests;
CREATE TRIGGER audit_exeat_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.exeat_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_record_changes();

-- ──────────────────────────────────────────────────────────────
-- 6. DORM_ASSIGNMENTS  (boarding welfare)
-- ──────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS audit_dorm_assignments ON public.dorm_assignments;
CREATE TRIGGER audit_dorm_assignments
  AFTER INSERT OR UPDATE OR DELETE ON public.dorm_assignments
  FOR EACH ROW EXECUTE FUNCTION public.audit_record_changes();

-- ──────────────────────────────────────────────────────────────
-- 7. PRIVACY_CONSENTS  (data subject consent changes)
-- ──────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS audit_privacy_consents ON public.privacy_consents;
CREATE TRIGGER audit_privacy_consents
  AFTER INSERT OR UPDATE OR DELETE ON public.privacy_consents
  FOR EACH ROW EXECUTE FUNCTION public.audit_record_changes();

-- ──────────────────────────────────────────────────────────────
-- 8. PAYROLL_RECORDS  (sensitive financial data)
-- ──────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS audit_payroll_changes ON public.staff_payroll;
CREATE TRIGGER audit_payroll_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.staff_payroll
  FOR EACH ROW EXECUTE FUNCTION public.audit_record_changes();

-- ──────────────────────────────────────────────────────────────
-- 9. GDPR DELETION WORKFLOW
--    Tracks when an admin processes a data subject deletion request.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gdpr_deletion_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  requester_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_type     TEXT NOT NULL CHECK (target_type IN ('student', 'parent', 'staff', 'user')),
  target_id       UUID NOT NULL,
  target_name     TEXT,            -- snapshot at time of request
  reason          TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'completed', 'rejected')),
  reviewed_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.gdpr_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Only admins of the same school can view/manage deletion requests
CREATE POLICY "school_admins_manage_gdpr_requests"
  ON public.gdpr_deletion_requests
  FOR ALL
  USING (
    school_id = (SELECT school_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Audit the deletion request table itself
DROP TRIGGER IF EXISTS audit_gdpr_requests ON public.gdpr_deletion_requests;
CREATE TRIGGER audit_gdpr_requests
  AFTER INSERT OR UPDATE OR DELETE ON public.gdpr_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_record_changes();

-- ──────────────────────────────────────────────────────────────
-- 10. ADMIN VIEW: audit_log_summary
--     Convenient view for the AdminAuditPage to query
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.audit_log_summary AS
SELECT
  al.id,
  al.table_name,
  al.action AS operation,
  al.old_data,
  al.new_data,
  al.user_id AS changed_by,
  al.created_at AS changed_at,
  u.full_name  AS changed_by_name,
  u.role       AS changed_by_role,
  al.school_id
FROM public.audit_logs al
LEFT JOIN public.users u ON u.id = al.user_id
ORDER BY al.created_at DESC;

-- Grant the view to authenticated users (RLS on underlying tables still applies)
GRANT SELECT ON public.audit_log_summary TO authenticated;

COMMENT ON TABLE public.gdpr_deletion_requests IS
  'Tracks GDPR/POPIA right-to-erasure requests and their processing status.';

COMMENT ON VIEW public.audit_log_summary IS
  'Denormalized view of audit_logs joined with user info for admin UI consumption.';
