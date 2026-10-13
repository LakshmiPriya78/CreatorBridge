import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Star,
} from 'lucide-react';

interface AgencyProjectsProps {
  onNavigate: (view: string) => void;
}

export const AgencyProjects: React.FC<AgencyProjectsProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [paymentRecord, setPaymentRecord] = useState<any>(null);
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Revision modal
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  useEffect(() => {
    loadProjects();

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (
        detail &&
        (detail.type === 'PAYMENT_COMPLETED' ||
          detail.type === 'DELIVERABLE_SUBMITTED' ||
          detail.type === 'PROJECT_STATUS_UPDATE' ||
          detail.type === 'REVIEW_RECEIVED')
      ) {
        loadProjects();
        if (selectedId) {
          loadDetail(selectedId);
        }
      }
    };

    window.addEventListener('creatorbridge:event', handleSync);
    return () => {
      window.removeEventListener('creatorbridge:event', handleSync);
    };
  }, [selectedId]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await api.listProjects();
      setProjects(data);
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
      const data = await api.getProject(id);
      setSelectedProject(data.project);
      setDeliverables(data.deliverables);
      setPaymentRecord(data.paymentRecord);
      setReview(data.review);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async () => {
    if (!selectedId || !confirm('Approve these deliverables as final? This will transition the project to payment transfer.')) return;
    setActionLoading(true);
    try {
      const res = await api.approveDeliverable(selectedId);
      alert(res.message);
      await loadDetail(selectedId);
      await loadProjects();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setActionLoading(true);
    try {
      const res = await api.requestRevision(selectedId, revisionNotes);
      alert(res.message);
      setShowRevisionModal(false);
      setRevisionNotes('');
      await loadDetail(selectedId);
      await loadProjects();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">Loading campaigns...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-950">Active Commercial Campaign Workspaces</h1>
        <p className="text-xs text-slate-500">
          Review delivered media assets, request revisions under the agreed scope, and execute payment transfers.
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No confirmed projects yet"
          description="Projects appear here once you and the creator mutually confirm an invitation agreement."
          actionLabel="View Briefs & Negotiations"
          onAction={() => onNavigate('agency-invitations')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs max-h-[700px] overflow-y-auto space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
              All Campaigns ({projects.length})
            </span>
            {projects.map((proj) => {
              const isSelected = selectedId === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => loadDetail(proj.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-100 border-slate-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Creator: {proj.creator_name}
                    </span>
                    <StatusBadge status={proj.status} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-950 line-clamp-1">{proj.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="font-semibold text-slate-900">
                      ₹{proj.agreed_price_inr.toLocaleString('en-IN')}
                    </span>
                    <span>Deadline: {proj.agreed_deadline}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Project Details Workspace */}
          {selectedProject ? (
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Creator: {selectedProject.creator_name}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{selectedProject.project_type}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-950 mt-0.5">{selectedProject.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedProject.status} />
                </div>
              </div>

              {/* Status Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Agreed Contract Value</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{selectedProject.agreed_price_inr.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Agreed Deadline</span>
                  <span className="text-sm font-bold text-slate-900">{selectedProject.agreed_deadline}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Direct Bank Transfer</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">
                    {paymentRecord?.status || 'Payment Due'}
                  </span>
                </div>
              </div>

              {/* Agreed Specifications */}
              <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="font-semibold text-slate-900">Agreed Deliverables:</span>{' '}
                  <span className="text-slate-700">{selectedProject.agreed_deliverables}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Payment Terms:</span>{' '}
                  <span className="text-slate-700">{selectedProject.payment_terms}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Licensing Rights:</span>{' '}
                  <span className="text-slate-700">{selectedProject.usage_licensing_terms}</span>
                </div>
              </div>

              {/* Deliverable Submissions Review */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                  Submitted Deliverables & Assets ({deliverables.length})
                </h3>

                {deliverables.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                    The creator has not submitted deliverables yet. You will be notified in real time when files are uploaded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deliverables.map((del) => (
                      <div key={del.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">
                              Version {del.version_number}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(del.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <StatusBadge status={del.status} />
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed">
                          <span className="font-semibold text-slate-900">Creator Notes:</span> {del.submission_notes}
                        </p>

                        {del.file_urls && del.file_urls.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {del.file_urls.map((url: string, idx: number) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline bg-indigo-50/50 px-2.5 py-1 rounded border border-indigo-100"
                              >
                                <span>Download/View Asset {idx + 1}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        )}

                        {del.status === 'Revision Requested' && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 mt-2">
                            <span className="font-bold block mb-1">Your Revision Instructions:</span>
                            {del.revision_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons for Agency */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {['Submitted', 'Resubmitted'].includes(selectedProject.status) && (
                    <>
                      <button
                        onClick={() => setShowRevisionModal(true)}
                        disabled={actionLoading}
                        className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Request Revisions</span>
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve Deliverables</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Direct Bank Transfer & Review links */}
                <div className="flex items-center gap-3">
                  {['Approved', 'Completed'].includes(selectedProject.status) && (
                    <button
                      onClick={() => onNavigate('agency-payments')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Execute Bank Transfer</span>
                    </button>
                  )}

                  {selectedProject.status === 'Completed' && !review && (
                    <button
                      onClick={() => onNavigate('agency-reviews')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Leave Review</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* MODAL: Request Revision */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-950">Request Deliverable Revision</h3>
            <p className="text-xs text-slate-500">
              Provide specific, constructive instructions covered under the original project agreement.
            </p>

            <form onSubmit={handleRevisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Clear Revision Instructions *</label>
                <textarea
                  rows={4}
                  required
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Specify required scene adjustments, audio adjustments, color grading, or pacing..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-md"
                >
                  Send Revision Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
