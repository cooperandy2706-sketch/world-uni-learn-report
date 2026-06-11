-- ====================================================================
-- Migration: Missing App Tables
-- Fixes "Server Meltdown" by creating 24 missing tables referenced by the application code
-- ====================================================================

-- 1. admin_tasks
CREATE TABLE IF NOT EXISTS public.admin_tasks (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    assignee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    status text DEFAULT 'pending',
    due_date timestamp with time zone,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. alumni
CREATE TABLE IF NOT EXISTS public.alumni (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    graduation_year integer,
    phone text,
    email text,
    current_occupation text,
    employer text,
    address text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. alumni_events
CREATE TABLE IF NOT EXISTS public.alumni_events (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    event_date timestamp with time zone,
    location text,
    organizer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. fundraising_campaigns
CREATE TABLE IF NOT EXISTS public.fundraising_campaigns (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    target_amount numeric DEFAULT 0,
    current_amount numeric DEFAULT 0,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. donations
CREATE TABLE IF NOT EXISTS public.donations (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    campaign_id uuid REFERENCES public.fundraising_campaigns(id) ON DELETE CASCADE,
    donor_name text,
    amount numeric NOT NULL,
    payment_method text,
    is_anonymous boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 6. department_grading_categories
CREATE TABLE IF NOT EXISTS public.department_grading_categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
    name text NOT NULL,
    weight_percentage numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 7. grading_scales
CREATE TABLE IF NOT EXISTS public.grading_scales (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    grade_label text NOT NULL,
    min_score numeric NOT NULL,
    max_score numeric NOT NULL,
    remark text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 8. dormitories
CREATE TABLE IF NOT EXISTS public.dormitories (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name text NOT NULL,
    capacity integer DEFAULT 0,
    gender text,
    supervisor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 9. dorm_rooms
CREATE TABLE IF NOT EXISTS public.dorm_rooms (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    dormitory_id uuid REFERENCES public.dormitories(id) ON DELETE CASCADE,
    name text NOT NULL,
    capacity integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 10. dorm_assignments
CREATE TABLE IF NOT EXISTS public.dorm_assignments (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    room_id uuid REFERENCES public.dorm_rooms(id) ON DELETE CASCADE,
    term_id uuid REFERENCES public.terms(id) ON DELETE CASCADE,
    assigned_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 11. exeat_requests
CREATE TABLE IF NOT EXISTS public.exeat_requests (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    reason text NOT NULL,
    destination text,
    departure_time timestamp with time zone,
    expected_return_time timestamp with time zone,
    actual_return_time timestamp with time zone,
    status text DEFAULT 'pending',
    approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 12. holidays
CREATE TABLE IF NOT EXISTS public.holidays (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title text NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 13. leave_requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    reason text,
    type text,
    status text DEFAULT 'pending',
    approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 14. pastoral_logs
CREATE TABLE IF NOT EXISTS public.pastoral_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    type text,
    logged_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 15. poster_templates
CREATE TABLE IF NOT EXISTS public.poster_templates (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    image_url text,
    category text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 16. school_assets
CREATE TABLE IF NOT EXISTS public.school_assets (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text,
    file_url text NOT NULL,
    file_size_bytes bigint DEFAULT 0,
    uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 17. school_invoices
CREATE TABLE IF NOT EXISTS public.school_invoices (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    invoice_number text,
    amount numeric NOT NULL,
    status text DEFAULT 'pending',
    due_date timestamp with time zone,
    paid_date timestamp with time zone,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 18. staff_documents
CREATE TABLE IF NOT EXISTS public.staff_documents (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    type text,
    file_url text NOT NULL,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 19. staff_payslips
CREATE TABLE IF NOT EXISTS public.staff_payslips (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    period_month text,
    period_year text,
    base_salary numeric DEFAULT 0,
    allowances numeric DEFAULT 0,
    deductions numeric DEFAULT 0,
    net_salary numeric DEFAULT 0,
    status text DEFAULT 'generated',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 20. student_documents
CREATE TABLE IF NOT EXISTS public.student_documents (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    title text NOT NULL,
    type text,
    file_url text NOT NULL,
    file_size_bytes bigint DEFAULT 0,
    uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 21. transport_vehicles
CREATE TABLE IF NOT EXISTS public.transport_vehicles (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    plate_number text NOT NULL,
    model text,
    capacity integer DEFAULT 0,
    status text DEFAULT 'active',
    driver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 22. transport_routes
CREATE TABLE IF NOT EXISTS public.transport_routes (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    fee_amount numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 23. transport_maintenance_logs
CREATE TABLE IF NOT EXISTS public.transport_maintenance_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    vehicle_id uuid REFERENCES public.transport_vehicles(id) ON DELETE CASCADE,
    date timestamp with time zone,
    description text,
    cost numeric DEFAULT 0,
    status text DEFAULT 'completed',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 24. transport_student_assignments
CREATE TABLE IF NOT EXISTS public.transport_student_assignments (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    route_id uuid REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    pickup_point text,
    dropoff_point text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 25. visitors
CREATE TABLE IF NOT EXISTS public.visitors (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    purpose text,
    whom_to_see text,
    phone text,
    time_in timestamp with time zone DEFAULT now(),
    time_out timestamp with time zone,
    badge_number text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ====================================================================
-- RLS (Tenant Isolation)
-- Ensure all newly created tables enforce school-level data isolation
-- ====================================================================

DO $$
DECLARE
    t_name text;
    tables text[] := ARRAY[
        'admin_tasks', 'alumni', 'alumni_events', 'fundraising_campaigns',
        'donations', 'department_grading_categories', 'grading_scales',
        'dormitories', 'dorm_assignments', 'exeat_requests',
        'holidays', 'leave_requests', 'pastoral_logs', 'school_assets',
        'school_invoices', 'staff_documents', 'staff_payslips',
        'student_documents', 'transport_vehicles', 'transport_routes',
        'transport_maintenance_logs', 'transport_student_assignments', 'visitors'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t_name);
        
        -- Try to create the policy. Catch if it already exists to avoid errors.
        BEGIN
            EXECUTE format('
                CREATE POLICY "Tenant Isolation Policy" ON public.%I
                FOR ALL TO authenticated
                USING (school_id = public.get_user_school_id() OR public.is_super_admin())
                WITH CHECK (school_id = public.get_user_school_id() OR public.is_super_admin());
            ', t_name);
        EXCEPTION WHEN duplicate_object THEN
            -- Policy already exists, skip
        END;
    END LOOP;
END $$;

-- Notice: poster_templates can have a null school_id for global templates
ALTER TABLE public.poster_templates ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    CREATE POLICY "Poster Templates Isolation" ON public.poster_templates
    FOR ALL TO authenticated
    USING (school_id IS NULL OR school_id = public.get_user_school_id() OR public.is_super_admin())
    WITH CHECK (school_id IS NULL OR school_id = public.get_user_school_id() OR public.is_super_admin());
EXCEPTION WHEN duplicate_object THEN
END $$;
