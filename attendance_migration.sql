-- Attendance module migration
-- Run this in your Supabase SQL editor

-- ── Attendance Records ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_records (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id     uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id   uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  term_id      uuid REFERENCES terms(id),
  student_id   uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date         date NOT NULL,
  status       text NOT NULL CHECK (status IN ('present','absent','late','excused')),
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

-- ── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Class teachers can insert/update/read their own class attendance
CREATE POLICY "teachers_manage_attendance" ON attendance_records
  FOR ALL USING (
    teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
  );

-- Admins can read all attendance for their school
CREATE POLICY "admins_read_attendance" ON attendance_records
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── Trigger: auto-update updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attendance_updated_at ON attendance_records;
CREATE TRIGGER attendance_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Index for fast daily queries ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_attendance_date_class ON attendance_records(date, class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date_school ON attendance_records(date, school_id);

-- ── NOTE: Make sure the classes table has a class_teacher_id column ────────
-- If it doesn't exist yet, add it:
ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_teacher_id uuid REFERENCES teachers(id);
