import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Building,
  Compass,
  FolderKanban,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

interface AgencyDashboardProps {
  onNavigate: (view: string) => void;
}

export const AgencyDashboard: React.FC<AgencyDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    pendingInvitations: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalSpentInr: 0,
    pendingPaymentsInr: 0,
  });
  const [invitations, setInvitations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, invRes, projRes, profRes] = await Promise.all([
          api.getAgencyDashboardStats(),
          api.listInvitations(),
          api.listProjects(),
          api.getAgencyProfile().catch(() => null),
        ]);
        setStats(statsRes);
        setInvitations(invRes);
        setProjects(projRes);
        setProfile(profRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (
        detail &&
        (detail.type === 'PAYMENT_COMPLETED' ||
          detail.type === 'PAYMENT_INITIATED' ||
          detail.type === 'PROJECT_CONFIRMED' ||
          detail.type === 'PROJECT_STATUS_UPDATE' ||
          detail.type === 'DELIVERABLE_APPROVED' ||
          detail.type === 'REVIEW_RECEIVED')
      ) {
        loadData();
      }
    };

    window.addEventListener('creatorbridge:event', handleSync);
    return () => {
      window.removeEventListener('creatorbridge:event', handleSync);
    };
  }, []);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">Loading agency dashboard...</div>;
  }

  const isVerified = profile?.verification_status === 'Verified';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950">
              {profile?.company_brand_name || profile?.agency_name || 'Agency Workspace'}
            </h1>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border flex items-center gap-1 ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isVerified ? 'Verified Enterprise' : 'Verification Required'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {profile?.office_location || 'Office location not specified'} · Account Type:{' '}
            <span className="font-semibold">{profile?.account_type || 'Agency'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('agency-discovery')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Creators</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.activeProjects}</div>
          <p className="text-[11px] text-slate-500 mt-1">Commercial campaigns in production</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Briefs</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.pendingInvitations}</div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting creator response</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Paid (INR)</span>
            <DollarSign className="w-4 h-4 text-slate-800" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{Number(stats.totalSpentInr).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed direct bank transfers</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Payments</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{Number(stats.pendingPaymentsInr).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting milestone confirmation</p>
        </div>
      </div>

      {/* Two columns: Invitations & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invitations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-950">Campaign Invitations & Negotiations</h3>
              <p className="text-xs text-slate-500">Briefs and proposals sent to creators</p>
            </div>
            <button
              onClick={() => onNavigate('agency-invitations')}
              className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {invitations.length === 0 ? (
            <EmptyState
              title="No invitations sent yet"
              description="Browse published creator portfolios in Discovery and send your first commercial brief."
              actionLabel="Find Creators"
              onAction={() => onNavigate('agency-discovery')}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {invitations.slice(0, 4).map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-950 line-clamp-1">
                      {inv.product_name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      To: <span className="font-medium text-slate-700">{inv.creator_name}</span> · ₹{inv.proposed_budget_inr.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={inv.status} />
                    <button
                      onClick={() => onNavigate('agency-invitations')}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-medium cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmed Projects */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-950">Active Campaigns</h3>
              <p className="text-xs text-slate-500">Review deliverables and manage revisions</p>
            </div>
            <button
              onClick={() => onNavigate('agency-projects')}
              className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title="No active projects"
              description="Mutually accepted creator proposals transition into verified commercial project workspaces here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.slice(0, 4).map((proj) => (
                <div key={proj.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-950 line-clamp-1">
                      {proj.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Creator: <span className="font-medium text-slate-700">{proj.creator_name}</span> · Deadline: {proj.agreed_deadline}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={proj.status} />
                    <button
                      onClick={() => onNavigate('agency-projects')}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-medium cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
