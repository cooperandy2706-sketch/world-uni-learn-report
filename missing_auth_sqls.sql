-- Missing SQLs for Authentication & Registration

-- Based on your current schema and the AuthPage.tsx React component we built,
-- here are the missing SQL commands needed in your Supabase SQL Editor so 
-- the login and registration flows work perfectly.

-- 1. Update the `users` Table Role Constraint
-- In your schema, the `users` table only allows `admin` and `teacher`. Since our form 
-- allows registering as a `student` as well, we need to update this constraint:

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'teacher'::text, 'student'::text]));

-- 2. Connect the `students` Table to Auth Users
-- Your `teachers` table has a `user_id` column referencing `public.users(id)`, but your 
-- `students` table does not. A registered student needs to link back to their Authentication identity. 

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id);

-- 3. Row Level Security (RLS) Policies
-- By default, Supabase blocks all frontend data fetching and inserting if RLS is enabled. 
-- Since the registration happens *on the frontend*, we must explicitly allow these actions via policies.

-- Enable RLS on the relevant tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE to verify school codes
-- (The UI does: select('id').eq('id', form.school_code))
DROP POLICY IF EXISTS "Allow public read access to schools" ON public.schools;
CREATE POLICY "Allow public read access to schools" 
ON public.schools FOR SELECT USING (true);

-- Allow newly authenticated users to insert their own user profile
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users;
CREATE POLICY "Allow users to insert their own profile" 
ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow newly authenticated teachers to insert their teacher record
DROP POLICY IF EXISTS "Allow teachers to insert their own record" ON public.teachers;
CREATE POLICY "Allow teachers to insert their own record" 
ON public.teachers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow checking for admin IDs during registration
-- (The UI needs to find the admin to send a notification)
DROP POLICY IF EXISTS "Allow reading basic user info to find admins" ON public.users;
CREATE POLICY "Allow reading basic user info to find admins" 
ON public.users FOR SELECT USING (true); 

-- Allow users to insert notifications
-- (The UI inserts an 'approval needed' notification to the admin)
DROP POLICY IF EXISTS "Allow users to create notifications" ON public.notifications;
CREATE POLICY "Allow users to create notifications" 
ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
