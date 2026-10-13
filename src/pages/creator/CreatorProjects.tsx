import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FolderKanban,
  Upload,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CreatorProjectsProps {
  onNavigate: (view: string) => void;
}

export const CreatorProjects: React.FC<CreatorProjectsProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [paymentRecord, setPaymentRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Deliverable submission form
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [fileUrlsStr, setFileUrlsStr] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

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
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartWork = async () => {
    if (!selectedId) return;
    try {
      await api.startProject(selectedId);
      await loadDetail(selectedId);
      await loadProjects();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    try {
      const fileUrls = fileUrlsStr.split('\n').map((u) => u.trim()).filter(Boolean);
      await api.submitDeliverable(selectedId, {
        submissionNotes,
        fileUrls: fileUrls.length > 0 ? fileUrls : ['/uploads/deliverables_v1.zip'],
      });
      setShowSubmitModal(false);
      setSubmissionNotes('');
      setFileUrlsStr('');
      await loadDetail(selectedId);
      await loadProjects();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">Loading project workspaces...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-950">Active Project Workspaces</h1>
        <p className="text-xs text-slate-500">
          Manage deliverables, review client revision feedback, and track milestones for confirmed projects.
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No confirmed projects yet"
          description="Projects appear here automatically once an invitation has been accepted by both parties."
          actionLabel="View Invitations"
          onAction={() => onNavigate('creator-invitations')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs max-h-[700px] overflow-y-auto space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
              All Projects ({projects.length})
            </span>
            {projects.map((proj) => {
              const isSelected = selectedId === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => loadDetail(proj.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      {proj.company_brand_name || proj.agency_name}
                    </span>
                    <StatusBadge status={proj.status} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-950 line-clamp-1">{proj.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span className="font-semibold text-slate-900">
                      ₹{proj.agreed_price_inr.toLocaleString('en-IN')}
                    </span>
                    <span>Due: {proj.agreed_deadline}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Project Details Workspace */}
          {selectedProject ? (
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-600">
                      {selectedProject.company_brand_name || selectedProject.agency_name}
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

              {/* Status & Contract Card */}
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
                  <span className="font-semibold text-slate-900">Affiliate Permission:</span>{' '}
                  <span className="text-slate-700">{selectedProject.affiliate_permission}</span>
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

              {/* Deliverable Submissions & Revision History */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider">
                    Deliverable Submissions ({deliverables.length})
                  </h3>
                  {['Confirmed', 'In Progress', 'Revision Requested'].includes(selectedProject.status) && (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit Deliverables</span>
                    </button>
                  )}
                </div>

                {deliverables.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                    No deliverables submitted yet.
                    {selectedProject.status === 'Confirmed' && (
                      <div className="mt-3">
                        <button
                          onClick={handleStartWork}
                          className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg"
                        >
                          Mark Project as In Progress
                        </button>
                      </div>
                    )}
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
                          <span className="font-semibold text-slate-900">Notes:</span> {del.submission_notes}
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
                                <span>Asset {idx + 1}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        )}

                        {del.status === 'Revision Requested' && del.revision_notes && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 mt-2">
                            <span className="font-bold block mb-1">Agency Revision Request:</span>
                            {del.revision_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Bank Transfer Tracker link */}
              {paymentRecord && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-600">
                    Direct Bank Transfer Status: <span className="font-semibold text-slate-900">{paymentRecord.status}</span>
                  </div>
                  <button
                    onClick={() => onNavigate('creator-payments')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Earnings & Bank Transfer Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* MODAL: Submit Deliverables */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-slate-950">Submit Deliverables</h3>
            <p className="text-xs text-slate-500">
              Provide your delivery assets, links, and detailed notes for the agency to review.
            </p>

            <form onSubmit={handleSubmitDeliverable} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Deliverable Asset URLs / File Paths (one per line) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={fileUrlsStr}
                  onChange={(e) => setFileUrlsStr(e.target.value)}
                  placeholder="https://drive.google.com/... or /uploads/video.mp4"
                  className="w-full px-3 py-2 border rounded-lg font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Submission Notes & Instructions *</label>
                <textarea
                  rows={3}
                  required
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Summarize the completed commercial assets, resolutions, formats, and notes on how the brief was met..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg"
                >
                  {submitting ? 'Submitting...' : 'Send Deliverables to Agency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
