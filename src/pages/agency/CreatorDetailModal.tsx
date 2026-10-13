import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StarRating } from '../../components/common/StarRating';
import {
  X,
  Send,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  Layers,
  Star,
  ShieldCheck,
} from 'lucide-react';

interface CreatorDetailModalProps {
  creatorId: string;
  onClose: () => void;
  onSendInvitation: (creator: any) => void;
}

export const CreatorDetailModal: React.FC<CreatorDetailModalProps> = ({
  creatorId,
  onClose,
  onSendInvitation,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.getCreatorDetail(creatorId);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [creatorId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center text-xs text-slate-500">
          Loading creator portfolio...
        </div>
      </div>
    );
  }

  if (!data?.creator) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-3">
          <p className="text-xs text-slate-600">Creator portfolio not found.</p>
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs">
            Close
          </button>
        </div>
      </div>
    );
  }

  const { creator, portfolioItems = [], pricingPackages = [], reviews = [] } = data;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {creator.profile_image ? (
              <img
                src={creator.profile_image}
                alt={creator.full_name}
                className="w-14 h-14 rounded-full object-cover border"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-bold text-lg flex items-center justify-center">
                {(creator.full_name || 'C').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-950">{creator.full_name}</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                  {creator.availability}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{creator.location || 'Remote'}</span>
                <span>·</span>
                <span>{creator.experience_level} ({creator.experience_years}y exp)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSendInvitation(creator)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Project Brief</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bio & Skills */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">About the Creator</h4>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {creator.bio}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-700 mr-2">AI Tools:</span>
            {(creator.aiTools || []).map((t: string) => (
              <span key={t} className="text-[11px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-semibold text-slate-700 mr-2">Skills:</span>
            {(creator.skills || []).map((s: string) => (
              <span key={s} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Indicative Rate Packages */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Indicative Quotations & Deliverable Formats ({pricingPackages.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pricingPackages.map((pkg: any) => (
              <div key={pkg.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 block">{pkg.category}</span>
                    <h5 className="text-xs font-bold text-slate-900">{pkg.deliverable_format}</h5>
                  </div>
                  <span className="text-xs font-bold text-slate-900">₹{pkg.price_inr.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[11px] text-slate-600">{pkg.package_details}</p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Revisions: {pkg.included_revisions}</span>
                  <span>Turnaround: {pkg.estimated_turnaround_days} days</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Showcase Media */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Portfolio Showcase Work ({portfolioItems.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {portfolioItems.map((item: any) => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    {item.media_type}
                  </span>
                  {item.media_url && (
                    <a
                      href={item.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                    >
                      <span>Open Media</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
                <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                {item.creative_process && (
                  <p className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Workflow:</span> {item.creative_process}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Verified Client Reviews ({reviews.length})
          </h4>
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No verified client reviews yet for this creator.</p>
          ) : (
            <div className="space-y-2">
              {reviews.map((r: any) => (
                <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {r.company_brand_name || r.agency_name}
                    </span>
                    <StarRating rating={r.rating} size="sm" />
                  </div>
                  <p className="text-slate-600 italic">"{r.feedback}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
