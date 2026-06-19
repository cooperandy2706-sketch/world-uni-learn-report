-- Allow unauthenticated guests to read global quizzes that are published
CREATE POLICY "Allow public read for global quizzes" ON public.global_quizzes
  FOR SELECT TO anon
  USING (school_id IS NULL AND is_published = true);

-- Allow unauthenticated guests to read global resources that are published
CREATE POLICY "Allow public read for global resources" ON public.global_resources
  FOR SELECT TO anon
  USING (school_id IS NULL AND is_published = true);
