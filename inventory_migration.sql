-- ═══════════════════════════════════════════════════════════════════
-- INVENTORY & SCHOOL STORE MIGRATION
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Inventory Items — The product catalog
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  name              text NOT NULL,
  category          text DEFAULT 'General', -- Uniform, Book, Stationery, etc.
  description       text,
  cost_price        numeric(12,2) NOT NULL DEFAULT 0,
  selling_price     numeric(12,2) NOT NULL DEFAULT 0,
  current_stock     integer NOT NULL DEFAULT 0,
  reorder_level     integer DEFAULT 5,
  unit              text DEFAULT 'pcs',      -- pcs, set, pair
  created_at        timestamp with time zone DEFAULT now()
);

-- 2. Inventory Sales — Records of customer purchases
CREATE TABLE IF NOT EXISTS public.inventory_sales (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  item_id           uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  student_id        uuid REFERENCES public.students(id) ON DELETE SET NULL, -- Optional if sold to outsider
  buyer_name        text, -- For anonymous or parent sales
  quantity          integer NOT NULL DEFAULT 1,
  unit_price        numeric(12,2) NOT NULL,
  total_amount      numeric(12,2) NOT NULL,
  payment_method    text DEFAULT 'cash',
  recorded_by       uuid REFERENCES public.users(id),
  created_at        timestamp with time zone DEFAULT now()
);

-- 3. Stock Logs — Audit trail for restocks or manual adjustments
CREATE TABLE IF NOT EXISTS public.inventory_stock_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  item_id           uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type              text NOT NULL, -- 'restock', 'adjustment', 'sale_return'
  quantity_change   integer NOT NULL,
  previous_stock    integer NOT NULL,
  new_stock         integer NOT NULL,
  reason            text,
  recorded_by       uuid REFERENCES public.users(id),
  created_at        timestamp with time zone DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inv_items_school    ON public.inventory_items(school_id);
CREATE INDEX IF NOT EXISTS idx_inv_sales_school    ON public.inventory_sales(school_id);
CREATE INDEX IF NOT EXISTS idx_inv_sales_date      ON public.inventory_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_inv_logs_item       ON public.inventory_stock_logs(item_id);

-- ── Row Level Security ───────────────────────────────────────────────
ALTER TABLE public.inventory_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_sales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Bursars/Admins can manage their school's inventory
CREATE POLICY "school_access_inv_items" ON public.inventory_items
  USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "school_access_inv_sales" ON public.inventory_sales
  USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));
CREATE POLICY "school_access_inv_logs" ON public.inventory_stock_logs
  USING (school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()));

-- ── Auto-Posting to Financials (Trigger) ────────────────────────────
-- This trigger automatically creates an income_record whenever a sale is recorded
-- so it appears in the P&L Audit Report without manual entry.

CREATE OR REPLACE FUNCTION public.fn_post_inventory_sale_to_income()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.income_records (school_id, category, description, amount, date, recorded_by)
  VALUES (
    NEW.school_id,
    'Store Sale',
    'Sale of item: ' || (SELECT name FROM public.inventory_items WHERE id = NEW.item_id) || ' x' || NEW.quantity,
    NEW.total_amount,
    CURRENT_DATE,
    NEW.recorded_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_post_inv_sale
AFTER INSERT ON public.inventory_sales
FOR EACH ROW EXECUTE FUNCTION public.fn_post_inventory_sale_to_income();
