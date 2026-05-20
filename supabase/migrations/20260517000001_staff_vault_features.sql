ALTER TABLE public.staff_documents 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'::text,
ADD COLUMN IF NOT EXISTS is_admin_uploaded boolean DEFAULT false;

-- Add check constraint for status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_documents_status_check'
  ) THEN
    ALTER TABLE public.staff_documents 
    ADD CONSTRAINT staff_documents_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;
