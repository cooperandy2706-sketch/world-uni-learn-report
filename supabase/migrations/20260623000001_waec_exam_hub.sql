-- Add WAEC exam support columns to global_quizzes
ALTER TABLE public.global_quizzes ADD COLUMN IF NOT EXISTS exam_type text DEFAULT 'standard';
ALTER TABLE public.global_quizzes ADD COLUMN IF NOT EXISTS class_level text;
ALTER TABLE public.global_quizzes ADD COLUMN IF NOT EXISTS subject_name text;

-- Create exam_attempts table for tracking timed exam attempts
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  quiz_id uuid NOT NULL REFERENCES public.global_quizzes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  answers jsonb DEFAULT '{}',
  subjective_answers jsonb DEFAULT '{}',
  score integer DEFAULT 0,
  total_marks integer DEFAULT 0,
  percentage numeric DEFAULT 0,
  time_taken_seconds integer,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'timed_out')),
  started_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (guest exams) and read own attempts
CREATE POLICY IF NOT EXISTS "exam_attempts_insert" ON public.exam_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "exam_attempts_select" ON public.exam_attempts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "exam_attempts_update" ON public.exam_attempts FOR UPDATE USING (true);
