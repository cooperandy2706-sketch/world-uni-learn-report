-- 1. Update staff_payroll to include paid total
ALTER TABLE public.staff_payroll ADD COLUMN IF NOT EXISTS adjustments_paid_total numeric(12,2) DEFAULT 0;

-- 2. Payroll Adjustments — Granular logs for daily, weekly, or specific amounts
CREATE TABLE IF NOT EXISTS public.payroll_adjustments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE,
  month           text NOT NULL, -- format: "2025-01"
  type            text NOT NULL, -- 'allowance', 'deduction', 'daily_pay', 'weekly_pay', 'fine', 'bonus'
  amount          numeric(12,2) NOT NULL DEFAULT 0,
  description     text,
  is_paid         boolean DEFAULT false,
  paid_date       date,
  recorded_at     date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by     uuid REFERENCES public.users(id),
  created_at      timestamp with time zone DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pay_adj_user_month ON public.payroll_adjustments(user_id, month);

-- ── Row Level Security ───────────────────────────────────────────────
ALTER TABLE public.payroll_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_access_pay_adj" ON public.payroll_adjustments
  USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

-- ── Automated Monthly Aggregation (Trigger) ──────────────────────────
-- This trigger automatically ensures a record exists in staff_payroll 
-- and updates its totals based on the adjustments.

CREATE OR REPLACE FUNCTION public.fn_sync_payroll_adjustments()
RETURNS TRIGGER AS $$
DECLARE
  v_allowances numeric(12,2);
  v_deductions numeric(12,2);
  v_paid_total numeric(12,2);
BEGIN
  -- 1. Ensure a record exists in staff_payroll for this user/month
  INSERT INTO public.staff_payroll (school_id, user_id, month, basic_salary)
  VALUES (NEW.school_id, NEW.user_id, NEW.month, 0)
  ON CONFLICT (school_id, user_id, month) DO NOTHING;

  -- 2. Calculate the updated totals from all adjustments
  SELECT 
    COALESCE(SUM(amount) FILTER (WHERE type IN ('allowance', 'bonus', 'daily_pay', 'weekly_pay')), 0),
    COALESCE(SUM(amount) FILTER (WHERE type IN ('deduction', 'fine')), 0),
    COALESCE(SUM(amount) FILTER (WHERE is_paid = true AND type NOT IN ('deduction', 'fine')), 0)
  INTO v_allowances, v_deductions, v_paid_total
  FROM public.payroll_adjustments
  WHERE user_id = NEW.user_id AND month = NEW.month;

  -- 3. Update the master record
  UPDATE public.staff_payroll
  SET 
    allowances = v_allowances,
    deductions = v_deductions,
    adjustments_paid_total = v_paid_total
  WHERE user_id = NEW.user_id AND month = NEW.month;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sync_pay_adj
AFTER INSERT OR UPDATE OR DELETE ON public.payroll_adjustments
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_payroll_adjustments();
