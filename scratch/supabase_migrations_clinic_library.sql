-- Run this script in the Supabase SQL Editor

-- 1. Medical Records Table
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    blood_type TEXT,
    allergies TEXT,
    chronic_conditions TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Clinic Visits Table
CREATE TABLE IF NOT EXISTS public.clinic_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    nurse_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    symptoms TEXT NOT NULL,
    treatment TEXT,
    medication_given TEXT,
    time_in TIME NOT NULL,
    time_out TIME,
    parent_notified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Library Books Table
CREATE TABLE IF NOT EXISTS public.library_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT,
    isbn TEXT,
    barcode TEXT UNIQUE NOT NULL,
    dewey_decimal TEXT,
    category TEXT,
    copies_total INT NOT NULL DEFAULT 1,
    copies_available INT NOT NULL DEFAULT 1,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Library Checkouts Table
CREATE TABLE IF NOT EXISTS public.library_checkouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    checkout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    fine_paid BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active', -- active, returned, lost
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies

-- Enable RLS
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_checkouts ENABLE ROW LEVEL SECURITY;

-- Medical Records: Nurses & Admins can manage, Parents can view their wards
CREATE POLICY "Nurses and Admins can manage medical records"
ON public.medical_records
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.school_id = medical_records.school_id 
    AND users.role IN ('nurse', 'admin', 'super_admin')
  )
);

-- Clinic Visits: Nurses & Admins can manage
CREATE POLICY "Nurses and Admins can manage clinic visits"
ON public.clinic_visits
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.school_id = clinic_visits.school_id 
    AND users.role IN ('nurse', 'admin', 'super_admin')
  )
);

-- Library Books: Librarians & Admins can manage, Everyone can view
CREATE POLICY "Librarians and Admins can manage books"
ON public.library_books
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.school_id = library_books.school_id 
    AND users.role IN ('librarian', 'admin', 'super_admin')
  )
);

CREATE POLICY "Everyone can view books"
ON public.library_books
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.school_id = library_books.school_id
  )
);

-- Library Checkouts: Librarians & Admins can manage, Students/Teachers view their own
CREATE POLICY "Librarians and Admins can manage checkouts"
ON public.library_checkouts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.school_id = library_checkouts.school_id 
    AND users.role IN ('librarian', 'admin', 'super_admin')
  )
);

CREATE POLICY "Users can view their own checkouts"
ON public.library_checkouts
FOR SELECT
USING (
  (student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )) OR (teacher_id = auth.uid())
);

-- ============================================================
-- FIX: Update users_role_check constraint to include nurse and librarian
-- Run this SEPARATELY if you already ran the script above.
-- ============================================================

-- Step 1: Drop the existing role check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Re-add the constraint with nurse and librarian included
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (
    role IN (
      'super_admin',
      'admin',
      'teacher',
      'student',
      'parent',
      'bursar',
      'staff',
      'security',
      'driver',
      'nurse',
      'librarian'
    )
  );

-- ============================================================
-- 5. Medication Schedules Table (for Nurse Medication Tracker)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.medication_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    nurse_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'Once daily',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    instructions TEXT,
    prescribed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nurses and Admins can manage medication schedules"
ON public.medication_schedules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.school_id = medication_schedules.school_id
    AND users.role IN ('nurse', 'admin', 'super_admin')
  )
);

-- ============================================================
-- 6. Add status CHECK constraint to library_checkouts
-- ============================================================

ALTER TABLE public.library_checkouts
  DROP CONSTRAINT IF EXISTS library_checkouts_status_check;

ALTER TABLE public.library_checkouts
  ADD CONSTRAINT library_checkouts_status_check
  CHECK (status IN ('active', 'returned', 'lost'));

