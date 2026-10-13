import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, X, ExternalLink } from 'lucide-react';

interface ToastAlertProps {
  onNavigate: (view: string) => void;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({ onNavigate }) => {
  const { latestAlert, clearLatestAlert } = useNotifications();

  if (!latestAlert) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-xl p-4 shadow-2xl border border-slate-800 animate-slide-up flex items-start gap-3">
      <div className="p-2 bg-slate-800 rounded-lg text-emerald-400 shrink-0">
        <Bell className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-white tracking-tight">{latestAlert.title}</h4>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">{latestAlert.message}</p>
        {latestAlert.link && (
          <button
            onClick={() => {
              const path = latestAlert.link!.split('?')[0].replace('/', '');
              const viewMap: Record<string, string> = {
                'creator/invitations': 'creator-invitations',
                'agency/invitations': 'agency-invitations',
                'creator/projects': 'creator-projects',
                'agency/projects': 'agency-projects',
                'creator/payments': 'creator-payments',
                'agency/payments': 'agency-payments',
                'creator/reviews': 'creator-reviews',
                'agency/reviews': 'agency-reviews',
              };
              const target = viewMap[path];
              if (target) onNavigate(target);
              clearLatestAlert();
            }}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
          >
            <span>View Details</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
      <button
        onClick={clearLatestAlert}
        className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
