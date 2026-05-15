-- =========================================================================
-- MIGRATION: 20260512_compliance_audit.sql
-- PURPOSE: Implement GDPR/POPIA compliance schemas and strict audit logging.
-- =========================================================================

-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  user_id uuid, -- Who made the change (if available in context)
  table_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id text NOT NULL, -- Cast to text to support diverse primary keys
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE,
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins and super admins can view audit logs for their school
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.school_id = audit_logs.school_id
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- 2. Create Audit Trigger Function
-- This function captures the old and new states of a record.
CREATE OR REPLACE FUNCTION public.audit_record_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_school_id uuid;
  v_user_id uuid;
  v_record_id text;
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  -- Try to get the user ID from the session (this relies on Supabase Auth context)
  v_user_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    v_record_id := NEW.id::text;
    v_school_id := NEW.school_id;
    v_new_data := to_jsonb(NEW);
    v_old_data := null;
  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := NEW.id::text;
    v_school_id := NEW.school_id;
    v_new_data := to_jsonb(NEW);
    v_old_data := to_jsonb(OLD);
  ELSIF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id::text;
    v_school_id := OLD.school_id;
    v_new_data := null;
    v_old_data := to_jsonb(OLD);
  END IF;

  -- Insert the audit log entry
  INSERT INTO public.audit_logs (school_id, user_id, table_name, action, record_id, old_data, new_data)
  VALUES (v_school_id, v_user_id, TG_TABLE_NAME, TG_OP, v_record_id, v_old_data, v_new_data);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Triggers to Sensitive Tables
-- Audit fee_payments
DROP TRIGGER IF EXISTS audit_fee_payments_trigger ON public.fee_payments;
CREATE TRIGGER audit_fee_payments_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.fee_payments
FOR EACH ROW EXECUTE FUNCTION public.audit_record_changes();

-- Audit scores
DROP TRIGGER IF EXISTS audit_scores_trigger ON public.scores;
CREATE TRIGGER audit_scores_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.scores
FOR EACH ROW EXECUTE FUNCTION public.audit_record_changes();


-- 4. Create Privacy Consents Table (GDPR/POPIA)
CREATE TABLE IF NOT EXISTS public.privacy_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  user_id uuid NOT NULL, -- User giving/revoking consent
  data_processing_consent boolean DEFAULT false, -- Core requirement for POPIA/GDPR
  marketing_consent boolean DEFAULT false, -- E.g. newsletters
  photo_media_consent boolean DEFAULT false, -- Use of photos in school portals/marketing
  deletion_requested boolean DEFAULT false, -- "Right to be Forgotten" flag
  deletion_requested_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT privacy_consents_pkey PRIMARY KEY (id),
  CONSTRAINT privacy_consents_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE,
  CONSTRAINT privacy_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT privacy_consents_user_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consents
CREATE POLICY "Users can view own consents"
  ON public.privacy_consents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own consents
CREATE POLICY "Users can insert own consents"
  ON public.privacy_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own consents
CREATE POLICY "Users can update own consents"
  ON public.privacy_consents FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all consents for their school
CREATE POLICY "Admins can view consents"
  ON public.privacy_consents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.school_id = privacy_consents.school_id
        AND users.role IN ('admin', 'super_admin')
    )
  );
