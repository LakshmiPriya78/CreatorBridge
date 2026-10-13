import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StarRating } from '../../components/common/StarRating';
import { EmptyState } from '../../components/common/EmptyState';
import { Star, CheckCircle, MessageSquare } from 'lucide-react';

export const AgencyReviews: React.FC = () => {
  const [completedProjects, setCompletedProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Review form
  const [rating, setRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryProjectId = urlParams.get('projectId') || undefined;
    loadCompletedProjects(queryProjectId);

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (
        detail &&
        (detail.type === 'PAYMENT_COMPLETED' ||
          detail.type === 'REVIEW_RECEIVED' ||
          detail.type === 'PROJECT_STATUS_UPDATE' ||
          detail.type === 'DELIVERABLE_APPROVED')
      ) {
        loadCompletedProjects(detail.payload?.projectId);
      }
    };

    window.addEventListener('creatorbridge:event', handleSync);
    return () => {
      window.removeEventListener('creatorbridge:event', handleSync);
    };
  }, []);

  const loadCompletedProjects = async (preferredProjectId?: string) => {
    setLoading(true);
    try {
      const projects = await api.listProjects();
      // Only projects where payment receipt is confirmed ('Payment Completed') AND not yet reviewed
      const eligible = projects.filter(
        (p) =>
          p.payment_status === 'Payment Completed' &&
          Boolean(p.payment_confirmed_at) &&
          (!p.review_count || Number(p.review_count) === 0)
      );
      setCompletedProjects(eligible);
      const targetId = preferredProjectId || selectedProjectId;
      if (targetId && eligible.some((p) => p.id === targetId)) {
        setSelectedProjectId(targetId);
      } else if (eligible.length > 0) {
        setSelectedProjectId(eligible[0].id);
      } else {
        setSelectedProjectId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setSubmitting(true);
    setToast(null);
    try {
      const res = await api.submitReview(selectedProjectId, {
        rating,
        deliveryRating,
        communicationRating,
        feedback,
      });
      setToast({ type: 'success', message: res.message || 'Review submitted successfully. Thank you for your feedback!' });
      setFeedback('');
      await loadCompletedProjects();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to submit review.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">Loading reviews workspace...</div>;
  }

  const selectedProj = completedProjects.find((p) => p.id === selectedProjectId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-950">Feedback & Creator Ratings</h1>
        <p className="text-xs text-slate-500">
          Leave verified feedback on completed campaigns. Ratings directly influence creator ranking in Discovery.
        </p>
      </div>

      {toast && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-2xs ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {completedProjects.length === 0 ? (
        <EmptyState
          title="No completed campaigns eligible for review"
          description="Once your active campaigns have approved deliverables and direct bank transfer is recorded and confirmed by the creator, you can leave official feedback here."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Projects Selector */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2 max-h-[600px] overflow-y-auto">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
              Eligible Campaigns ({completedProjects.length})
            </span>
            {completedProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedProjectId === p.id
                    ? 'bg-slate-100 border-slate-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-900">{p.creator_name}</span>
                  <span className="text-emerald-700 font-medium">{p.status}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-950 line-clamp-1">{p.title}</h4>
                <span className="text-[10px] text-slate-400 mt-1 block">Contract: ₹{p.agreed_price_inr.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          {/* Review Form */}
          {selectedProj ? (
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                  Official Project Feedback
                </span>
                <h2 className="text-base font-bold text-slate-950 mt-0.5">
                  Reviewing {selectedProj.creator_name} for "{selectedProj.title}"
                </h2>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-5 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-2">
                    Overall Campaign Rating (1 to 5 Stars) *
                  </label>
                  <StarRating
                    rating={rating}
                    interactive={true}
                    size="lg"
                    onChange={(val) => setRating(val)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 mb-2">
                      Delivery & Turnaround Experience *
                    </label>
                    <StarRating
                      rating={deliveryRating}
                      interactive={true}
                      size="md"
                      onChange={(val) => setDeliveryRating(val)}
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-2">
                      Communication & Professional Conduct *
                    </label>
                    <StarRating
                      rating={communicationRating}
                      interactive={true}
                      size="md"
                      onChange={(val) => setCommunicationRating(val)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Written Feedback & Recommendation *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Share specific details about the creator's AI workflow, prompt adherence, asset quality, and speed..."
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit Official Review'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
