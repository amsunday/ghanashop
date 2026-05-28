import React from 'react';
import { generateReviewShoutoutMessage, createWhatsAppDeepLink } from '../lib/templates';

interface Feedback {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ShopDetails {
  shop_name: string;
  currency_symbol: string;
  momo_network: string;
  momo_name: string;
  momo_number: string;
  contact_phone: string;
}

interface FeedbackStreamProps {
  feedbacks: Feedback[];
  shopDetails: ShopDetails;
}

export default function FeedbackStream({ feedbacks, shopDetails }: FeedbackStreamProps) {
  
  // Calculate average rating
  const totalReviews = feedbacks.length;
  const averageRating = totalReviews > 0
    ? feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
    : 5.0;

  // Handle generating shareable status deep link
  const handleShareToStatus = (feedback: Feedback) => {
    const statusMessage = generateReviewShoutoutMessage(shopDetails, {
      customer_name: feedback.customer_name,
      rating: feedback.rating,
      comment: feedback.comment,
      average_rating: averageRating
    });

    // Generate link to WhatsApp using the merchant's own phone or copyable
    const deepLink = createWhatsAppDeepLink(shopDetails.contact_phone, statusMessage);
    window.open(deepLink, '_blank');
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5 text-amber-400">
        {'★'.repeat(rating)}
        <span className="text-slate-700">{'★'.repeat(5 - rating)}</span>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Aggregation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            ⭐ Customer Loyalty Reviews
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Display your customer satisfaction scores and share positive testimonials directly to your WhatsApp Status.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl px-6 py-4 flex flex-col items-center justify-center shrink-0 min-w-[140px]">
          <span className="text-3xl font-extrabold text-slate-50 font-mono">
            {averageRating.toFixed(1)}
          </span>
          <div className="mt-1">{renderStars(Math.round(averageRating))}</div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1.5 font-bold">
            {totalReviews} Total Reviews
          </span>
        </div>
      </div>

      {/* Review Feeds List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feedbacks.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-slate-900/30 border border-slate-800/80 rounded-2xl text-slate-500 italic select-none">
            No feedback comments have been submitted yet. Checkouts with ordering will show review triggers!
          </div>
        ) : (
          feedbacks.map(f => (
            <div key={f.id} className="bg-slate-900 border border-slate-850 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm md:text-base">{f.customer_name}</h4>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {renderStars(f.rating)}
                </div>

                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-950 text-slate-300 text-xs md:text-sm italic leading-relaxed">
                  "{f.comment}"
                </div>
              </div>

              {/* Share actions */}
              <div className="pt-2 flex justify-between items-center gap-4">
                <span className="text-[10px] text-slate-500 font-mono select-none">ID: {f.id.slice(0, 6).toUpperCase()}</span>
                {f.rating >= 4 && (
                  <button
                    onClick={() => handleShareToStatus(f)}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-50 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 active:scale-[0.98]"
                  >
                    <span>📣 Share Review to Status</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
