import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';
import MomoInvoiceTab from '../components/MomoInvoiceTab';
import CategoryInventoryHub from '../components/CategoryInventoryHub';
import LiveOrderTracker from '../components/LiveOrderTracker';
import FeedbackStream from '../components/FeedbackStream';

export default function Dashboard() {
  // Assume a fixed authenticated user ID for demonstration/mockups.
  // In real implementations, retrieve this dynamically from Supabase Auth: supabase.auth.getUser()
  const userId = '00000000-0000-0000-0000-000000000000'; 

  // Store active tab
  const [activeTab, setActiveTab] = useState<'board' | 'inventory' | 'momo' | 'feedback'>('board');
  const [shopDetails, setShopDetails] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch profiles
  useEffect(() => {
    async function fetchShopDetails() {
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          setShopDetails(data);
        } else {
          // Setup a mock fallback shop details if not created yet
          setShopDetails({
            shop_name: 'Ghana Market Store',
            currency_symbol: 'GH₵',
            momo_network: 'MTN',
            momo_name: 'Store Checkout Account',
            momo_number: '0240000000',
            contact_phone: '0240000000'
          });
        }
      } catch (e) {
        console.error('Error loading shop profile:', e);
      }
    }

    if (userId) {
      fetchShopDetails();
    }
  }, [userId]);

  // Fetch orders and feedbacks
  const fetchOrdersAndReviews = async () => {
    try {
      // Fetch orders complete with inner joined items and products
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name
            )
          )
        `)
        .eq('shop_id', userId)
        .order('created_at', { ascending: false });

      if (orderErr) throw orderErr;
      setOrders(orderData || []);

      // Fetch reviews
      const { data: reviewData, error: reviewErr } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('shop_id', userId)
        .order('created_at', { ascending: false });

      if (reviewErr) throw reviewErr;
      setFeedbacks(reviewData || []);
    } catch (err) {
      console.error('Error fetching dashboard feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchOrdersAndReviews();
    }
  }, [userId]);

  // SUPABASE REALTIME STREAM SYNC
  // Listen for real-time checkout inserts and feedback triggers dynamically
  useEffect(() => {
    const ordersChannel = supabase
      .channel('live-checkout-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${userId}` },
        () => {
          console.log('Realtime Order Trigger: refreshing board...');
          fetchOrdersAndReviews();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feedbacks', filter: `shop_id=eq.${userId}` },
        () => {
          console.log('Realtime Feedback Trigger: refreshing review stream...');
          fetchOrdersAndReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [userId]);

  const handleProfileUpdated = (updatedProfile: any) => {
    setShopDetails(updatedProfile);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Head>
        <title>{shopDetails?.shop_name || 'Store'} | WhatsApp Merchant Dashboard</title>
        <meta name="description" content="Production-ready multi-tenant store generator with MoMo payouts." />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Outfit', sans-serif;
          }
        `}</style>
      </Head>

      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl text-slate-50 shadow-md">
              🇬🇭
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100">
                {shopDetails?.shop_name || 'Ghana Merchant Store'}
              </h1>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold tracking-wide uppercase">
                Active Tenant ({shopDetails?.currency_code || 'GHS'})
              </span>
            </div>
          </div>

          {/* Navigation layout tab links */}
          <nav className="flex gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'board' ? 'bg-slate-900 border border-slate-850 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Live Board
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'inventory' ? 'bg-slate-900 border border-slate-850 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'feedback' ? 'bg-slate-900 border border-slate-850 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveTab('momo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'momo' ? 'bg-slate-900 border border-slate-850 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              MoMo Setup
            </button>
          </nav>
        </div>
      </header>

      {/* Main viewport content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="transition-all duration-300 transform">
            {activeTab === 'board' && (
              <LiveOrderTracker
                orders={orders}
                shopDetails={shopDetails}
                onOrderUpdated={fetchOrdersAndReviews}
              />
            )}
            {activeTab === 'inventory' && (
              <CategoryInventoryHub
                userId={userId}
                currencySymbol={shopDetails?.currency_symbol || 'GH₵'}
              />
            )}
            {activeTab === 'feedback' && (
              <FeedbackStream
                feedbacks={feedbacks}
                shopDetails={shopDetails}
              />
            )}
            {activeTab === 'momo' && (
              <MomoInvoiceTab
                userId={userId}
                onProfileUpdated={handleProfileUpdated}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-20">
        <p>© 2026 Ghana WhatsApp Storefront SaaS. Powered by AntiGravity Workflows & Supabase.</p>
      </footer>
    </div>
  );
}
