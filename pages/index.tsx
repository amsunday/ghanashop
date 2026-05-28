import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { sanitizePhoneNumber } from '../lib/sanitize';
import { generateMomoInvoiceMessage, createWhatsAppDeepLink } from '../lib/templates';

// Type definitions
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  is_available: boolean;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PublicStorefront() {
  const userId = '00000000-0000-0000-0000-000000000000'; // Default tenant

  // Shop details
  const [shopDetails, setShopDetails] = useState<any>({
    shop_name: 'Ghana Market Store',
    currency_symbol: 'GH₵',
    currency_code: 'GHS',
    momo_network: 'MTN',
    momo_name: 'Store Checkout Account',
    momo_number: '0240000000',
    contact_phone: '0240000000'
  });

  // DB States
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Form checkout details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch store data
  useEffect(() => {
    async function loadStorefrontData() {
      try {
        setLoading(true);
        // 1. Fetch Shop details
        const { data: shopData } = await supabase
          .from('shops')
          .select('*')
          .eq('id', userId)
          .single();

        if (shopData) {
          setShopDetails(shopData);
        }

        // 2. Fetch categories
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .eq('shop_id', userId)
          .order('display_order', { ascending: true });

        setCategories(catData || []);

        // 3. Fetch products
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', userId);

        setProducts(prodData || []);

        // 4. Fetch feedbacks
        const { data: feedbackData } = await supabase
          .from('feedbacks')
          .select('*')
          .eq('shop_id', userId)
          .order('created_at', { ascending: false })
          .limit(3);

        setFeedbacks(feedbackData || []);

      } catch (err) {
        console.error('Error fetching storefront data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStorefrontData();
  }, [userId]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock_quantity) }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: Math.min(Math.max(newQty, 0), item.product.stock_quantity) };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
    });
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  // Submit checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMsg('Your cart is empty!');
      return;
    }
    if (!customerName || !customerPhone || !deliveryLandmark) {
      setErrorMsg('Please fill in all checkout fields!');
      return;
    }

    try {
      setCheckoutLoading(true);
      setErrorMsg('');

      const total = getCartTotal();

      // 1. Insert order
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          shop_id: userId,
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_landmark: deliveryLandmark,
          total_price: total,
          status: 'pending'
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Insert order items
      const orderItemsToInsert = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_purchase: item.product.price
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsErr) throw itemsErr;

      // 3. Format Invoice Message & Redirect
      const invoiceOrder = {
        id: orderData.id,
        customer_name: customerName,
        delivery_landmark: deliveryLandmark,
        total_price: total,
        items: cart.map(item => ({
          product_name: item.product.name,
          quantity: item.quantity,
          price_at_purchase: item.product.price
        }))
      };

      const messageText = generateMomoInvoiceMessage(shopDetails, invoiceOrder);
      
      // WhatsApp deep link uses store's contact phone number to receive the order request!
      const waLink = createWhatsAppDeepLink(shopDetails.contact_phone, messageText);

      // Reset cart and UI state
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryLandmark('');
      setIsCartOpen(false);
      setCheckoutSuccess(true);

      // Trigger automatic deep-link opening
      window.open(waLink, '_blank');

    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg('Failed to place order: ' + err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Unique pastel/gradient background creator for premium-looking cards when no image exists
  const getGradientHeader = (id: string) => {
    const gradients = [
      'from-rose-500/20 to-orange-500/20 text-rose-300',
      'from-emerald-500/20 to-teal-500/20 text-emerald-300',
      'from-blue-500/20 to-indigo-500/20 text-blue-300',
      'from-amber-500/20 to-yellow-500/20 text-amber-300',
      'from-violet-500/20 to-purple-500/20 text-violet-300',
      'from-pink-500/20 to-rose-500/20 text-pink-300'
    ];
    const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
    return gradients[code % gradients.length];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-20">
      <Head>
        <title>{shopDetails.shop_name} | Local Storefront</title>
        <meta name="description" content="Shop directly from our local catalog and pay securely with Mobile Money." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Outfit', sans-serif;
          }
        `}</style>
      </Head>

      {/* Stunning glassmorphic top header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🇬🇭</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100">{shopDetails.shop_name}</h1>
              <p className="text-[10px] text-emerald-400 font-mono tracking-wider font-bold uppercase">Online Storefront</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors hidden sm:block">
              Merchant Admin
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-slate-850 transition-all flex items-center gap-2"
            >
              <span className="text-base">🛒</span>
              <span className="text-xs font-semibold hidden md:inline">Cart</span>
              {getCartCount() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-[10px] rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
                  {getCartCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-8 space-y-12">
        {/* Dynamic greeting banner */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 p-6 md:p-10 shadow-2xl">
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/5 rounded-full filter blur-[80px] pointer-events-none"></div>
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-900/50 rounded-full text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Accepting Orders via WhatsApp MoMo
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-100">
              High-Quality Products, <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Directly to Your Doorstep.</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Browse our catalog below. Add your items to the dynamic cart and checkout. Your structured invoice will be immediately routed straight to our shop's WhatsApp line!
            </p>
          </div>
        </section>

        {/* Success Modal */}
        {checkoutSuccess && (
          <div className="p-6 bg-emerald-950/40 border border-emerald-900/50 rounded-2xl text-center space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <span className="text-3xl">🚀</span>
            <h3 className="text-xl font-bold text-slate-100">Order Placed Successfully!</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              We have written your invoice to the system. You have been redirected to WhatsApp to send the message. If the window did not open, please check your pop-up blocker.
            </p>
            <button
              onClick={() => setCheckoutSuccess(false)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              Continue Shopping
            </button>
          </div>
        )}

        {/* Interactive Controls & Filters */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                    : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Products 📦
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-full md:w-72 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <span className="absolute right-3.5 top-3 text-slate-600 text-xs pointer-events-none">🔍</span>
            </div>
          </div>

          {/* Grid list container */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-900 rounded-3xl">
              <span className="text-4xl block mb-3">🛍️</span>
              <p className="text-slate-400 text-sm font-semibold">No items match your selection.</p>
              <p className="text-slate-600 text-xs mt-1">Try modifying your category filters or search queries.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const cartItem = cart.find(item => item.product.id === product.id);
                const quantityInCart = cartItem ? cartItem.quantity : 0;

                return (
                  <div
                    key={product.id}
                    className="group bg-slate-900 border border-slate-850/80 rounded-2xl overflow-hidden hover:border-slate-800 hover:scale-[1.01] active:scale-[0.99] transition-all flex flex-col justify-between"
                  >
                    {/* Header Image or Gradient placeholder */}
                    <div className="relative h-44 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-tr ${getGradientHeader(product.id)} flex flex-col items-center justify-center p-4`}>
                          <span className="text-3xl block mb-2 filter drop-shadow">📦</span>
                          <span className="text-[10px] font-bold tracking-wider uppercase opacity-85">{product.name}</span>
                        </div>
                      )}

                      {/* Stock availability indicator */}
                      <span className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        product.is_available && product.stock_quantity > 0
                          ? 'bg-emerald-950/80 border border-emerald-900/50 text-emerald-400'
                          : 'bg-red-950/80 border border-red-900/50 text-red-400'
                      }`}>
                        {product.is_available && product.stock_quantity > 0 ? 'In Stock' : 'Sold Out'}
                      </span>
                    </div>

                    {/* Content breakdown details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1">
                          {product.description || 'Premium local selection crafted for exceptional quality.'}
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-extrabold text-slate-100">
                          {shopDetails.currency_symbol} {product.price.toFixed(2)}
                        </span>

                        {product.is_available && product.stock_quantity > 0 ? (
                          quantityInCart > 0 ? (
                            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-3">
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-7 h-7 flex items-center justify-center font-bold text-xs bg-slate-900 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold font-mono px-1">{quantityInCart}</span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-7 h-7 flex items-center justify-center font-bold text-xs bg-slate-900 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-50 font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
                            >
                              Add to Cart 🛒
                            </button>
                          )
                        ) : (
                          <button
                            disabled
                            className="px-3.5 py-2 bg-slate-950 border border-slate-900 text-slate-600 rounded-xl text-xs font-semibold"
                          >
                            Out of Stock
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Live Social Proof / reviews section */}
        {feedbacks.length > 0 && (
          <section className="border-t border-slate-900 pt-10 space-y-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold tracking-tight text-slate-100">⭐️ Customer Shoutouts</h3>
              <p className="text-xs text-slate-400">Read verified passwordless reviews submitted by our local buyers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {feedbacks.map(f => (
                <div key={f.id} className="p-5 bg-slate-900/60 border border-slate-900 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: f.rating }).map((_, i) => (
                        <span key={i} className="text-amber-400 text-sm">★</span>
                      ))}
                    </div>
                    <p className="text-xs italic text-slate-300">"{f.comment}"</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span className="font-bold text-slate-400">{f.customer_name}</span>
                    <span>{new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <Link
                href="/review"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-800 bg-slate-900/40 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Submit Your Review ⭐
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Floating sliding cart sidebar/drawer container */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-850 h-full flex flex-col justify-between shadow-2xl relative">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-850 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛒</span>
                <h3 className="text-base font-bold text-slate-100">Your Checkout Basket</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 text-xs font-bold flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-2">
                  <span className="text-4xl">🛍️</span>
                  <p className="text-slate-400 text-xs font-semibold">Your basket is empty!</p>
                  <p className="text-slate-600 text-[10px]">Add products to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-slate-200 truncate">{item.product.name}</h5>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {shopDetails.currency_symbol} {item.product.price.toFixed(2)} each
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-slate-900 rounded border border-slate-850 text-slate-400"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold font-mono w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-slate-900 rounded border border-slate-850 text-slate-400"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkout Form */}
              {cart.length > 0 && (
                <div className="border-t border-slate-850/60 pt-5 space-y-4">
                  <div className="flex items-center gap-1.5 pb-2">
                    <span className="text-xs">📋</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Checkout Form</h4>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-300 text-[11px] text-center font-medium">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleCheckout} className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="e.g. Ama Serwaa"
                        className="px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
                        MoMo/WhatsApp Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 0541234567"
                        className="px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
                        Delivery Landmark / Address
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={deliveryLandmark}
                        onChange={e => setDeliveryLandmark(e.target.value)}
                        placeholder="e.g. Next to Osu Shell Station, Accra"
                        className="px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500 text-xs resize-none transition-colors"
                      />
                    </div>

                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2 mt-4">
                      <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>Items Subtotal:</span>
                        <span>{shopDetails.currency_symbol} {getCartTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>Delivery Fee:</span>
                        <span className="text-emerald-400 font-bold uppercase text-[9px] bg-emerald-950 border border-emerald-900/50 px-2 py-0.5 rounded tracking-wide">
                          Calculated in Chat
                        </span>
                      </div>
                      <div className="border-t border-slate-850 pt-2 flex justify-between text-sm font-extrabold text-slate-100">
                        <span>Grand Total:</span>
                        <span>{shopDetails.currency_symbol} {getCartTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={checkoutLoading}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-50 font-bold rounded-xl shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 text-xs uppercase tracking-wider"
                    >
                      {checkoutLoading ? 'Processing Checkout...' : 'Send WhatsApp Order 📲'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Bottom Footer Details */}
            <div className="p-4 bg-slate-950 border-t border-slate-850 text-center text-[10px] text-slate-500">
              Payments processed securely through Mobile Money: {shopDetails.momo_network.toUpperCase()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
