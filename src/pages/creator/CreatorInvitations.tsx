import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CreatorInvitationsProps {
  onNavigate: (view: string) => void;
}

export const CreatorInvitations: React.FC<CreatorInvitationsProps> = ({ onNavigate }) => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [negotiationHistory, setNegotiationHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Counter proposal form state
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterForm, setCounterForm] = useState({
    proposedPriceInr: 0,
    proposedDeadline: '',
    proposedDeliverables: '',
    proposedAffiliatePermission: 'To be discussed',
    proposedPaymentTerms: '',
    message: '',
  });

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const data = await api.listInvitations();
      setInvitations(data);
      if (data.length > 0 && !selectedId) {
        loadDetail(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setSelectedId(id);
    try {
      const data = await api.getInvitation(id);
      setSelectedInvitation(data.invitation);
      setNegotiationHistory(data.negotiationHistory);
      setCounterForm({
        proposedPriceInr: data.invitation.proposed_budget_inr,
        proposedDeadline: data.invitation.deadline,
        proposedDeliverables: data.invitation.deliverables,
        proposedAffiliatePermission: data.invitation.affiliate_permission,
        proposedPaymentTerms: data.invitation.payment_terms,
        message: '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await api.creatorRespondInvitation(selectedId, { action: 'accept' });
      await loadDetail(selectedId);
      await loadInvitations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedId || !confirm('Are you sure you want to decline this project brief?')) return;
    setActionLoading(true);
    try {
      await api.creatorRespondInvitation(selectedId, { action: 'decline' });
      await loadDetail(selectedId);
      await loadInvitations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await api.creatorRespondInvitation(selectedId, {
        action: 'propose_changes',
        ...counterForm,
      });
      setShowCounterModal(false);
      await loadDetail(selectedId);
      await loadInvitations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmProject = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      const res = await api.confirmProject(selectedId);
      alert(res.message);
      onNavigate('creator-projects');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">Loading invitations...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-950">Commercial Project Invitations</h1>
        <p className="text-xs text-slate-500">
          Review incoming campaign briefs, negotiate deliverables and budget, and confirm binding project agreements.
        </p>
      </div>

      {invitations.length === 0 ? (
        <EmptyState
          title="No invitations received"
          description="When advertising agencies find your published portfolio in Discovery, their briefs and direct invitations will appear here."
          actionLabel="View Portfolio Setup"
          onAction={() => onNavigate('creator-portfolio')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Invitations List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs max-h-[700px] overflow-y-auto space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
              All Invitations ({invitations.length})
            </span>
            {invitations.map((inv) => {
              const isSelected = selectedId === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => loadDetail(inv.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      {inv.company_brand_name || inv.agency_name}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-950 line-clamp-1">{inv.product_name}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="font-semibold text-slate-900">
                      ₹{inv.proposed_budget_inr.toLocaleString('en-IN')}
                    </span>
                    <span>Deadline: {inv.deadline}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Invitation & Negotiation Workspace */}
          {selectedInvitation ? (
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header with status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-600">
                      {selectedInvitation.company_brand_name || selectedInvitation.agency_name}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{selectedInvitation.project_type}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-950 mt-0.5">{selectedInvitation.product_name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedInvitation.status} />
                </div>
              </div>

              {/* Brief Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Proposed Budget</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{selectedInvitation.proposed_budget_inr.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Delivery Deadline</span>
                  <span className="text-sm font-bold text-slate-900">{selectedInvitation.deadline}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Affiliate Permission</span>
                  <span className="text-sm font-bold text-slate-900">{selectedInvitation.affiliate_permission}</span>
                </div>
              </div>

              {/* Detailed Project Scope */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Product & Campaign Description</h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedInvitation.product_description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Creative Requirements & Visual Style</h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedInvitation.creative_requirements}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Agreed Deliverables & Formats</h4>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                    {selectedInvitation.deliverables}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Payment Terms</h4>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {selectedInvitation.payment_terms}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Commercial Usage & Licensing Rights</h4>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {selectedInvitation.usage_licensing_terms}
                    </p>
                  </div>
                </div>
              </div>

              {/* Negotiation & Agreement History Log */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                  Negotiation & Proposal History
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {negotiationHistory.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-800 uppercase">
                          {item.sender_role === 'creator' ? 'You (Creator)' : 'Agency/Brand'} · {item.action_type}
                        </span>
                        <span className="text-slate-400">
                          {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-slate-600">{item.message}</p>
                      {item.proposed_price_inr && (
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-700 font-medium">
                          <span>Price: ₹{item.proposed_price_inr.toLocaleString('en-IN')}</span>
                          <span>·</span>
                          <span>Deadline: {item.proposed_deadline}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Controls for Creator */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                {selectedInvitation.status === 'Accepted' && (
                  <button
                    onClick={handleConfirmProject}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Project & Activate Workspace</span>
                  </button>
                )}

                {['Pending Creator Response', 'Counterproposal Pending'].includes(selectedInvitation.status) && (
                  <>
                    <button
                      onClick={handleDecline}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-slate-300 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Decline Brief
                    </button>
                    <button
                      onClick={() => setShowCounterModal(true)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Propose Changes</span>
                    </button>
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Accept Invitation Terms</span>
                    </button>
                  </>
                )}

                {selectedInvitation.status === 'Changes Proposed' && (
                  <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Your proposed changes were sent. Awaiting response from agency.</span>
                  </span>
                )}

                {selectedInvitation.status === 'Project Confirmed' && (
                  <button
                    onClick={() => onNavigate('creator-projects')}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <span>Open Confirmed Project Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* MODAL: Propose Changes / Counter */}
      {showCounterModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-slate-950">Propose Adjusted Terms to Agency</h3>
            <p className="text-xs text-slate-500">
              Counter-propose price, turnaround deadline, deliverables scope, or affiliate linking conditions.
            </p>

            <form onSubmit={handleCounterSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Your Counter Price (INR ₹) *</label>
                  <input
                    type="number"
                    required
                    min={500}
                    value={counterForm.proposedPriceInr}
                    onChange={(e) => setCounterForm({ ...counterForm, proposedPriceInr: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Target Deadline Date *</label>
                  <input
                    type="date"
                    required
                    value={counterForm.proposedDeadline}
                    onChange={(e) => setCounterForm({ ...counterForm, proposedDeadline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Deliverables & Scope Proposal *</label>
                <textarea
                  rows={2}
                  required
                  value={counterForm.proposedDeliverables}
                  onChange={(e) => setCounterForm({ ...counterForm, proposedDeliverables: e.target.value })}
                  placeholder="Specify exact deliverables included at this price point"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Affiliate Linking Permission</label>
                <select
                  value={counterForm.proposedAffiliatePermission}
                  onChange={(e) => setCounterForm({ ...counterForm, proposedAffiliatePermission: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="Allowed">Allowed</option>
                  <option value="Not allowed">Not allowed</option>
                  <option value="To be discussed">To be discussed</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Note to Agency *</label>
                <textarea
                  rows={2}
                  required
                  value={counterForm.message}
                  onChange={(e) => setCounterForm({ ...counterForm, message: e.target.value })}
                  placeholder="Explain your proposal adjustments..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCounterModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg"
                >
                  Send Proposal to Agency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
