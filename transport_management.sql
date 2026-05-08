-- Transport Management Migration

-- 0. Update Users Role Check Constraint to include 'driver'
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'teacher', 'student', 'bursar', 'staff', 'parent', 'security', 'driver'));

-- 1. Transport Routes
CREATE TABLE IF NOT EXISTS public.transport_routes (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    fee_amount NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Transport Vehicles
CREATE TABLE IF NOT EXISTS public.transport_vehicles (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    plate_number TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 15,
    make_model TEXT,
    driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Transport Boarding Logs (Scan Events)
CREATE TABLE IF NOT EXISTS public.transport_boarding_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE CASCADE NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('pickup', 'dropoff')),
    location_name TEXT,
    time_scanned TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Transport Live Locations (Realtime Tracking)
CREATE TABLE IF NOT EXISTS public.transport_live_locations (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Realtime functionality to live locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.transport_live_locations;

-- RLS Policies
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_boarding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_live_locations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view routes and vehicles for their school
CREATE POLICY "Enable read for authenticated users on routes" ON public.transport_routes FOR SELECT TO authenticated USING (school_id = (SELECT school_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Enable read for authenticated users on vehicles" ON public.transport_vehicles FOR SELECT TO authenticated USING (school_id = (SELECT school_id FROM public.users WHERE id = auth.uid()));

-- Allow admins/bursars to manage routes and vehicles
CREATE POLICY "Enable ALL for admins on routes" ON public.transport_routes FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'bursar', 'super_admin')));
CREATE POLICY "Enable ALL for admins on vehicles" ON public.transport_vehicles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'bursar', 'super_admin')));

-- Allow drivers to read/insert boarding logs and live locations
CREATE POLICY "Enable ALL on boarding_logs" ON public.transport_boarding_logs FOR ALL TO authenticated USING (school_id = (SELECT school_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Enable ALL on live_locations" ON public.transport_live_locations FOR ALL TO authenticated USING (school_id = (SELECT school_id FROM public.users WHERE id = auth.uid()));

-- 5. Transport Student Assignments
CREATE TABLE IF NOT EXISTS public.transport_student_assignments (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    route_id UUID REFERENCES public.transport_routes(id) ON DELETE CASCADE NOT NULL,
    vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
    pickup_location TEXT,
    dropoff_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id)
);

ALTER TABLE public.transport_student_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users on assignments" ON public.transport_student_assignments FOR SELECT TO authenticated USING (school_id = (SELECT school_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "Enable ALL for admins on assignments" ON public.transport_student_assignments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'bursar', 'super_admin')));

-- 6. Transport Maintenance Logs
CREATE TABLE IF NOT EXISTS public.transport_maintenance_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.transport_maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL on maintenance_logs" ON public.transport_maintenance_logs FOR ALL TO authenticated USING (school_id = (SELECT school_id FROM public.users WHERE id = auth.uid()));
