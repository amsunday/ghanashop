-- ==========================================
-- FIX MIGRATION: RLS Policy Corrections + Stock Decrement Trigger
-- Migration: 20260611_fixes_rls_stock.sql
-- ==========================================

-- ──────────────────────────────────────────
-- FIX #2: Allow public SELECT on shops table
-- Without this, unauthenticated storefront visitors cannot load shop data.
-- ──────────────────────────────────────────

CREATE POLICY "Anyone can read shop profiles"
    ON public.shops FOR SELECT
    USING (true);

-- ──────────────────────────────────────────
-- FIX #1: Replace overlapping FOR ALL policies on categories & products
-- with explicit INSERT / UPDATE / DELETE policies for clarity.
-- ──────────────────────────────────────────

-- Drop the ambiguous FOR ALL policies
DROP POLICY IF EXISTS "Shop owners can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Shop owners can manage products" ON public.products;

-- Categories: explicit per-operation policies
CREATE POLICY "Shop owners can insert categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = shop_id);

CREATE POLICY "Shop owners can update categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = shop_id)
    WITH CHECK (auth.uid() = shop_id);

CREATE POLICY "Shop owners can delete categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = shop_id);

-- Products: explicit per-operation policies
CREATE POLICY "Shop owners can insert products"
    ON public.products FOR INSERT
    WITH CHECK (auth.uid() = shop_id);

CREATE POLICY "Shop owners can update products"
    ON public.products FOR UPDATE
    USING (auth.uid() = shop_id)
    WITH CHECK (auth.uid() = shop_id);

CREATE POLICY "Shop owners can delete products"
    ON public.products FOR DELETE
    USING (auth.uid() = shop_id);


-- ──────────────────────────────────────────
-- FIX #19: Decrement stock quantity when an order item is inserted.
-- Automatically sets is_available = false when stock reaches 0.
-- ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.decrement_stock_on_order_item()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET
        stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0),
        is_available = CASE
            WHEN (stock_quantity - NEW.quantity) <= 0 THEN false
            ELSE is_available
        END
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_decrement_stock_on_order_item
    AFTER INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_stock_on_order_item();
