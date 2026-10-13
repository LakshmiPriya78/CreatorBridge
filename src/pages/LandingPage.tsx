import React from 'react';
import { Sparkles, Building, ArrowRight, ShieldCheck, CheckCircle2, Zap, Layers, Lock } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-700 mb-6 border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Full-Stack AI Commercial Creative Marketplace</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 leading-tight">
              Where AI creators meet advertising brands.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed">
              CreatorBridge powers the end-to-end commercial workflow: transparent discovery, direct proposal negotiation, legally binding project agreements, secure deliverable reviews, and direct bank transfers.
            </p>

            {/* Role Entry Points Grid */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              {/* Creator Portal Card */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-left hover:border-slate-300 transition-all shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-950">AI Content Creators</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Publish your verified AI portfolio, set your own INR package rates, negotiate terms, and get paid directly to your bank account.
                  </p>
                </div>
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => onNavigate('creator-register')}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Register as Creator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate('creator-login')}
                    className="w-full py-2 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Creator Login
                  </button>
                </div>
              </div>

              {/* Agency Portal Card */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-left hover:border-slate-300 transition-all shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4">
                    <Building className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-950">Agencies & Brands</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Discover published creators across 16 advertising categories, send project briefs, negotiate scope, and track deliverables.
                  </p>
                </div>
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => onNavigate('agency-register')}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Register as Agency/Brand</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate('agency-login')}
                    className="w-full py-2 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Agency/Brand Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Lifecycle Workflow */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            The Complete Creator-to-Agency Lifecycle
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            A reliable, transparent pipeline where every stage is backend-confirmed and stored persistently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs font-bold text-indigo-600 block mb-2">STAGE 1</span>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Discovery & Terms</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Creators publish real AI portfolios and indicative pricing. Agencies filter by category, budget in INR, turnaround, and availability.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs font-bold text-indigo-600 block mb-2">STAGE 2</span>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Invitation & Negotiation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Agencies send targeted project briefs. Creators accept, counter-offer, or decline. Chronological history is preserved until mutual agreement.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs font-bold text-indigo-600 block mb-2">STAGE 3</span>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Deliverables & Review</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Active workspaces with versioned deliverable submissions, structured revision requests, and explicit client approvals.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs font-bold text-indigo-600 block mb-2">STAGE 4</span>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Bank Transfer & Feedback</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct Bank Transfer tracking with transaction reference, creator receipt confirmation, and project-linked 5-star reviews.
            </p>
          </div>
        </div>
      </section>

      {/* Core Integrity Principles */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Zero Demo Data Policy</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Only authentic, registered users who publish their portfolios appear in agency discovery. No fake cards or seeded metrics.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Isolated Financial Data</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Creator banking coordinates (Account Holder, Number, IFSC) remain strictly private and are accessible only for confirmed projects.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Binding Mutual Agreement</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  No project starts until both creator and agency confirm price, deliverables, deadline, affiliate permission, and licensing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
