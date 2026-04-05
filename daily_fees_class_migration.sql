-- daily_fees_class_migration.sql

-- 1. Add exemption configuration to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS daily_fee_mode text DEFAULT 'all';

-- Optional safety constraint for mode
ALTER TABLE students 
ADD CONSTRAINT check_daily_fee_mode 
CHECK (daily_fee_mode IN ('all', 'feeding', 'none'));

-- 2. Create the new class-based rates table
CREATE TABLE IF NOT EXISTS daily_fee_class_rates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id uuid REFERENCES schools(id) NOT NULL,
    term_id uuid REFERENCES terms(id) NOT NULL,
    class_id uuid REFERENCES classes(id) NOT NULL,
    expected_feeding_fee numeric(10,2) DEFAULT 0,
    expected_studies_fee numeric(10,2) DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Ensure a class only has one unique rate configuration per term
    UNIQUE(school_id, term_id, class_id)
);

-- 3. Set up RLS for the new table
ALTER TABLE daily_fee_class_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow school admin to manage daily_fee_class_rates" ON daily_fee_class_rates
    FOR ALL
    USING (school_id IN (
        SELECT school_id FROM users WHERE id = auth.uid()
    ));

-- Since we are moving away from `daily_fee_config`, we will leave it for now to avoid breaking existing history
-- but going forward `daily_fee_class_rates` handles all calculations.
