import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { CATEGORIES_LIST } from '../../types';
import { StarRating } from '../../components/common/StarRating';
import { EmptyState } from '../../components/common/EmptyState';
import { CreatorDetailModal } from './CreatorDetailModal';
import { SendInvitationModal } from './SendInvitationModal';
import {
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  MapPin,
  Clock,
  Send,
  Eye,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

interface CreatorDiscoveryProps {
  onNavigate: (view: string) => void;
}

export const CreatorDiscovery: React.FC<CreatorDiscoveryProps> = ({ onNavigate }) => {
  const [creators, setCreators] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [availability, setAvailability] = useState('All');
  const [maxTurnaroundDays, setMaxTurnaroundDays] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  // Modals
  const [detailCreatorId, setDetailCreatorId] = useState<string | null>(null);
  const [invitingCreator, setInvitingCreator] = useState<any | null>(null);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        sortBy,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategories.length > 0) params.categories = selectedCategories.join(',');
      if (minBudget) params.minBudget = minBudget;
      if (maxBudget) params.maxBudget = maxBudget;
      if (availability !== 'All') params.availability = availability;
      if (maxTurnaroundDays) params.maxTurnaroundDays = maxTurnaroundDays;

      const data = await api.discoverCreators(params);
      setCreators(data.creators || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategories, minBudget, maxBudget, availability, maxTurnaroundDays, sortBy]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setMinBudget('');
    setMaxBudget('');
    setAvailability('All');
    setMaxTurnaroundDays('');
    setSortBy('recommended');
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Discovery Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-950">AI Creator Discovery</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Browse verified, published AI creators across 16 advertising categories. Review real portfolio media and indicative rates.
        </p>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Row 1: Search, Sort & Reset */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by creator name, AI tool, or skill..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium"
            >
              <option value="recommended">Most Recommended (Ratings & Projects)</option>
              <option value="price_low">Budget-Friendly (Lowest Indicative Rate)</option>
              <option value="price_high">Highest Indicative Rate</option>
              <option value="turnaround">Fastest Turnaround</option>
            </select>

            <button
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Numeric & Status Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Min Budget (INR ₹)</label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Max Budget (INR ₹)</label>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available (Accepting projects)</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Max Turnaround (Days)</label>
            <input
              type="number"
              placeholder="e.g. 7"
              value={maxTurnaroundDays}
              onChange={(e) => setMaxTurnaroundDays(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
            />
          </div>
        </div>

        {/* Row 3: Category Badges / Multi-select buttons */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-medium text-slate-600 block mb-2">Advertising Categories:</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES_LIST.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Discovery Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-900">{creators.length}</strong> published {creators.length === 1 ? 'creator' : 'creators'}
        </span>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Searching creator database...</div>
      ) : creators.length === 0 ? (
        <EmptyState
          title="No creator portfolios available yet"
          description={
            total === 0 && selectedCategories.length === 0 && !search
              ? "The marketplace starts completely empty. As creators register, complete their profiles, and publish their portfolios, they will appear here automatically."
              : "No published creators match your current filter criteria. Try adjusting your category, budget, or turnaround filters."
          }
          actionLabel={selectedCategories.length > 0 || search ? "Reset Filters" : undefined}
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Creator Card Top Header */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {c.profileImage ? (
                      <img
                        src={c.profileImage}
                        alt={c.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-semibold text-sm flex items-center justify-center">
                        {(c.fullName || 'C').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-950 line-clamp-1">{c.fullName}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{c.location || 'Remote'}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                      c.availability === 'Available'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.availability}
                  </span>
                </div>

                {/* Rating & Project stats */}
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                  {c.avgRating ? (
                    <div className="flex items-center gap-1">
                      <StarRating rating={c.avgRating} size="sm" />
                      <span className="font-bold text-slate-800">{c.avgRating}</span>
                      <span className="text-[10px] text-slate-400">({c.reviewCount})</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">New / Unrated</span>
                  )}
                  <span>·</span>
                  <span className="text-[11px] text-slate-600">{c.completedProjectsCount} completed</span>
                  <span>·</span>
                  <span className="text-[11px] text-slate-600">{c.turnaroundDays}d turnaround</span>
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                  {c.bio}
                </p>

                {/* Skills & AI Tools tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {(c.aiTools || []).slice(0, 3).map((tool: string) => (
                    <span key={tool} className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                      {tool}
                    </span>
                  ))}
                  {(c.skills || []).slice(0, 2).map((skill: string) => (
                    <span key={skill} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Categories */}
                <div className="mt-2 text-[10px] text-slate-400 line-clamp-1">
                  Categories: {(c.categories || []).join(', ')}
                </div>
              </div>

              {/* Bottom Card Footer: Rates & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Indicative Rates from</span>
                  <span className="text-sm font-bold text-slate-900">
                    {c.minPrice > 0 ? `₹${c.minPrice.toLocaleString('en-IN')}` : 'Rate on request'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailCreatorId(c.id)}
                    className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Work</span>
                  </button>
                  <button
                    onClick={() => setInvitingCreator(c)}
                    className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Brief</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creator Detail Modal */}
      {detailCreatorId && (
        <CreatorDetailModal
          creatorId={detailCreatorId}
          onClose={() => setDetailCreatorId(null)}
          onSendInvitation={(creator) => {
            setDetailCreatorId(null);
            setInvitingCreator(creator);
          }}
        />
      )}

      {/* Send Invitation Modal */}
      {invitingCreator && (
        <SendInvitationModal
          creator={invitingCreator}
          onClose={() => setInvitingCreator(null)}
          onSuccess={() => {
            setInvitingCreator(null);
            onNavigate('agency-invitations');
          }}
        />
      )}
    </div>
  );
};
