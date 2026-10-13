import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface CreatorEarningsProps {
  onNavigate: (view: string) => void;
}

export const CreatorEarnings: React.FC<CreatorEarningsProps> = ({ onNavigate }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalReceived: 0,
    paymentsReceivedCount: 0,
    pendingPayments: 0,
    overduePayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm receipt modal & alert
  const [confirmingRecord, setConfirmingRecord] = useState<any | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dispute modal
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputingProjectId, setDisputingProjectId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    loadEarnings();

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (
        detail &&
        (detail.type === 'PAYMENT_INITIATED' ||
          detail.type === 'PAYMENT_COMPLETED' ||
          detail.type === 'PAYMENT_DISPUTED')
      ) {
        loadEarnings();
      }
    };

    window.addEventListener('creatorbridge:event', handleSync);
    return () => {
      window.removeEventListener('creatorbridge:event', handleSync);
    };
  }, []);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const data = await api.getCreatorEarnings();
      setRecords(data.records || []);
      setMetrics(data.metrics || { totalReceived: 0, paymentsReceivedCount: 0, pendingPayments: 0, overduePayments: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (record: any) => {
    setActionLoading(true);
    setToast(null);
    try {
      const targetId = record.project_id || record.id;
      const res = await api.confirmPaymentReceipt(targetId);
      setConfirmingRecord(null);
      setToast({ type: 'success', message: res.message || 'Payment confirmed as received!' });
      await loadEarnings();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to confirm receipt.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputingProjectId) return;
    setActionLoading(true);
    setToast(null);
    try {
      const res = await api.disputePayment(disputingProjectId, disputeReason);
      setToast({ type: 'success', message: res.message || 'Dispute submitted.' });
      setShowDisputeModal(false);
      setDisputeReason('');
      await loadEarnings();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to submit dispute.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.project_title?.toLowerCase().includes(search.toLowerCase()) ||
      r.agency_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.transaction_reference?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">Loading earnings metrics...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-950">Creator Earnings & Direct Bank Transfers</h1>
        <p className="text-xs text-slate-500">
          Transparent financial tracking. Option A Direct Bank Transfer: verify credits and confirm receipts.
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Confirmed Received</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{metrics.totalReceived.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Confirmed bank transfers only
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Completed Payments</span>
            <CheckCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.paymentsReceivedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Verified transactions</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Transfers</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{metrics.pendingPayments.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Milestones & approvals</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Overdue Payments</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{metrics.overduePayments.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Past contract deadline</p>
        </div>
      </div>

      {/* Table & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project or agency..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Payment Due">Payment Due</option>
              <option value="Payment Initiated">Payment Initiated</option>
              <option value="Payment Completed">Payment Completed</option>
              <option value="Payment Disputed">Payment Disputed</option>
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState
            title="No payment records found"
            description="When projects are mutually agreed upon, their direct bank transfer records and milestones appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Project & Agency</th>
                  <th className="py-3 px-3">Agreed Amount</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Transfer Ref / UTR</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900">{r.project_title}</div>
                      <div className="text-[11px] text-slate-500">{r.company_brand_name || r.agency_name}</div>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      ₹{r.amount_inr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {r.method}
                    </td>
                    <td className="py-3.5 px-3">
                      {r.transaction_reference ? (
                        <div>
                          <span className="font-mono text-[11px] font-medium text-slate-900 block">
                            {r.transaction_reference}
                          </span>
                          {r.transfer_date && (
                            <span className="text-[10px] text-slate-400 block">Date: {r.transfer_date}</span>
                          )}
                          {r.receipt_url && (
                            <a
                              href={r.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-600 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                            >
                              <span>View Receipt</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending transfer</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      {['Payment Initiated', 'Awaiting Confirmation'].includes(r.status) && (
                        <>
                          <button
                            onClick={() => setConfirmingRecord(r)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
                          >
                            Confirm Receipt
                          </button>
                          <button
                            onClick={() => {
                              setDisputingProjectId(r.project_id);
                              setShowDisputeModal(true);
                            }}
                            className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded text-xs font-medium cursor-pointer"
                          >
                            Dispute
                          </button>
                        </>
                      )}
                      {r.status === 'Payment Completed' && (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Credited & Verified</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Receipt Modal */}
      {confirmingRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-950">Confirm Payment Receipt</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please verify that <strong className="text-slate-900">₹{confirmingRecord.amount_inr?.toLocaleString('en-IN')}</strong> has been credited to your bank account for project <strong className="text-slate-900">"{confirmingRecord.project_title}"</strong>.
            </p>
            {confirmingRecord.transaction_reference && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="text-[11px] text-slate-500">Transaction Reference / UTR:</div>
                <div className="font-mono font-bold text-slate-900">{confirmingRecord.transaction_reference}</div>
                {confirmingRecord.transfer_date && (
                  <div className="text-[10px] text-slate-400">Transfer Date: {confirmingRecord.transfer_date}</div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmingRecord(null)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReceipt(confirmingRecord)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-xs cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Confirming...' : 'Yes, Confirm Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-950">Report Payment Issue or Dispute</h3>
            <p className="text-xs text-slate-500">
              If the transaction reference is invalid or funds have not reached your bank account, record your dispute reason.
            </p>

            <form onSubmit={handleDisputeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Dispute Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="e.g. Bank statement checked on 12th Oct, transaction UTR not reflected in account balance."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-rose-600 text-white font-semibold rounded-md"
                >
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
