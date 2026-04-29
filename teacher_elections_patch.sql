-- teacher_elections_patch.sql
-- Drop the existing constraints that mandate student_id so we can make it nullable
ALTER TABLE election_candidates ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE election_votes ALTER COLUMN voter_student_id DROP NOT NULL;

-- Add the new columns to link candidates and votes to users (teachers)
ALTER TABLE election_candidates ADD COLUMN teacher_id uuid REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE election_votes ADD COLUMN voter_teacher_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Ensure a candidate can only stand once for a position, whether as a student or teacher
ALTER TABLE election_candidates ADD CONSTRAINT unique_teacher_candidate UNIQUE (position_id, teacher_id);

-- Ensure a voter can only vote once per position, whether as a student or teacher
ALTER TABLE election_votes ADD CONSTRAINT unique_teacher_vote UNIQUE (position_id, voter_teacher_id);

-- Add check constraints to ensure exactly ONE of the two references is set
ALTER TABLE election_candidates ADD CONSTRAINT check_candidate_identity CHECK (
  (student_id IS NOT NULL AND teacher_id IS NULL) OR 
  (student_id IS NULL AND teacher_id IS NOT NULL)
);

ALTER TABLE election_votes ADD CONSTRAINT check_voter_identity CHECK (
  (voter_student_id IS NOT NULL AND voter_teacher_id IS NULL) OR 
  (voter_student_id IS NULL AND voter_teacher_id IS NOT NULL)
);

-- Note: The RLS policies created in election_migration.sql check auth.uid() against users.id, 
-- which already covers teachers since they exist in the users table.
