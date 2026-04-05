-- ═══════════════════════════════════════════════════════════════════
-- BURSAR MODULE MIGRATION
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Update the 'users' table role constraint to include 'bursar'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'teacher'::text, 'student'::text, 'bursar'::text]));

-- 2. Fee Structures — defines what fees are charged per class/term
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id          uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  term_id           uuid REFERENCES public.terms(id) ON DELETE CASCADE,
  academic_year_id  uuid REFERENCES public.academic_years(id),
  fee_name          text NOT NULL,
  amount            numeric(12,2) NOT NULL DEFAULT 0,
  description       text,
  created_at        timestamp with time zone DEFAULT now()
);

-- 3. Fee Payments — records each payment made by a student
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id        uuid REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id  uuid REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  term_id           uuid REFERENCES public.terms(id),
  academic_year_id  uuid REFERENCES public.academic_years(id),
  amount_paid       numeric(12,2) NOT NULL DEFAULT 0,
  payment_date      date NOT NULL DEFAULT CURRENT_DATE,
  payment_method    text DEFAULT 'cash'::text,  -- cash | momo | bank | cheque
  reference_number  text,
  notes             text,
  recorded_by       uuid REFERENCES public.users(id),
  created_at        timestamp with time zone DEFAULT now()
);

-- 4. Staff Payroll — monthly salary records per staff member
CREATE TABLE IF NOT EXISTS public.staff_payroll (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE,
  month           text NOT NULL,  -- format: "2025-01"
  basic_salary    numeric(12,2) DEFAULT 0,
  allowances      numeric(12,2) DEFAULT 0,
  deductions      numeric(12,2) DEFAULT 0,
  net_salary      numeric(12,2) GENERATED ALWAYS AS (basic_salary + allowances - deductions) STORED,
  is_paid         boolean DEFAULT false,
  paid_date       date,
  notes           text,
  created_at      timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_payroll_school_user_month_key UNIQUE(school_id, user_id, month)
);

-- 5. Income Records — non-fee income (grants, donations, rent, etc.)
CREATE TABLE IF NOT EXISTS public.income_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  category      text NOT NULL,  -- Fees, Donations, Grant, PTA, Rent, Other
  description   text,
  amount        numeric(12,2) NOT NULL DEFAULT 0,
  date          date NOT NULL DEFAULT CURRENT_DATE,
  reference     text,
  recorded_by   uuid REFERENCES public.users(id),
  created_at    timestamp with time zone DEFAULT now()
);

-- 6. Expense Records — school operational expenses
CREATE TABLE IF NOT EXISTS public.expense_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  category      text NOT NULL,  -- Utilities, Salaries, Supplies, Repairs, Events, Other
  description   text NOT NULL,
  amount        numeric(12,2) NOT NULL DEFAULT 0,
  date          date NOT NULL DEFAULT CURRENT_DATE,
  vendor        text,
  approved_by   uuid REFERENCES public.users(id),
  recorded_by   uuid REFERENCES public.users(id),
  created_at    timestamp with time zone DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fee_payments_school     ON public.fee_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student    ON public.fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_term       ON public.fee_payments(term_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_school   ON public.fee_structures(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_term     ON public.fee_structures(term_id);
CREATE INDEX IF NOT EXISTS idx_staff_payroll_school    ON public.staff_payroll(school_id);
CREATE INDEX IF NOT EXISTS idx_income_records_school   ON public.income_records(school_id);
CREATE INDEX IF NOT EXISTS idx_expense_records_school  ON public.expense_records(school_id);

-- ── Row Level Security ───────────────────────────────────────────────
ALTER TABLE public.fee_structures  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_payroll   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;

-- Policies: school-scoped access (admins + bursars for their school)
CREATE POLICY "school_access_fee_structures" ON public.fee_structures
  USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "school_access_fee_payments" ON public.fee_payments
  USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "school_access_staff_payroll" ON public.staff_payroll
  USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "school_access_income_records" ON public.income_records
  USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "school_access_expense_records" ON public.expense_records
  USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));
