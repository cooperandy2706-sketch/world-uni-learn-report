-- Migration: Comprehensive Multi-Tenant RLS Implementation
-- Purpose: Secures all tables with unhackable Row Level Security policies

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- 2. Standard Table Isolation (Direct school_id)

ALTER TABLE public.academic_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.academic_challenges;
CREATE POLICY "Tenant Isolation Policy" ON public.academic_challenges
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.academic_years;
CREATE POLICY "Tenant Isolation Policy" ON public.academic_years
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.admin_tasks;
CREATE POLICY "Tenant Isolation Policy" ON public.admin_tasks
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.admission_applications;
CREATE POLICY "Tenant Isolation Policy" ON public.admission_applications
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.admission_bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.admission_bills;
CREATE POLICY "Tenant Isolation Policy" ON public.admission_bills
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.admission_enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.admission_enquiries;
CREATE POLICY "Tenant Isolation Policy" ON public.admission_enquiries
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.admission_scholarships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.admission_scholarships;
CREATE POLICY "Tenant Isolation Policy" ON public.admission_scholarships
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.ai_usage_logs;
CREATE POLICY "Tenant Isolation Policy" ON public.ai_usage_logs
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.alumni;
CREATE POLICY "Tenant Isolation Policy" ON public.alumni
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.alumni_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.alumni_events;
CREATE POLICY "Tenant Isolation Policy" ON public.alumni_events
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.announcements;
CREATE POLICY "Tenant Isolation Policy" ON public.announcements
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.assignments;
CREATE POLICY "Tenant Isolation Policy" ON public.assignments
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.attendance;
CREATE POLICY "Tenant Isolation Policy" ON public.attendance
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.attendance_records;
CREATE POLICY "Tenant Isolation Policy" ON public.attendance_records
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.audit_logs;
CREATE POLICY "Tenant Isolation Policy" ON public.audit_logs
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.behavior_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.behavior_logs;
CREATE POLICY "Tenant Isolation Policy" ON public.behavior_logs
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.chat_conversations;
CREATE POLICY "Tenant Isolation Policy" ON public.chat_conversations
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.class_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.class_tests;
CREATE POLICY "Tenant Isolation Policy" ON public.class_tests
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.classes;
CREATE POLICY "Tenant Isolation Policy" ON public.classes
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.clinic_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.clinic_visits;
CREATE POLICY "Tenant Isolation Policy" ON public.clinic_visits
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.daily_fee_class_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.daily_fee_class_rates;
CREATE POLICY "Tenant Isolation Policy" ON public.daily_fee_class_rates
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.daily_fee_collectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.daily_fee_collectors;
CREATE POLICY "Tenant Isolation Policy" ON public.daily_fee_collectors
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.daily_fee_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.daily_fee_config;
CREATE POLICY "Tenant Isolation Policy" ON public.daily_fee_config
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.daily_fees_collected ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.daily_fees_collected;
CREATE POLICY "Tenant Isolation Policy" ON public.daily_fees_collected
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.department_grading_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.department_grading_categories;
CREATE POLICY "Tenant Isolation Policy" ON public.department_grading_categories
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.departments;
CREATE POLICY "Tenant Isolation Policy" ON public.departments
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.donations;
CREATE POLICY "Tenant Isolation Policy" ON public.donations
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.dorm_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.dorm_assignments;
CREATE POLICY "Tenant Isolation Policy" ON public.dorm_assignments
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.dormitories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.dormitories;
CREATE POLICY "Tenant Isolation Policy" ON public.dormitories
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.election_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.election_candidates;
CREATE POLICY "Tenant Isolation Policy" ON public.election_candidates
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.election_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.election_positions;
CREATE POLICY "Tenant Isolation Policy" ON public.election_positions
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.election_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.election_votes;
CREATE POLICY "Tenant Isolation Policy" ON public.election_votes
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.elections;
CREATE POLICY "Tenant Isolation Policy" ON public.elections
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.exeat_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.exeat_requests;
CREATE POLICY "Tenant Isolation Policy" ON public.exeat_requests
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.expense_records;
CREATE POLICY "Tenant Isolation Policy" ON public.expense_records
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.fee_payments;
CREATE POLICY "Tenant Isolation Policy" ON public.fee_payments
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.fee_structures;
CREATE POLICY "Tenant Isolation Policy" ON public.fee_structures
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.fundraising_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.fundraising_campaigns;
CREATE POLICY "Tenant Isolation Policy" ON public.fundraising_campaigns
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.gate_scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.gate_scans;
CREATE POLICY "Tenant Isolation Policy" ON public.gate_scans
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.gdpr_deletion_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.gdpr_deletion_requests;
CREATE POLICY "Tenant Isolation Policy" ON public.gdpr_deletion_requests
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.grading_scales;
CREATE POLICY "Tenant Isolation Policy" ON public.grading_scales
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.holidays;
CREATE POLICY "Tenant Isolation Policy" ON public.holidays
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.income_records;
CREATE POLICY "Tenant Isolation Policy" ON public.income_records
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.inventory_items;
CREATE POLICY "Tenant Isolation Policy" ON public.inventory_items
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.inventory_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.inventory_sales;
CREATE POLICY "Tenant Isolation Policy" ON public.inventory_sales
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.inventory_stock_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.inventory_stock_logs;
CREATE POLICY "Tenant Isolation Policy" ON public.inventory_stock_logs
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.leave_requests;
CREATE POLICY "Tenant Isolation Policy" ON public.leave_requests
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.lesson_plans;
CREATE POLICY "Tenant Isolation Policy" ON public.lesson_plans
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.library_books;
CREATE POLICY "Tenant Isolation Policy" ON public.library_books
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.library_checkouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.library_checkouts;
CREATE POLICY "Tenant Isolation Policy" ON public.library_checkouts
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.medical_records;
CREATE POLICY "Tenant Isolation Policy" ON public.medical_records
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.medication_schedules;
CREATE POLICY "Tenant Isolation Policy" ON public.medication_schedules
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.messages;
CREATE POLICY "Tenant Isolation Policy" ON public.messages
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.notifications;
CREATE POLICY "Tenant Isolation Policy" ON public.notifications
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.parent_wards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.parent_wards;
CREATE POLICY "Tenant Isolation Policy" ON public.parent_wards
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.pastoral_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.pastoral_logs;
CREATE POLICY "Tenant Isolation Policy" ON public.pastoral_logs
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.payroll_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.payroll_adjustments;
CREATE POLICY "Tenant Isolation Policy" ON public.payroll_adjustments
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.payroll_weekly_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.payroll_weekly_config;
CREATE POLICY "Tenant Isolation Policy" ON public.payroll_weekly_config
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.poster_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.poster_templates;
CREATE POLICY "Tenant Isolation Policy" ON public.poster_templates
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.privacy_consents;
CREATE POLICY "Tenant Isolation Policy" ON public.privacy_consents
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.remarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.remarks;
CREATE POLICY "Tenant Isolation Policy" ON public.remarks
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.report_cards;
CREATE POLICY "Tenant Isolation Policy" ON public.report_cards
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.requisitions;
CREATE POLICY "Tenant Isolation Policy" ON public.requisitions
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.scheduled_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.scheduled_events;
CREATE POLICY "Tenant Isolation Policy" ON public.scheduled_events
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.school_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.school_assets;
CREATE POLICY "Tenant Isolation Policy" ON public.school_assets
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.school_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.school_invoices;
CREATE POLICY "Tenant Isolation Policy" ON public.school_invoices
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.school_settings;
CREATE POLICY "Tenant Isolation Policy" ON public.school_settings
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.school_supplies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.school_supplies;
CREATE POLICY "Tenant Isolation Policy" ON public.school_supplies
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.scores;
CREATE POLICY "Tenant Isolation Policy" ON public.scores
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.sms_logs;
CREATE POLICY "Tenant Isolation Policy" ON public.sms_logs
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.staff_documents;
CREATE POLICY "Tenant Isolation Policy" ON public.staff_documents
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.staff_payroll ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.staff_payroll;
CREATE POLICY "Tenant Isolation Policy" ON public.staff_payroll
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.student_documents;
CREATE POLICY "Tenant Isolation Policy" ON public.student_documents
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.students;
CREATE POLICY "Tenant Isolation Policy" ON public.students
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.subjects;
CREATE POLICY "Tenant Isolation Policy" ON public.subjects
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.syllabus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.syllabus;
CREATE POLICY "Tenant Isolation Policy" ON public.syllabus
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.teacher_assignments;
CREATE POLICY "Tenant Isolation Policy" ON public.teacher_assignments
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.teachers;
CREATE POLICY "Tenant Isolation Policy" ON public.teachers
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.term_agenda_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.term_agenda_responses;
CREATE POLICY "Tenant Isolation Policy" ON public.term_agenda_responses
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.term_agendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.term_agendas;
CREATE POLICY "Tenant Isolation Policy" ON public.term_agendas
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.terms;
CREATE POLICY "Tenant Isolation Policy" ON public.terms
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.timetable_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.timetable_periods;
CREATE POLICY "Tenant Isolation Policy" ON public.timetable_periods
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.timetable_slots;
CREATE POLICY "Tenant Isolation Policy" ON public.timetable_slots
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.transport_boarding_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.transport_boarding_logs;
CREATE POLICY "Tenant Isolation Policy" ON public.transport_boarding_logs
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.transport_live_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.transport_live_locations;
CREATE POLICY "Tenant Isolation Policy" ON public.transport_live_locations
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.transport_maintenance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.transport_maintenance_logs;
CREATE POLICY "Tenant Isolation Policy" ON public.transport_maintenance_logs
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.transport_routes;
CREATE POLICY "Tenant Isolation Policy" ON public.transport_routes
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.transport_student_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.transport_student_assignments;
CREATE POLICY "Tenant Isolation Policy" ON public.transport_student_assignments
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.transport_vehicles;
CREATE POLICY "Tenant Isolation Policy" ON public.transport_vehicles
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.vendors;
CREATE POLICY "Tenant Isolation Policy" ON public.vendors
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.video_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.video_assignments;
CREATE POLICY "Tenant Isolation Policy" ON public.video_assignments
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.visitors;
CREATE POLICY "Tenant Isolation Policy" ON public.visitors
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.weekly_goals;
CREATE POLICY "Tenant Isolation Policy" ON public.weekly_goals
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());

