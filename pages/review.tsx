import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function PublicReviewPage() {
  const router = useRouter();
  
  // Extract order_id and shop_id from url query parameters
  const { order: orderId, shop: shopId } = router.query;

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Submit feedback
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !comment) {
      setErrorMsg('Please enter your name and comments!');
      return;
    }

    // Default shop_id target if not provided (mock anchor)
    const targetShopId = shopId || '00000000-0000-0000-0000-000000000000';
    const targetOrderId = orderId || null;

    try {
      setLoading(true);
      setErrorMsg('');

      const { error } = await supabase
        .from('feedbacks')
        .insert({
          shop_id: targetShopId,
          order_id: targetOrderId,
          customer_name: customerName,
          rating: rating,
          comment: comment
        });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setErrorMsg('Failed to submit: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 font-sans">
      <Head>
        <title>Submit Feedback | Local Storefront</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Outfit', sans-serif;
          }
        `}</style>
      </Head>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
        {success ? (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-950 border border-emerald-900 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto shadow-md shadow-emerald-900/10">
              🎉
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Review Submitted!</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Thank you for sharing your support! Your feedback helps us improve and serve you better. 🙏✨
            </p>
            <div className="pt-4">
              <button
                onClick={() => window.close()}
                className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-all focus:outline-none"
              >
                Close Page
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-3xl">⭐</span>
              <h2 className="text-2xl font-bold text-slate-100">Share Your Experience</h2>
              <p className="text-slate-400 text-xs">
                Submit a quick passwordless review in 10 seconds. No account registration needed.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-300 text-xs text-center font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Customer Name */}
              <div className="flex flex-col">
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Your Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  placeholder="e.g., Ama Serwaa"
                />
              </div>

              {/* Star Rating Selection */}
              <div className="flex flex-col items-center py-2 border-y border-slate-800/60 my-4">
                <label className="text-slate-400 text-xs font-medium mb-2.5">Tap to Rate</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      className="focus:outline-none hover:scale-110 transition-transform"
                    >
                      <span className={`text-4xl select-none ${
                        star <= rating ? 'text-amber-400' : 'text-slate-700'
                      }`}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2.5">
                  {rating} out of 5 Stars
                </span>
              </div>

              {/* Comments Text */}
              <div className="flex flex-col">
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Review Comment</label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors text-sm resize-none"
                  placeholder="Tell us what you liked (quality, speed, delivery, friendly Service)..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-50 font-bold rounded-xl shadow-lg transition-all focus:outline-none text-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Submitting review...' : 'Submit Feedback ⭐'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
