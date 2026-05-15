-- Boarding & Pastoral Care Migration
-- Creates tables for Dormitories, Rooms, Assignments, Logs, Exeats, and Pastoral Care.

-- 1. Dormitories
CREATE TABLE public.dormitories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  name text NOT NULL,
  capacity integer DEFAULT 0,
  gender_restriction text CHECK (gender_restriction IN ('male', 'female', 'mixed')),
  house_parent_id uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dormitories_pkey PRIMARY KEY (id)
);

-- 2. Dorm Rooms
CREATE TABLE public.dorm_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dormitory_id uuid NOT NULL REFERENCES public.dormitories(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  capacity integer DEFAULT 2,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dorm_rooms_pkey PRIMARY KEY (id)
);

-- 3. Dorm Assignments
CREATE TABLE public.dorm_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  room_id uuid NOT NULL REFERENCES public.dorm_rooms(id),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dorm_assignments_pkey PRIMARY KEY (id)
);

-- 4. Dorm Logs (Incidents/Activity by House Parents)
CREATE TABLE public.dorm_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dormitory_id uuid NOT NULL REFERENCES public.dormitories(id),
  recorded_by uuid NOT NULL REFERENCES public.users(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  incident_type text NOT NULL CHECK (incident_type IN ('routine', 'behavioral', 'maintenance', 'medical', 'other')),
  notes text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dorm_logs_pkey PRIMARY KEY (id)
);

-- 5. Exeat Requests
CREATE TABLE public.exeat_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  requested_by uuid REFERENCES public.users(id), -- User who requested it (student or parent)
  reason text NOT NULL,
  destination text NOT NULL,
  departure_time timestamp with time zone NOT NULL,
  expected_return_time timestamp with time zone NOT NULL,
  actual_return_time timestamp with time zone,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'departed', 'returned')),
  approved_by uuid REFERENCES public.users(id),
  parent_notified boolean DEFAULT false,
  security_notified boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exeat_requests_pkey PRIMARY KEY (id)
);

-- 6. Pastoral Logs (SEL)
CREATE TABLE public.pastoral_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  counselor_id uuid NOT NULL REFERENCES public.users(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL CHECK (category IN ('academic', 'behavioral', 'emotional', 'family', 'peer', 'other')),
  notes text NOT NULL,
  follow_up_date date,
  is_private boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pastoral_logs_pkey PRIMARY KEY (id)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS for all tables
ALTER TABLE public.dormitories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dorm_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dorm_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dorm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exeat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastoral_logs ENABLE ROW LEVEL SECURITY;

-- 1. General School-Based Access (Multi-tenancy)
-- Only users in the same school can view/manage their school's data

CREATE POLICY "Users can view their school's dorms" ON public.dormitories
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND school_id = dormitories.school_id));

CREATE POLICY "Admins can manage dorms" ON public.dormitories
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND school_id = dormitories.school_id AND role IN ('admin', 'super_admin')));

CREATE POLICY "Users can view dorm rooms" ON public.dorm_rooms
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.dormitories d JOIN public.users u ON u.school_id = d.school_id WHERE d.id = dormitory_id AND u.id = auth.uid()));

CREATE POLICY "Users can view assignments" ON public.dorm_assignments
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND school_id = dorm_assignments.school_id));

CREATE POLICY "House Parents can record logs" ON public.dorm_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role IN ('admin', 'staff', 'teacher') OR id = recorded_by)));

-- 2. Exeat Request Policies
CREATE POLICY "Students and parents can view/request exeats" ON public.exeat_requests
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND school_id = exeat_requests.school_id));

CREATE POLICY "Students/Parents can insert exeats" ON public.exeat_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Admins/Staff can manage exeats" ON public.exeat_requests
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'staff', 'security')));

-- 3. Pastoral Care Security (Highly Sensitive)
-- Only the counselor who wrote it, the student themselves (if not private), and admins can view.
CREATE POLICY "Private Pastoral Logs Security" ON public.pastoral_logs
  FOR ALL USING (
    auth.uid() = counselor_id OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Students can view non-private pastoral notes" ON public.pastoral_logs
  FOR SELECT USING (student_id = (SELECT id FROM public.students WHERE user_id = auth.uid()) AND is_private = false);

