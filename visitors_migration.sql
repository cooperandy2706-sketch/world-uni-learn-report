-- Visitors table
CREATE TABLE visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  purpose text,
  person_to_see text,
  id_number text,
  time_in timestamptz DEFAULT now(),
  time_out timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add RLS Policies
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Visitors RLS
CREATE POLICY "visitors_select" ON visitors FOR SELECT 
USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));

CREATE POLICY "visitors_insert" ON visitors FOR INSERT 
WITH CHECK (school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')));

CREATE POLICY "visitors_update" ON visitors FOR UPDATE 
USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')));

CREATE POLICY "visitors_delete" ON visitors FOR DELETE 
USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
