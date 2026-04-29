-- teacher_rls_patch.sql
-- Update election_candidates_insert policy to allow teachers to nominate themselves
DROP POLICY IF EXISTS "election_candidates_insert" ON election_candidates;
CREATE POLICY "election_candidates_insert" ON election_candidates FOR INSERT WITH CHECK (
  school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'teacher')) OR
  school_id IN (SELECT school_id FROM students WHERE user_id = auth.uid())
);

-- Update election_votes_insert policy to allow teachers to cast votes
DROP POLICY IF EXISTS "election_votes_insert" ON election_votes;
CREATE POLICY "election_votes_insert" ON election_votes FOR INSERT WITH CHECK (
  school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'teacher')) OR
  school_id IN (SELECT school_id FROM students WHERE user_id = auth.uid())
);

-- Update election_votes_select policy to ensure teachers can see their own votes
DROP POLICY IF EXISTS "election_votes_select" ON election_votes;
CREATE POLICY "election_votes_select" ON election_votes FOR SELECT USING (
  school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff', 'teacher')) OR
  voter_student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
  voter_teacher_id = auth.uid()
);

-- Allow students and teachers to cancel their own votes
DROP POLICY IF EXISTS "election_votes_delete" ON election_votes;
CREATE POLICY "election_votes_delete" ON election_votes FOR DELETE USING (
  school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) OR
  voter_student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
  voter_teacher_id = auth.uid()
);
