-- ==========================================
-- WHATSAPP STOREFRONT SAAS DATABASE SCHEMA
-- Tailored specifically for Ghanaian localized shops
-- Multi-tenant separation with strict Postgres RLS
-- Migration: 20260528_init_whatsapp_storefront.sql
-- ==========================================

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create shops (profiles) table
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY, -- References auth.users.id
    shop_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    currency_code TEXT NOT NULL DEFAULT 'GHS',
    currency_symbol TEXT NOT NULL DEFAULT 'GH₵',
    momo_network TEXT NOT NULL DEFAULT 'MTN', -- MTN, Telecel, AT
    momo_name TEXT NOT NULL,
    momo_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add uniqueness constraint to categories slug per shop
CREATE UNIQUE INDEX IF NOT EXISTS categories_shop_slug_idx ON public.categories (shop_id, slug);

-- 3. Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    delivery_landmark TEXT NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    momo_transaction_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(12, 2) NOT NULL CHECK (price_at_purchase >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==========================================
-- TRIGGER FUNCTIONS FOR UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER set_shops_updated_at BEFORE UPDATE ON public.shops
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ==========================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 1. Shops policies (Authenticated owners can view/modify their own shop)
CREATE POLICY "Shop owners can read their own profile"
    ON public.shops FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Shop owners can insert their own profile"
    ON public.shops FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Shop owners can update their own profile"
    ON public.shops FOR UPDATE
    USING (auth.uid() = id);

-- 2. Categories policies
CREATE POLICY "Anyone can view categories"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Shop owners can manage categories"
    ON public.categories FOR ALL
    USING (auth.uid() = shop_id)
    WITH CHECK (auth.uid() = shop_id);

-- 3. Products policies
CREATE POLICY "Anyone can view products"
    ON public.products FOR SELECT
    USING (true);

CREATE POLICY "Shop owners can manage products"
    ON public.products FOR ALL
    USING (auth.uid() = shop_id)
    WITH CHECK (auth.uid() = shop_id);

-- 4. Orders policies
-- Public buyers can insert orders. But only shop owners can see/update them.
CREATE POLICY "Public buyers can insert orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Shop owners can view their orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = shop_id);

CREATE POLICY "Shop owners can update their orders"
    ON public.orders FOR UPDATE
    USING (auth.uid() = shop_id)
    WITH CHECK (auth.uid() = shop_id);

-- 5. Order Items policies
-- Public buyers can insert order items. Only shop owners can see them.
CREATE POLICY "Public buyers can insert order items"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Shop owners can view their order items"
    ON public.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND o.shop_id = auth.uid()
    ));

-- 6. Feedbacks policies
-- Public buyers can insert feedbacks. Everyone can view them. Shop owners can delete if needed.
CREATE POLICY "Anyone can view feedbacks"
    ON public.feedbacks FOR SELECT
    USING (true);

CREATE POLICY "Public buyers can insert feedbacks"
    ON public.feedbacks FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Shop owners can manage feedbacks"
    ON public.feedbacks FOR DELETE
    USING (auth.uid() = shop_id);


-- ==========================================
-- REALTIME SUBSCRIPTIONS
-- ==========================================

-- Enable Realtime updates for specific tables
ALTER publication supabase_realtime ADD TABLE public.orders;
ALTER publication supabase_realtime ADD TABLE public.feedbacks;
