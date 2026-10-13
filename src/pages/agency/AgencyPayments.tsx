import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  DollarSign,
  CheckCircle,
  Clock,
  Lock,
  Search,
  ExternalLink,
  Upload,
  Building,
  ShieldCheck,
  X,
} from 'lucide-react';

interface AgencyPaymentsProps {
  onNavigate: (view: string) => void;
}

export const AgencyPayments: React.FC<AgencyPaymentsProps> = ({ onNavigate }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalPayments: 0,
    pendingPayments: 0,
    completedPayments: 0,
    awaitingReview: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Initiate bank transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [bankCoords, setBankCoords] = useState<any | null>(null);
  const [transferForm, setTransferForm] = useState({
    amountTransferredInr: 0,
    transferDate: new Date().toISOString().split('T')[0],
    transactionReference: '',
    receiptUrl: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  useEffect(() => {
    loadPayments();

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (
        detail &&
        (detail.type === 'PAYMENT_COMPLETED' ||
          detail.type === 'PAYMENT_INITIATED' ||
          detail.type === 'PAYMENT_DISPUTED')
      ) {
        if (detail.type === 'PAYMENT_COMPLETED' && (detail.payload?.projectId || detail.payload?.paymentId)) {
          // Immediately synchronize exact matching payment record
          setRecords((prev) =>
            prev.map((r) =>
              r.project_id === detail.payload?.projectId || r.id === detail.payload?.paymentId
                ? {
                    ...r,
                    status: 'Payment Completed',
                    creator_confirmation_date: detail.payload?.confirmedAt || new Date().toISOString(),
                  }
                : r
            )
          );
        }
        loadPayments();
      }
    };

    window.addEventListener('creatorbridge:event', handleSync);
    return () => {
      window.removeEventListener('creatorbridge:event', handleSync);
    };
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await api.getAgencyPaymentHistory();
      setRecords(data.records || []);
      setMetrics(data.metrics || { totalPayments: 0, pendingPayments: 0, completedPayments: 0, awaitingReview: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTransferModal = async (record: any) => {
    setSelectedProjectId(record.project_id);
    setTransferForm({
      amountTransferredInr: record.amount_inr,
      transferDate: new Date().toISOString().split('T')[0],
      transactionReference: '',
      receiptUrl: '',
      notes: '',
    });
    try {
      const details = await api.getProjectBankDetails(record.project_id);
      setBankCoords(details);
      setShowTransferModal(true);
    } catch (err: any) {
      alert(err.message || 'Creator bank coordinates not available.');
    }
  };

  const handleReceiptUpload = async (file: File) => {
    setUploadingReceipt(true);
    try {
      const res = await api.uploadFile(file);
      setTransferForm((prev) => ({ ...prev, receiptUrl: res.url }));
    } catch (err: any) {
      alert(err.message || 'Receipt upload failed');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setSubmitting(true);
    try {
      await api.initiatePayment(selectedProjectId, transferForm);
      alert('Direct bank transfer recorded! Creator has been notified to verify receipt.');
      setShowTransferModal(false);
      await loadPayments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.project_title?.toLowerCase().includes(search.toLowerCase()) ||
      r.creator_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.transaction_reference?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">Loading payment history...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-950">Option A: Direct Bank Transfers & History</h1>
        <p className="text-xs text-slate-500">
          CreatorBridge tracks verified payment records. View creator bank details for confirmed projects, execute your bank transfer, and record UTR references.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Project Commitments</span>
            <DollarSign className="w-4 h-4 text-slate-800" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{metrics.totalPayments.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Contract value across campaigns</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Completed Transfers</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{metrics.completedPayments.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed by creators</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Transfers</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{metrics.pendingPayments.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Due upon deliverable approval</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Awaiting Receipt Confirmation</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{metrics.awaitingReview.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Transferred, awaiting creator credit check</p>
        </div>
      </div>

      {/* Records Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaign, creator, or UTR..."
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
            description="When project agreements are mutually confirmed, direct bank transfer records are created automatically."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Campaign & Creator</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Transaction UTR</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900">{r.project_title}</div>
                      <div className="text-[11px] text-slate-500">Creator: {r.creator_name}</div>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      ₹{r.amount_inr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">{r.method}</td>
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
                        <span className="text-slate-400 italic">Transfer not initiated</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {r.status === 'Payment Due' && (
                        <button
                          onClick={() => handleOpenTransferModal(r)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
                        >
                          Execute Transfer
                        </button>
                      )}
                      {['Payment Initiated', 'Awaiting Confirmation'].includes(r.status) && (
                        <span className="text-[11px] text-blue-700 font-medium">
                          Awaiting Creator Receipt Check
                        </span>
                      )}
                      {r.status === 'Payment Completed' && (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Confirmed by Creator</span>
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

      {/* MODAL: Direct Bank Transfer Details & Record */}
      {showTransferModal && bankCoords && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Option A: Direct Bank Transfer
                </span>
                <h3 className="text-base font-bold text-slate-950 mt-0.5">
                  Execute Bank Transfer for "{bankCoords.projectTitle}"
                </h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="p-1.5 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Authorized Creator Banking Coordinates Card */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Authorized Creator Bank Coordinates</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                <div>
                  <span className="text-[11px] text-slate-500 block">Account Holder Name</span>
                  <span className="font-semibold text-slate-950">{bankCoords.accountHolderName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Bank Account Number</span>
                  <span className="font-mono font-semibold text-slate-950">{bankCoords.bankAccountNumber}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">IFSC Code</span>
                  <span className="font-mono font-semibold text-slate-950">{bankCoords.ifscCode}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Agreed Amount</span>
                  <span className="font-bold text-slate-950">₹{bankCoords.agreedAmountInr.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Step 1: Open your bank's portal (NEFT / IMPS / RTGS) and transfer the agreed amount to the coordinates above.
              <br />
              Step 2: Enter the transaction reference (UTR) below and submit to record the transfer.
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Amount Transferred (₹) *</label>
                  <input
                    type="number"
                    required
                    value={transferForm.amountTransferredInr}
                    onChange={(e) => setTransferForm({ ...transferForm, amountTransferredInr: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Transfer Date *</label>
                  <input
                    type="date"
                    required
                    value={transferForm.transferDate}
                    onChange={(e) => setTransferForm({ ...transferForm, transferDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Bank Transaction Reference (UTR / Ref No) *</label>
                <input
                  type="text"
                  required
                  value={transferForm.transactionReference}
                  onChange={(e) => setTransferForm({ ...transferForm, transactionReference: e.target.value })}
                  placeholder="e.g. UTR123456789012"
                  className="w-full px-3 py-2 border rounded-lg font-mono font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Upload Receipt / Payment Screenshot</label>
                <input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleReceiptUpload(e.target.files[0])}
                  className="w-full text-xs text-slate-500"
                />
                {transferForm.receiptUrl && (
                  <span className="text-[11px] text-emerald-600 block mt-1">Receipt uploaded</span>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes / Banking Comments</label>
                <textarea
                  rows={2}
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  placeholder="e.g. Transferred via HDFC Corporate Net Banking IMPS"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingReceipt}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm"
                >
                  {submitting ? 'Recording...' : 'Record Transfer & Notify Creator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
