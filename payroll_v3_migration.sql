/* ====================================================================
PAYROLL V3 & V4 MIGRATION — Run in Supabase SQL Editor
Safely adds all required columns for the Advanced Payroll System
considering the current state of the database.
==================================================================== */

/* Extend payroll_adjustments with missing payment state and payment-method fields */
ALTER TABLE public.payroll_adjustments
  ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_date date,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash', 
  ADD COLUMN IF NOT EXISTS bank_reference text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS momo_number text,
  ADD COLUMN IF NOT EXISTS momo_network text, 
  ADD COLUMN IF NOT EXISTS week_number integer, 
  ADD COLUMN IF NOT EXISTS week_label text;     

/* Extend staff_payroll with missing total trackers and payment methods */
ALTER TABLE public.staff_payroll
  ADD COLUMN IF NOT EXISTS adjustments_paid_total numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS bank_reference text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS momo_number text,
  ADD COLUMN IF NOT EXISTS momo_network text;

/* Weekly allowance configuration per staff per month */
CREATE TABLE IF NOT EXISTS public.payroll_weekly_config (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES public.users(id) ON DELETE CASCADE,
  month         text NOT NULL,            
  weekly_amount numeric(12,2) DEFAULT 0,
  daily_amount  numeric(12,2) DEFAULT 0,  
  notes         text,
  created_at    timestamp with time zone DEFAULT now(),
  UNIQUE(school_id, user_id, month)
);

ALTER TABLE public.payroll_weekly_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_access_weekly_cfg" ON public.payroll_weekly_config
  USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

/* Indexes for performance across tabs */
CREATE INDEX IF NOT EXISTS idx_pay_adj_week   ON public.payroll_adjustments(user_id, month, week_number);
CREATE INDEX IF NOT EXISTS idx_pay_adj_type   ON public.payroll_adjustments(school_id, type, month);
CREATE INDEX IF NOT EXISTS idx_weekly_cfg     ON public.payroll_weekly_config(school_id, month);

/* Automated trigger to aggregate Adjustments -> Staff Payroll master record */
CREATE OR REPLACE FUNCTION public.fn_sync_payroll_adjustments()
RETURNS TRIGGER AS $$
DECLARE
  v_allowances numeric(12,2);
  v_deductions numeric(12,2);
  v_paid_total numeric(12,2);
BEGIN
  /* Ensure a record exists in staff_payroll for this user/month */
  INSERT INTO public.staff_payroll (school_id, user_id, month, basic_salary)
  VALUES (NEW.school_id, NEW.user_id, NEW.month, 0)
  ON CONFLICT (school_id, user_id, month) DO NOTHING;

  /* Calculate the updated totals from all adjustments */
  SELECT 
    COALESCE(SUM(amount) FILTER (WHERE type IN ('allowance', 'bonus', 'daily_pay', 'weekly_pay')), 0),
    COALESCE(SUM(amount) FILTER (WHERE type IN ('deduction', 'fine')), 0),
    COALESCE(SUM(amount) FILTER (WHERE is_paid = true AND type NOT IN ('deduction', 'fine')), 0)
  INTO v_allowances, v_deductions, v_paid_total
  FROM public.payroll_adjustments
  WHERE user_id = NEW.user_id AND month = NEW.month;

  /* Update the master record */
  UPDATE public.staff_payroll
  SET 
    allowances = v_allowances,
    deductions = v_deductions,
    adjustments_paid_total = v_paid_total,
    net_salary = (basic_salary + v_allowances) - v_deductions
  WHERE user_id = NEW.user_id AND month = NEW.month;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_pay_adj ON public.payroll_adjustments;

CREATE TRIGGER tr_sync_pay_adj
AFTER INSERT OR UPDATE OR DELETE ON public.payroll_adjustments
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_payroll_adjustments();

/* Done */
