import React, { useState } from 'react';
import { api } from '../../api/client';
import { X, Send, Sparkles, AlertCircle } from 'lucide-react';

interface SendInvitationModalProps {
  creator: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const SendInvitationModal: React.FC<SendInvitationModalProps> = ({
  creator,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    productName: '',
    productDescription: '',
    projectType: 'Video Advertisement',
    proposedBudgetInr: creator.minPrice || 15000,
    creativeRequirements: '',
    deliverables: '1x 4K Master Video (16:9), 2x Social Cuts (9:16), Master Audio',
    targetLocation: '',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    additionalInstructions: '',
    affiliatePermission: 'To be discussed' as 'Allowed' | 'Not allowed' | 'To be discussed',
    paymentTerms: '100% upon deliverable approval via Direct Bank Transfer',
    usageLicensingTerms: 'Full commercial digital advertising rights worldwide for 1 year',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.createInvitation({
        creatorId: creator.id || creator.userId,
        ...form,
        proposedBudgetInr: Number(form.proposedBudgetInr),
      });
      alert('Project invitation successfully sent to creator!');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 my-8">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
              Commercial Campaign Brief
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-950 mt-0.5">
              Send Project Brief to {creator.fullName || creator.full_name}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Product / Brand Name *</label>
              <input
                type="text"
                required
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                placeholder="e.g. Aura Botanics Luxury Serum"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Project Type *</label>
              <select
                value={form.projectType}
                onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="Video Advertisement">Video Advertisement</option>
                <option value="Poster">Poster / Print AI Graphic</option>
                <option value="Promotional Image">Promotional Image</option>
                <option value="Banner">Social Banner Set</option>
                <option value="Other">Other Content Format</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Product Description & Campaign Goal *</label>
            <textarea
              rows={2}
              required
              value={form.productDescription}
              onChange={(e) => setForm({ ...form, productDescription: e.target.value })}
              placeholder="Explain product details, unique selling proposition, target audience..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Proposed Budget in INR (₹) *</label>
              <input
                type="number"
                required
                min={500}
                value={form.proposedBudgetInr}
                onChange={(e) => setForm({ ...form, proposedBudgetInr: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Deadline Date *</label>
              <input
                type="date"
                required
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Creative Requirements & Visual Style *</label>
            <textarea
              rows={2}
              required
              value={form.creativeRequirements}
              onChange={(e) => setForm({ ...form, creativeRequirements: e.target.value })}
              placeholder="e.g. Ultra-realistic cinematic camera motions, soft natural daylight, luxury aesthetic, no morphing artifacts"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Required Deliverables *</label>
            <input
              type="text"
              required
              value={form.deliverables}
              onChange={(e) => setForm({ ...form, deliverables: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Affiliate Linking Permission</label>
              <select
                value={form.affiliatePermission}
                onChange={(e) => setForm({ ...form, affiliatePermission: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="Allowed">Allowed</option>
                <option value="Not allowed">Not allowed</option>
                <option value="To be discussed">To be discussed</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Target Filming Location / Region</label>
              <input
                type="text"
                value={form.targetLocation}
                onChange={(e) => setForm({ ...form, targetLocation: e.target.value })}
                placeholder="e.g. Pan-India or Remote"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Payment Terms</label>
              <input
                type="text"
                value={form.paymentTerms}
                onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Usage & Licensing Rights</label>
              <input
                type="text"
                value={form.usageLicensingTerms}
                onChange={(e) => setForm({ ...form, usageLicensingTerms: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Additional Instructions / Brief Notes</label>
            <textarea
              rows={2}
              value={form.additionalInstructions}
              onChange={(e) => setForm({ ...form, additionalInstructions: e.target.value })}
              placeholder="Any specific brand guidelines, font requirements, or aspect ratios..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Sending Brief...' : 'Send Commercial Brief'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
