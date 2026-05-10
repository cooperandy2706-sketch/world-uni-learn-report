-- Migration: Add appointment tracking columns to election_candidates
-- Created: 2026-05-09
-- Fixes: ElectionsPage.tsx uses is_appointed + appointed_at which were missing from schema

ALTER TABLE public.election_candidates
  ADD COLUMN IF NOT EXISTS is_appointed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS appointed_at timestamp with time zone;

-- Index for efficient filtering of appointed candidates per election
CREATE INDEX IF NOT EXISTS idx_election_candidates_appointed
  ON public.election_candidates (election_id, is_appointed)
  WHERE is_appointed = true;

COMMENT ON COLUMN public.election_candidates.is_appointed IS 'Whether this candidate has been officially appointed to the position by admin override (independent of vote count)';
COMMENT ON COLUMN public.election_candidates.appointed_at IS 'Timestamp when the admin appointed this candidate';
