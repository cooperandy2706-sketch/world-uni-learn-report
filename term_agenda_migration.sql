-- Create term_agendas table
CREATE TABLE IF NOT EXISTS public.term_agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    week_number INT,
    is_published BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create term_agenda_responses table
CREATE TABLE IF NOT EXISTS public.term_agenda_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agenda_id UUID NOT NULL REFERENCES public.term_agendas(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'struggling')),
    feedback TEXT,
    admin_reply TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for term_agendas
ALTER TABLE public.term_agendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view term_agendas for their school" ON public.term_agendas
    FOR SELECT USING (school_id = (SELECT school_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage term_agendas" ON public.term_agendas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );

-- RLS for term_agenda_responses
ALTER TABLE public.term_agenda_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own responses" ON public.term_agenda_responses
    FOR SELECT USING (teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can insert/update their own responses" ON public.term_agenda_responses
    FOR ALL USING (teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view and update responses for their school" ON public.term_agenda_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );
