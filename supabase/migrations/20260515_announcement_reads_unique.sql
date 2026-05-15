-- Migration: Ensure announcement_reads has a UNIQUE constraint on (announcement_id, user_id)
-- This makes the ON CONFLICT IGNORE pattern in the application layer reliable.
-- Safe to run multiple times (uses IF NOT EXISTS pattern via DO block).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'announcement_reads_announcement_id_user_id_key'
      AND  conrelid = 'public.announcement_reads'::regclass
  ) THEN
    ALTER TABLE public.announcement_reads
      ADD CONSTRAINT announcement_reads_announcement_id_user_id_key
      UNIQUE (announcement_id, user_id);
  END IF;
END
$$;
