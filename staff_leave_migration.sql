-- Add substitute_id to leave_requests table
ALTER TABLE public.leave_requests
ADD COLUMN substitute_id uuid REFERENCES auth.users(id);

-- Update RLS policies for leave_requests if necessary
-- For example, allowing substitute teachers to view their assignments
