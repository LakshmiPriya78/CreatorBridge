import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Sparkles,
  FolderKanban,
  FileText,
  DollarSign,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  AlertCircle,
} from 'lucide-react';
import type { ProfileCompletion } from '../../types';

interface CreatorDashboardProps {
  onNavigate: (view: string) => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [earningsMetrics, setEarningsMetrics] = useState<any>({ totalReceived: 0, paymentsReceivedCount: 0, pendingPayments: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prof, invs, projs, earn] = await Promise.all([
          api.getCreatorProfile(),
          api.listInvitations(),
          api.listProjects(),
          api.getCreatorEarnings(),
        ]);
        setProfileData(prof);
        setInvitations(invs);
        setProjects(projs);
        setEarningsMetrics(earn.metrics);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-500 text-sm">
        Loading creator workspace...
      </div>
    );
  }

  const profile = profileData?.profile || {};
  const completion: ProfileCompletion = profileData?.completion || { percentage: 0, steps: [], canPublish: false };
  const isPublished = profile.is_published;

  const pendingInvitations = invitations.filter((i) => i.status === 'Pending Creator Response');
  const activeProjects = projects.filter((p) => ['Confirmed', 'In Progress', 'Submitted', 'Revision Requested', 'Resubmitted'].includes(p.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950">
              Welcome, {profile.full_name || user?.email.split('@')[0]}
            </h1>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${
                isPublished
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isPublished ? '● Published on Discovery' : '○ Draft / Unpublished'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {profile.location || 'Location not specified'} · {profile.experience_level || 'Intermediate'} AI Creator
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('creator-portfolio')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Manage Portfolio & Pricing
          </button>
        </div>
      </div>

      {/* Profile Completion Checklist Card (if not fully completed or published) */}
      {!isPublished && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Complete Profile to Publish on Agency Discovery</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Brands discover and send paid briefs only to verified, published creator portfolios.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-indigo-400">{completion.percentage}%</span>
              <span className="text-xs text-slate-400 block">Completed</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-6">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {completion.steps.map((step) => (
              <div
                key={step.id}
                onClick={() => onNavigate('creator-portfolio')}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  step.completed
                    ? 'bg-slate-800/80 border-emerald-500/30 text-slate-200'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {step.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className={`font-semibold line-clamp-1 ${step.completed ? 'text-white' : 'text-slate-300'}`}>
                    {step.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Core Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Invitations</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingInvitations.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting your response</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeProjects.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Work in progress</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Confirmed Received</span>
            <DollarSign className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{earningsMetrics.totalReceived.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Direct Bank Transfers verified</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Payments</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{earningsMetrics.pendingPayments.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Milestones & approvals</p>
        </div>
      </div>

      {/* Recent Invitations & Active Projects Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invitations Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Project Invitations</h3>
              <p className="text-xs text-slate-500">Commercial campaign requests sent to you</p>
            </div>
            <button
              onClick={() => onNavigate('creator-invitations')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {invitations.length === 0 ? (
            <EmptyState
              title="No invitations yet"
              description="Once brands review your published portfolio, their invitations and project briefs will appear here in real time."
              actionLabel={!isPublished ? 'Publish Portfolio' : undefined}
              onAction={() => onNavigate('creator-portfolio')}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {invitations.slice(0, 4).map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {inv.product_name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {inv.company_brand_name || inv.agency_name} · ₹{inv.proposed_budget_inr.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={inv.status} />
                    <button
                      onClick={() => onNavigate('creator-invitations')}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-medium cursor-pointer"
                    >
                      Respond
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Projects Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Workspaces</h3>
              <p className="text-xs text-slate-500">Milestones, deliverable reviews, and deadlines</p>
            </div>
            <button
              onClick={() => onNavigate('creator-projects')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              title="No active projects"
              description="When you and a sponsoring agency mutually agree to an invitation, your project workspace will appear here."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.slice(0, 4).map((proj) => (
                <div key={proj.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {proj.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Deadline: {proj.agreed_deadline} · ₹{proj.agreed_price_inr.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={proj.status} />
                    <button
                      onClick={() => onNavigate('creator-projects')}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-medium cursor-pointer"
                    >
                      Workspace
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
