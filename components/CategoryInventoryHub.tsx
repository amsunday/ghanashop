import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  is_available: boolean;
}

interface CategoryInventoryHubProps {
  userId: string;
  currencySymbol: string;
}

export default function CategoryInventoryHub({ userId, currencySymbol }: CategoryInventoryHubProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form states - Add Category
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');

  // Form states - Add Product
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('10');
  const [newProdCatId, setNewProdCatId] = useState('');
  const [newProdImg, setNewProdImg] = useState('');

  // Fetch categories & products
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch categories
        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .select('*')
          .eq('shop_id', userId)
          .order('display_order', { ascending: true });

        if (catErr) throw catErr;
        setCategories(catData || []);

        if (catData && catData.length > 0) {
          setNewProdCatId(catData[0].id);
        }

        // Fetch products
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', userId)
          .order('created_at', { ascending: false });

        if (prodErr) throw prodErr;
        setProducts(prodData || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setMessage({ text: 'Error loading inventory: ' + err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchData();
    }
  }, [userId]);

  // Handle adding new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;

    try {
      setActionLoading(true);
      setMessage({ text: '', type: '' });

      const { data, error } = await supabase
        .from('categories')
        .insert({
          shop_id: userId,
          name: newCatName,
          slug: newCatSlug.toLowerCase().trim().replace(/\s+/g, '-'),
          display_order: categories.length
        })
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      if (!newProdCatId) setNewProdCatId(data.id);
      setNewCatName('');
      setNewCatSlug('');
      setMessage({ text: 'Category added successfully! 📁', type: 'success' });
    } catch (err: any) {
      console.error('Error adding category:', err);
      setMessage({ text: 'Failed to add category: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle adding new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdCatId) return;

    try {
      setActionLoading(true);
      setMessage({ text: '', type: '' });

      const priceNum = parseFloat(newProdPrice);
      const stockNum = parseInt(newProdStock, 10);

      if (isNaN(priceNum) || priceNum < 0) throw new Error('Invalid price value.');
      if (isNaN(stockNum) || stockNum < 0) throw new Error('Invalid stock value.');

      const { data, error } = await supabase
        .from('products')
        .insert({
          shop_id: userId,
          category_id: newProdCatId,
          name: newProdName,
          description: newProdDesc,
          price: priceNum,
          image_url: newProdImg || null,
          stock_quantity: stockNum,
          is_available: stockNum > 0
        })
        .select()
        .single();

      if (error) throw error;

      setProducts([data, ...products]);
      setNewProdName('');
      setNewProdDesc('');
      setNewProdPrice('');
      setNewProdStock('10');
      setNewProdImg('');
      setMessage({ text: 'Product added successfully! 🛍️', type: 'success' });
    } catch (err: any) {
      console.error('Error adding product:', err);
      setMessage({ text: 'Failed to add product: ' + err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle availability
  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(p => p.id === productId ? { ...p, is_available: !currentStatus } : p));
    } catch (err: any) {
      console.error('Error toggling product status:', err);
      setMessage({ text: 'Failed to update product availability: ' + err.message, type: 'error' });
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-950/50 border border-emerald-900/50 text-emerald-300' 
            : 'bg-red-950/50 border border-red-900/50 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* left column: category management */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-fit">
          <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
            📁 Categories
          </h3>

          <form onSubmit={handleAddCategory} className="space-y-4 mb-6">
            <div className="flex flex-col">
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Category Name</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={e => {
                  setNewCatName(e.target.value);
                  setNewCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
                className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                placeholder="e.g., Beverages"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Slug</label>
              <input
                type="text"
                required
                value={newCatSlug}
                onChange={e => setNewCatSlug(e.target.value)}
                className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                placeholder="e.g., beverages"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-all focus:outline-none disabled:opacity-50"
            >
              Add Category +
            </button>
          </form>

          {/* list categories */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {categories.length === 0 ? (
              <p className="text-slate-500 text-sm italic">No categories created yet.</p>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-950/50 border border-slate-900 rounded-xl text-slate-300">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span className="text-xs bg-slate-900 text-slate-500 px-2 py-0.5 rounded-md font-mono">/{cat.slug}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* middle & right: products hub */}
        <div className="lg:col-span-2 space-y-8">
          {/* Add Product Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              🛍️ Add Product
            </h3>
            
            {categories.length === 0 ? (
              <div className="bg-amber-950/30 border border-amber-900/50 p-4 rounded-xl text-amber-400 text-sm flex gap-2 items-center">
                <span>⚠️ Create at least one Category first before adding products!</span>
              </div>
            ) : (
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={e => setNewProdName(e.target.value)}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                    placeholder="e.g., Ghana Fresh Eggs"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={newProdCatId}
                    onChange={e => setNewProdCatId(e.target.value)}
                    className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    rows={2}
                    value={newProdDesc}
                    onChange={e => setNewProdDesc(e.target.value)}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm resize-none"
                    placeholder="Describe item benefits, weights, sizes..."
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Price ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Stock Count</label>
                  <input
                    type="number"
                    required
                    value={newProdStock}
                    onChange={e => setNewProdStock(e.target.value)}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                    placeholder="10"
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Image URL (Optional)</label>
                  <input
                    type="text"
                    value={newProdImg}
                    onChange={e => setNewProdImg(e.target.value)}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                    placeholder="e.g., https://example.com/eggs.jpg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="md:col-span-2 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-50 font-bold rounded-xl shadow-md transition-all text-sm focus:outline-none mt-2"
                >
                  Create Product +
                </button>
              </form>
            )}
          </div>

          {/* Product list with low-stock warnings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              📋 Active Catalog Inventory ({products.length})
            </h3>

            <div className="space-y-4">
              {products.length === 0 ? (
                <p className="text-slate-500 italic text-center py-6">Your inventory is empty. Add products above.</p>
              ) : (
                products.map(p => {
                  const isLowStock = p.stock_quantity < 5;
                  return (
                    <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-colors gap-4">
                      <div className="flex items-center gap-4">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded-xl border border-slate-800" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-900 flex items-center justify-center rounded-xl border border-slate-800 text-xl">
                            📦
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-slate-200 text-sm md:text-base">{p.name}</h4>
                          <span className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.description || 'No description provided'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-100 font-bold text-sm md:text-base">
                            {currencySymbol}{p.price.toFixed(2)}
                          </span>
                        </div>

                        {/* Stock status & warnings */}
                        <div className="flex items-center gap-2">
                          {isLowStock ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-900/50 text-amber-400 font-bold text-[10px] uppercase tracking-wide animate-pulse">
                              Low Stock: {p.stock_quantity} Left
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-900/30 text-emerald-400 text-[10px] font-medium uppercase tracking-wide">
                              Qty: {p.stock_quantity}
                            </span>
                          )}
                        </div>

                        {/* Toggle active state */}
                        <button
                          onClick={() => toggleAvailability(p.id, p.is_available)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                            p.is_available 
                              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {p.is_available ? 'Available' : 'Hidden'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
