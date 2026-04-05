-- Migration: Add arrears tracking to fee_payments
-- Run this in Supabase SQL Editor

-- 1. Add arrears_paid column to fee_payments (how much of this payment went toward clearing arrears)
ALTER TABLE public.fee_payments
ADD COLUMN IF NOT EXISTS arrears_paid numeric NOT NULL DEFAULT 0;

-- 2. Add arrears_balance_after column (student's remaining arrears after this payment)
ALTER TABLE public.fee_payments
ADD COLUMN IF NOT EXISTS arrears_balance_after numeric NOT NULL DEFAULT 0;

-- 3. Enable RLS policy updates (if needed)
-- The existing RLS policies on fee_payments should still work since we're just adding columns.
