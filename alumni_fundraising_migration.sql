-- Alumni table
CREATE TABLE alumni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  graduation_year int,
  current_occupation text,
  current_organization text,
  linkedin_url text,
  created_at timestamptz DEFAULT now()
);

-- Alumni Events
CREATE TABLE alumni_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);

-- Fundraising Campaigns
CREATE TABLE fundraising_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  goal_amount numeric DEFAULT 0,
  current_amount numeric DEFAULT 0,
  end_date timestamptz,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Donations
CREATE TABLE donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES fundraising_campaigns(id) ON DELETE CASCADE,
  donor_name text NOT NULL,
  amount numeric NOT NULL,
  donation_date timestamptz DEFAULT now(),
  notes text
);

-- RLS Policies
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraising_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Select Policies
CREATE POLICY "alumni_select" ON alumni FOR SELECT USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
CREATE POLICY "alumni_events_select" ON alumni_events FOR SELECT USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
CREATE POLICY "fundraising_select" ON fundraising_campaigns FOR SELECT USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));
CREATE POLICY "donations_select" ON donations FOR SELECT USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid()));

-- Insert/Update/Delete Policies (Admin Only)
CREATE POLICY "alumni_mgmt" ON alumni FOR ALL USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "alumni_events_mgmt" ON alumni_events FOR ALL USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "fundraising_mgmt" ON fundraising_campaigns FOR ALL USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "donations_mgmt" ON donations FOR ALL USING (school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
