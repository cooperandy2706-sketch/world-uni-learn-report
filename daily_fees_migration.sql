-- ==============================================================================
-- DAILY FEEDING & STUDIES FEES MIGRATION
-- Paste this into your Supabase SQL Editor and run it to set up the DB
-- ==============================================================================

-- 1. Configuration Table (Bursar sets the daily rates and elapsed days)
CREATE TABLE public.daily_fee_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  expected_feeding_fee numeric(10,2) DEFAULT 0.00,
  expected_studies_fee numeric(10,2) DEFAULT 0.00,
  days_elapsed integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(school_id, term_id)
);

-- 2. Authorized Collectors Table (Bursar assigns Teachers)
CREATE TABLE public.daily_fee_collectors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  collection_type text NOT NULL CHECK (collection_type IN ('feeding', 'studies', 'both')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(teacher_id)
);

-- 3. Daily Fees Collection Ledger (Transactions)
CREATE TABLE public.daily_fees_collected (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_type text NOT NULL CHECK (fee_type IN ('feeding', 'studies')),
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  date date NOT NULL DEFAULT current_date,
  collected_by uuid REFERENCES public.users(id) ON DELETE SET NULL, -- teacher user_id
  created_at timestamp with time zone DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.daily_fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_fee_collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_fees_collected ENABLE ROW LEVEL SECURITY;

-- Config Policies: Bursars and Admins can manage; Teachers can read
CREATE POLICY "Admins and Bursars can manage config" ON public.daily_fee_config
  FOR ALL USING (
    school_id = get_auth_school_id() AND get_auth_role() IN ('admin', 'super_admin', 'bursar')
  );

CREATE POLICY "Anyone in school can view config" ON public.daily_fee_config
  FOR SELECT USING (school_id = get_auth_school_id());

-- Collectors Policies: Bursars and Admins can manage; Teachers can read
CREATE POLICY "Admins and Bursars can manage collectors" ON public.daily_fee_collectors
  FOR ALL USING (
    school_id = get_auth_school_id() AND get_auth_role() IN ('admin', 'super_admin', 'bursar')
  );

CREATE POLICY "Anyone in school can view collectors" ON public.daily_fee_collectors
  FOR SELECT USING (school_id = get_auth_school_id());

-- Collections Ledger Policies: 
-- 1. Bursars/Admins can see and manage all.
-- 2. Assigned Teachers can view/insert for their school.
CREATE POLICY "Bursars and Admins can manage collections" ON public.daily_fees_collected
  FOR ALL USING (
    school_id = get_auth_school_id() AND get_auth_role() IN ('admin', 'super_admin', 'bursar')
  );

CREATE POLICY "Assigned Teachers can read collections" ON public.daily_fees_collected
  FOR SELECT USING (
    school_id = get_auth_school_id() 
    AND get_auth_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM daily_fee_collectors dfc 
      JOIN teachers t ON dfc.teacher_id = t.id 
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Assigned Teachers can insert collections" ON public.daily_fees_collected
  FOR INSERT WITH CHECK (
    school_id = get_auth_school_id() 
    AND get_auth_role() = 'teacher'
    AND collected_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM daily_fee_collectors dfc 
      JOIN teachers t ON dfc.teacher_id = t.id 
      WHERE t.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================
