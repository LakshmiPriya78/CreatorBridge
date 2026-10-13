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
  Building,
} from 'lucide-react';

interface AgencyInvitationsProps {
  onNavigate: (view: string) => void;
}

export const AgencyInvitations: React.FC<AgencyInvitationsProps> = ({ onNavigate }) => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
  const [negotiationHistory, setNegotiationHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Counter modal
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterPrice, setCounterPrice] = useState(0);
  const [counterDeadline, setCounterDeadline] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

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
      setCounterPrice(data.invitation.proposed_budget_inr);
      setCounterDeadline(data.invitation.deadline);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptCreatorTerms = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await api.agencyRespondInvitation(selectedId, { action: 'accept_changes' });
      await loadDetail(selectedId);
      await loadInvitations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!selectedId || !confirm('Close this invitation negotiation?')) return;
    setActionLoading(true);
    try {
      await api.agencyRespondInvitation(selectedId, { action: 'close' });
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
      await api.agencyRespondInvitation(selectedId, {
        action: 'counter',
        proposedPriceInr: counterPrice,
        proposedDeadline: counterDeadline,
        message: counterMessage,
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
      onNavigate('agency-projects');
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
        <h1 className="text-xl font-bold text-slate-950">Campaign Invitations & Proposal Negotiations</h1>
        <p className="text-xs text-slate-500">
          Track project briefs sent to creators, negotiate terms in real time, and confirm projects.
        </p>
      </div>

      {invitations.length === 0 ? (
        <EmptyState
          title="No invitations sent yet"
          description="Find published creators in Discovery and send project briefs to begin campaigns."
          actionLabel="Find Creators"
          onAction={() => onNavigate('agency-discovery')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Invitations List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs max-h-[700px] overflow-y-auto space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
              Sent Briefs ({invitations.length})
            </span>
            {invitations.map((inv) => {
              const isSelected = selectedId === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => loadDetail(inv.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-100 border-slate-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Creator: {inv.creator_name}
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

          {/* Active Detail & Negotiation Workspace */}
          {selectedInvitation ? (
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Creator: {selectedInvitation.creator_name}
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

              {/* Overview Cards */}
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

              {/* Requirements */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Product Description</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    {selectedInvitation.product_description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Creative Requirements</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                    {selectedInvitation.creative_requirements}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Agreed Deliverables</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                    {selectedInvitation.deliverables}
                  </p>
                </div>
              </div>

              {/* Negotiation Log */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                  Negotiation & Proposals History
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {negotiationHistory.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-800 uppercase">
                          {item.sender_role === 'agency' ? 'You (Agency)' : `Creator (${selectedInvitation.creator_name})`} · {item.action_type}
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

              {/* Action Controls for Agency */}
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

                {selectedInvitation.status === 'Changes Proposed' && (
                  <>
                    <button
                      onClick={handleClose}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg"
                    >
                      Close Negotiation
                    </button>
                    <button
                      onClick={() => setShowCounterModal(true)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Counter-Offer</span>
                    </button>
                    <button
                      onClick={handleAcceptCreatorTerms}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Accept Creator's Changes</span>
                    </button>
                  </>
                )}

                {selectedInvitation.status === 'Pending Creator Response' && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 italic">Brief delivered to creator. Awaiting creator review.</span>
                    <button
                      onClick={handleClose}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Cancel Brief
                    </button>
                  </div>
                )}

                {selectedInvitation.status === 'Project Confirmed' && (
                  <button
                    onClick={() => onNavigate('agency-projects')}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <span>Go to Confirmed Campaign Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* MODAL: Agency Counter */}
      {showCounterModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-950">Counter-Offer to Creator</h3>

            <form onSubmit={handleCounterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Counter Budget in INR (₹) *</label>
                <input
                  type="number"
                  required
                  min={500}
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Counter Deadline *</label>
                <input
                  type="date"
                  required
                  value={counterDeadline}
                  onChange={(e) => setCounterDeadline(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Message to Creator *</label>
                <textarea
                  rows={2}
                  required
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Explain why this budget/timeline fits the campaign..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCounterModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-md"
                >
                  Send Counter-Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
