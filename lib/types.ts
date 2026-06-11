/**
 * Shared TypeScript type definitions for the Ghana WhatsApp Storefront SaaS.
 * All components and pages should import from here instead of defining inline `any` types.
 */

// ─── Shop / Merchant Profile ────────────────────────────────────

export interface ShopDetails {
  id?: string;
  shop_name: string;
  contact_phone: string;
  currency_code: string;
  currency_symbol: string;
  momo_network: string;
  momo_name: string;
  momo_number: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Categories ─────────────────────────────────────────────────

export interface Category {
  id: string;
  shop_id?: string;
  name: string;
  slug: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

// ─── Products ───────────────────────────────────────────────────

export interface Product {
  id: string;
  shop_id?: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── Cart ───────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
}

// ─── Orders ─────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  products?: {
    name: string;
  };
}

export interface Order {
  id: string;
  shop_id?: string;
  customer_name: string;
  customer_phone: string;
  delivery_landmark: string;
  total_price: number;
  momo_transaction_id: string | null;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  order_items: OrderItem[];
}

// ─── Feedbacks / Reviews ────────────────────────────────────────

export interface Feedback {
  id: string;
  shop_id?: string;
  order_id?: string | null;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// ─── Default Shop (fallback before profile is created) ──────────

export const DEFAULT_SHOP_DETAILS: ShopDetails = {
  shop_name: 'Ghana Market Store',
  contact_phone: '0240000000',
  currency_code: 'GHS',
  currency_symbol: 'GH₵',
  momo_network: 'MTN',
  momo_name: 'Store Checkout Account',
  momo_number: '0240000000',
};