-- 3. Special Core Tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Schools" ON public.schools;
CREATE POLICY "Public Read Schools" ON public.schools
  FOR SELECT TO public
  USING (true);
DROP POLICY IF EXISTS "Tenant Update Schools" ON public.schools;
CREATE POLICY "Tenant Update Schools" ON public.schools
  FOR UPDATE TO authenticated
  USING (id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Users" ON public.users;
CREATE POLICY "Tenant Isolation Users" ON public.users
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id() OR public.is_super_admin());
DROP POLICY IF EXISTS "Self Update Users" ON public.users;
CREATE POLICY "Self Update Users" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (id = auth.uid() OR public.is_super_admin());

ALTER TABLE public.global_quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global Resource Quizzes" ON public.global_quizzes;
CREATE POLICY "Global Resource Quizzes" ON public.global_quizzes
  FOR ALL TO authenticated
  USING (school_id IS NULL OR school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id IS NULL OR school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.global_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global Resource Library" ON public.global_resources;
CREATE POLICY "Global Resource Library" ON public.global_resources
  FOR ALL TO authenticated
  USING (school_id IS NULL OR school_id = public.get_user_school_id() OR public.is_super_admin())
  WITH CHECK (school_id IS NULL OR school_id = public.get_user_school_id() OR public.is_super_admin());

ALTER TABLE public.platform_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global Read Platform Messages" ON public.platform_messages;
CREATE POLICY "Global Read Platform Messages" ON public.platform_messages
  FOR SELECT TO authenticated
  USING (true);

-- 4. Cascading Tables (No direct school_id)

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cascading Isolation announcement_reads" ON public.announcement_reads;
CREATE POLICY "Cascading Isolation announcement_reads" ON public.announcement_reads
  FOR ALL TO authenticated
  USING (
    announcement_id IN (SELECT id FROM public.announcements WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  )
  WITH CHECK (
    announcement_id IN (SELECT id FROM public.announcements WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  );

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cascading Isolation assignment_submissions" ON public.assignment_submissions;
CREATE POLICY "Cascading Isolation assignment_submissions" ON public.assignment_submissions
  FOR ALL TO authenticated
  USING (
    assignment_id IN (SELECT id FROM public.assignments WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  )
  WITH CHECK (
    assignment_id IN (SELECT id FROM public.assignments WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  );

ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cascading Isolation chat_members" ON public.chat_members;
CREATE POLICY "Cascading Isolation chat_members" ON public.chat_members
  FOR ALL TO authenticated
  USING (
    conversation_id IN (SELECT id FROM public.chat_conversations WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  )
  WITH CHECK (
    conversation_id IN (SELECT id FROM public.chat_conversations WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  );

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cascading Isolation chat_messages" ON public.chat_messages;
CREATE POLICY "Cascading Isolation chat_messages" ON public.chat_messages
  FOR ALL TO authenticated
  USING (
    conversation_id IN (SELECT id FROM public.chat_conversations WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  )
  WITH CHECK (
    conversation_id IN (SELECT id FROM public.chat_conversations WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  );

ALTER TABLE public.class_test_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cascading Isolation class_test_scores" ON public.class_test_scores;
CREATE POLICY "Cascading Isolation class_test_scores" ON public.class_test_scores
  FOR ALL TO authenticated
  USING (
    test_id IN (SELECT id FROM public.class_tests WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  )
  WITH CHECK (
    test_id IN (SELECT id FROM public.class_tests WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  );

ALTER TABLE public.dorm_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cascading Isolation dorm_logs" ON public.dorm_logs;
CREATE POLICY "Cascading Isolation dorm_logs" ON public.dorm_logs
  FOR ALL TO authenticated
  USING (
    dormitory_id IN (SELECT id FROM public.dormitories WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  )
  WITH CHECK (
    dormitory_id IN (SELECT id FROM public.dormitories WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  );

ALTER TABLE public.dorm_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cascading Isolation dorm_rooms" ON public.dorm_rooms;
CREATE POLICY "Cascading Isolation dorm_rooms" ON public.dorm_rooms
  FOR ALL TO authenticated
  USING (
    dormitory_id IN (SELECT id FROM public.dormitories WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  )
  WITH CHECK (
    dormitory_id IN (SELECT id FROM public.dormitories WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  );

ALTER TABLE public.global_quiz_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cascading Isolation global_quiz_submissions" ON public.global_quiz_submissions;
CREATE POLICY "Cascading Isolation global_quiz_submissions" ON public.global_quiz_submissions
  FOR ALL TO authenticated
  USING (
    quiz_id IN (SELECT id FROM public.global_quizzes WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  )
  WITH CHECK (
    quiz_id IN (SELECT id FROM public.global_quizzes WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  );

ALTER TABLE public.grading_scale_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cascading Isolation grading_scale_levels" ON public.grading_scale_levels;
CREATE POLICY "Cascading Isolation grading_scale_levels" ON public.grading_scale_levels
  FOR ALL TO authenticated
  USING (
    scale_id IN (SELECT id FROM public.grading_scales WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  )
  WITH CHECK (
    scale_id IN (SELECT id FROM public.grading_scales WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  );

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cascading Isolation push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Cascading Isolation push_subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (
    user_id IN (SELECT id FROM public.users WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  )
  WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  );

ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cascading Isolation video_progress" ON public.video_progress;
CREATE POLICY "Cascading Isolation video_progress" ON public.video_progress
  FOR ALL TO authenticated
  USING (
    assignment_id IN (SELECT id FROM public.video_assignments WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  )
  WITH CHECK (
    assignment_id IN (SELECT id FROM public.video_assignments WHERE school_id = public.get_user_school_id() OR public.is_super_admin())
  );
