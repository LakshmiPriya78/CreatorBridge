import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StarRating } from '../../components/common/StarRating';
import { EmptyState } from '../../components/common/EmptyState';
import { Star, ShieldAlert, Check } from 'lucide-react';

export const CreatorReviews: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [reportModalReviewId, setReportModalReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [user]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await api.getCreatorReviews(user!.id);
      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalReviewId) return;
    try {
      const res = await api.reportReview(reportModalReviewId, reportReason);
      alert(res.message);
      setReportModalReviewId(null);
      setReportReason('');
      await loadReviews();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">Loading reviews...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-950">Ratings, Feedback & Client Trust</h1>
        <p className="text-xs text-slate-500">
          Official project reviews from verified advertising agencies after completed direct bank transfer payment.
        </p>
      </div>

      {/* Rating Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xs">
        <div className="text-center sm:text-left sm:border-r sm:border-slate-200 sm:pr-8">
          <div className="text-4xl font-extrabold text-slate-950">
            {averageRating > 0 ? averageRating.toFixed(1) : 'Unrated'}
          </div>
          <div className="mt-1">
            <StarRating rating={averageRating} size="md" />
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {reviews.length} authentic project {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        <div className="text-xs text-slate-600 leading-relaxed max-w-xl">
          <span className="font-semibold text-slate-900 block mb-1">Authentic Rating Integrity Policy</span>
          CreatorBridge prohibits fake reviews and unverified accounts. Ratings are eligible only upon completed projects and verified payment confirmation.
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
          All Client Reviews ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <EmptyState
            title="No reviews received yet"
            description="When you complete commercial projects and payment is confirmed, sponsoring agencies leave their verified feedback here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-950">
                      {r.company_brand_name || r.agency_name}
                    </h4>
                    <span className="text-[11px] text-slate-500">Project: {r.project_title}</span>
                  </div>
                  <StarRating rating={r.rating} size="sm" />
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{r.feedback}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span>Delivery: {r.delivery_rating}/5</span>
                    <span>·</span>
                    <span>Communication: {r.communication_rating}/5</span>
                  </div>

                  {!r.is_reported ? (
                    <button
                      onClick={() => {
                        setReportModalReviewId(r.id);
                        setReportReason('');
                      }}
                      className="text-slate-400 hover:text-rose-600 text-[10px] cursor-pointer"
                    >
                      Report Abusive
                    </button>
                  ) : (
                    <span className="text-rose-600 text-[10px] font-medium flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Report Under Moderation</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportModalReviewId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-950">Report Review to Moderation</h3>
            <p className="text-xs text-slate-500">
              Provide a reason if this review violates CreatorBridge professional conduct or feedback policies.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Explain why this review is misleading or abusive..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setReportModalReviewId(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-600 text-white font-semibold rounded-md"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
