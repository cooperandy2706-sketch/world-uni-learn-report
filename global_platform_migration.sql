-- Migration for Super Admin Platform Features: Global Resources and Platform Messages

-- 1. Create global_resources table
CREATE TABLE IF NOT EXISTS global_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'link', 'passage', 'google_doc')),
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  topic TEXT,
  cover_image_url TEXT,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE
);

-- Note: RLS policies for global_resources
ALTER TABLE global_resources ENABLE ROW LEVEL SECURITY;

-- Select policy: Admins and students can view published resources, or anything belonging to their school
CREATE POLICY "View global_resources" 
  ON global_resources FOR SELECT 
  USING (is_published = true OR school_id IS NULL);

CREATE POLICY "Insert global_resources" 
  ON global_resources FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Update global_resources" 
  ON global_resources FOR UPDATE 
  USING (true);

CREATE POLICY "Delete global_resources" 
  ON global_resources FOR DELETE 
  USING (true);


-- 2. Create platform_messages table
CREATE TABLE IF NOT EXISTS platform_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('alert', 'update', 'event')),
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'admins', 'teachers', 'students'))
);

ALTER TABLE platform_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View platform_messages" 
  ON platform_messages FOR SELECT 
  USING (true);

CREATE POLICY "Insert platform_messages" 
  ON platform_messages FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Update platform_messages" 
  ON platform_messages FOR UPDATE 
  USING (true);

CREATE POLICY "Delete platform_messages" 
  ON platform_messages FOR DELETE 
  USING (true);
