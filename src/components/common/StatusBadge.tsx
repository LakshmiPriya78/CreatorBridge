import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = (s: string) => {
    switch (s) {
      case 'Confirmed':
      case 'Accepted':
      case 'Approved':
      case 'Completed':
      case 'Payment Completed':
      case 'Verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
      case 'Submitted':
      case 'Resubmitted':
      case 'Payment Initiated':
      case 'Awaiting Confirmation':
      case 'Pending Creator Response':
      case 'Changes Proposed':
      case 'Counterproposal Pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Revision Requested':
      case 'Payment Due':
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Declined':
      case 'Closed':
      case 'Cancelled':
      case 'Payment Disputed':
      case 'Needs Changes':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium border rounded-md ${getStyle(
        status
      )}`}
    >
      {status}
    </span>
  );
};
