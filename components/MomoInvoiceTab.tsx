import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Supported currencies mapping
export const CURRENCIES = [
  { code: 'GHS', symbol: 'GH₵', label: 'Ghanaian Cedi (GH₵)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira (₦)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' }
];

interface MomoInvoiceTabProps {
  userId: string;
  onProfileUpdated?: (profile: any) => void;
}

export default function MomoInvoiceTab({ userId, onProfileUpdated }: MomoInvoiceTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form states
  const [shopName, setShopName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [currencyCode, setCurrencyCode] = useState('GHS');
  const [currencySymbol, setCurrencySymbol] = useState('GH₵');
  const [momoNetwork, setMomoNetwork] = useState('MTN');
  const [momoName, setMomoName] = useState('');
  const [momoNumber, setMomoNumber] = useState('');

  // Fetch shop profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          // If no profile exists yet, keep defaults
          if (error.code !== 'PGRST116') {
            throw error;
          }
        } else if (data) {
          setShopName(data.shop_name || '');
          setContactPhone(data.contact_phone || '');
          setCurrencyCode(data.currency_code || 'GHS');
          setCurrencySymbol(data.currency_symbol || 'GH₵');
          setMomoNetwork(data.momo_network || 'MTN');
          setMomoName(data.momo_name || '');
          setMomoNumber(data.momo_number || '');
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setMessage({ text: 'Error loading profile: ' + err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Handle currency dropdown select
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const found = CURRENCIES.find(c => c.code === selectedCode);
    if (found) {
      setCurrencyCode(found.code);
      setCurrencySymbol(found.symbol);
    }
  };

  // Save profile to Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ text: '', type: '' });

      const profilePayload = {
        id: userId,
        shop_name: shopName,
        contact_phone: contactPhone,
        currency_code: currencyCode,
        currency_symbol: currencySymbol,
        momo_network: momoNetwork,
        momo_name: momoName,
        momo_number: momoNumber
      };

      const { data, error } = await supabase
        .from('shops')
        .upsert(profilePayload)
        .select()
        .single();

      if (error) throw error;

      setMessage({ text: 'Profile saved successfully! 🎉', type: 'success' });
      if (onProfileUpdated) {
        onProfileUpdated(data);
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setMessage({ text: 'Failed to save profile: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 md:p-8 backdrop-blur-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          📲 MoMo & Storefront Configuration
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Set up your shop metadata, default settlement currency, and Mobile Money transfer coordinates.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-950/50 border border-emerald-900/50 text-emerald-300' 
            : 'bg-red-950/50 border border-red-900/50 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shop Name */}
          <div className="flex flex-col">
            <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Shop Name</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="e.g., Kojo's Grocery Market"
            />
          </div>

          {/* Contact Phone */}
          <div className="flex flex-col">
            <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">WhatsApp Contact Phone</label>
            <input
              type="text"
              required
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="e.g., 0541234567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Currency Hub Selector */}
          <div className="flex flex-col">
            <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Billing Currency</label>
            <select
              value={currencyCode}
              onChange={handleCurrencyChange}
              className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>
                  {curr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Symbol Display */}
          <div className="flex flex-col">
            <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Active Symbol</label>
            <div className="px-4 py-3 bg-slate-950/50 border border-slate-900 rounded-xl text-slate-300 font-bold text-lg select-none">
              {currencySymbol}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 my-6 pt-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            💳 Mobile Money (MoMo) Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* MoMo Network Selection */}
            <div className="flex flex-col">
              <label className="text-slate-400 text-xs font-medium mb-2">MoMo Network</label>
              <select
                value={momoNetwork}
                onChange={e => setMomoNetwork(e.target.value)}
                className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="MTN">MTN Mobile Money</option>
                <option value="Telecel">Telecel Cash</option>
                <option value="AT">AT Money (AirtelTigo)</option>
              </select>
            </div>

            {/* Account Owner Name */}
            <div className="flex flex-col">
              <label className="text-slate-400 text-xs font-medium mb-2">Account Name</label>
              <input
                type="text"
                required
                value={momoName}
                onChange={e => setMomoName(e.target.value)}
                className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g., Kojo Mensah"
              />
            </div>

            {/* MoMo Phone Number */}
            <div className="flex flex-col">
              <label className="text-slate-400 text-xs font-medium mb-2">MoMo Number</label>
              <input
                type="text"
                required
                value={momoNumber}
                onChange={e => setMomoNumber(e.target.value)}
                className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g., 0241234567"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-50 font-bold rounded-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? 'Saving changes...' : 'Save Configuration ✅'}
        </button>
      </form>
    </div>
  );
}
