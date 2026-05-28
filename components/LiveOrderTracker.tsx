import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateMomoInvoiceMessage, createWhatsAppDeepLink } from '../lib/templates';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  products?: {
    name: string;
  };
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_landmark: string;
  total_price: number;
  momo_transaction_id: string | null;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  created_at: string;
  order_items: OrderItem[];
}

interface ShopDetails {
  shop_name: string;
  currency_symbol: string;
  momo_network: string;
  momo_name: string;
  momo_number: string;
}

interface LiveOrderTrackerProps {
  orders: Order[];
  shopDetails: ShopDetails;
  onOrderUpdated: () => void;
}

export default function LiveOrderTracker({ orders, shopDetails, onOrderUpdated }: LiveOrderTrackerProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Group orders by status
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const paidOrders = orders.filter(o => o.status === 'paid');
  const completedOrders = orders.filter(o => o.status === 'completed');

  // Update order status on Supabase
  const updateStatus = async (orderId: string, newStatus: 'pending' | 'paid' | 'completed' | 'cancelled') => {
    try {
      setUpdatingId(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      onOrderUpdated();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Trigger WhatsApp Deep Link
  const handleSendInvoice = (order: Order) => {
    const orderTemplateItems = order.order_items.map(item => ({
      product_name: item.products?.name || 'Store Item',
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase
    }));

    const invoiceMessage = generateMomoInvoiceMessage(shopDetails, {
      id: order.id,
      customer_name: order.customer_name,
      delivery_landmark: order.delivery_landmark,
      total_price: order.total_price,
      items: orderTemplateItems
    });

    const deepLink = createWhatsAppDeepLink(order.customer_phone, invoiceMessage);
    
    // Open in WhatsApp
    window.open(deepLink, '_blank');
  };

  // Status Badge styling helper
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-950/80 border border-amber-900/50 text-amber-400';
      case 'paid':
        return 'bg-emerald-950/80 border border-emerald-900/50 text-emerald-400';
      case 'completed':
        return 'bg-indigo-950/80 border border-indigo-900/50 text-indigo-400';
      default:
        return 'bg-slate-800 border border-slate-700 text-slate-400';
    }
  };

  const renderOrderCard = (order: Order) => {
    const shortId = order.id.slice(0, 8).toUpperCase();
    return (
      <div key={order.id} className="bg-slate-950 border border-slate-900 rounded-xl p-5 space-y-4 hover:border-slate-800 transition-colors shadow-md relative overflow-hidden group">
        
        {/* Top Status Header */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-slate-500 font-bold">#{shortId}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getStatusBadgeClass(order.status)}`}>
            {order.status}
          </span>
        </div>

        {/* Customer Details */}
        <div>
          <h4 className="font-bold text-slate-200 text-base">{order.customer_name}</h4>
          <p className="text-xs text-slate-400 mt-1 font-mono">{order.customer_phone}</p>
          <div className="flex gap-1.5 items-start text-xs text-slate-300 mt-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-900">
            <span className="shrink-0 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">📍 Landmark:</span>
            <span className="italic">{order.delivery_landmark}</span>
          </div>
        </div>

        {/* Ordered items */}
        <div className="border-t border-slate-900 pt-3 space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">🛒 Ordered Items</span>
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-xs text-slate-300">
              <span>{item.quantity}x {item.products?.name || 'Product'}</span>
              <span className="text-slate-400 font-mono">
                {shopDetails.currency_symbol}{(item.quantity * item.price_at_purchase).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* MoMo ID if available */}
        {order.momo_transaction_id && (
          <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-2.5 text-xs text-emerald-400 font-mono flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-slate-500">ID MoMo:</span>
            <span className="font-bold">{order.momo_transaction_id}</span>
          </div>
        )}

        {/* Total Price settlement */}
        <div className="border-t border-slate-900 pt-3 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400">Total Invoice:</span>
          <span className="font-bold text-slate-50 font-mono text-lg">
            {shopDetails.currency_symbol}{order.total_price.toFixed(2)}
          </span>
        </div>

        {/* Actions grid */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {/* Send WhatsApp message trigger */}
          <button
            onClick={() => handleSendInvoice(order)}
            className="col-span-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-50 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 active:scale-[0.98] transition-transform"
          >
            <span>💬 Send WhatsApp Link</span>
          </button>

          {/* Transition states */}
          {order.status === 'pending' && (
            <button
              onClick={() => updateStatus(order.id, 'paid')}
              disabled={updatingId === order.id}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-emerald-400 text-xs font-semibold rounded-lg transition-colors"
            >
              Mark Paid
            </button>
          )}

          {order.status === 'paid' && (
            <button
              onClick={() => updateStatus(order.id, 'completed')}
              disabled={updatingId === order.id}
              className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-indigo-400 text-xs font-semibold rounded-lg transition-colors"
            >
              Complete
            </button>
          )}

          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <button
              onClick={() => updateStatus(order.id, 'cancelled')}
              disabled={updatingId === order.id}
              className="py-1.5 px-2 bg-slate-900 hover:bg-red-950/20 border border-slate-800 hover:border-red-900/30 text-red-500/80 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          ⚡ Live Order Board
        </h3>
        <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-medium">
          Total Incoming: {orders.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* column 1: Pending */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="font-semibold text-slate-300 flex items-center gap-1.5 text-sm uppercase tracking-wide">
              🟡 Pending Checkout
            </h4>
            <span className="text-xs bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full font-bold">
              {pendingOrders.length}
            </span>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {pendingOrders.length === 0 ? (
              <p className="text-slate-500 italic text-xs text-center py-8 select-none">No pending checkouts.</p>
            ) : (
              pendingOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* column 2: Paid */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="font-semibold text-slate-300 flex items-center gap-1.5 text-sm uppercase tracking-wide">
              🟢 Paid Orders
            </h4>
            <span className="text-xs bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full font-bold">
              {paidOrders.length}
            </span>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {paidOrders.length === 0 ? (
              <p className="text-slate-500 italic text-xs text-center py-8 select-none">No paid receipts.</p>
            ) : (
              paidOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* column 3: Completed */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h4 className="font-semibold text-slate-300 flex items-center gap-1.5 text-sm uppercase tracking-wide">
              🔵 Completed
            </h4>
            <span className="text-xs bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full font-bold">
              {completedOrders.length}
            </span>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {completedOrders.length === 0 ? (
              <p className="text-slate-500 italic text-xs text-center py-8 select-none">No completed dispatches.</p>
            ) : (
              completedOrders.map(renderOrderCard)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
