-- Add expiration and trigger fields to announcements
ALTER TABLE public.announcements ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.announcements ADD COLUMN trigger_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.announcements ADD COLUMN is_alarm BOOLEAN DEFAULT false;
