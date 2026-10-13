import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { CATEGORIES_LIST, DELIVERABLE_FORMATS, type PortfolioItem, type CreatorPricing } from '../../types';
import {
  Sparkles,
  Layers,
  DollarSign,
  Calendar,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface PortfolioManagerProps {
  onNavigate: (view: string) => void;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = () => {
  const [activeTab, setActiveTab] = useState<
    'basic' | 'categories' | 'portfolio' | 'pricing' | 'availability' | 'bank'
  >('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [basicInfo, setBasicInfo] = useState({
    full_name: '',
    bio: '',
    country: 'India',
    state: '',
    city: '',
    location: '',
    contact_email: '',
    contact_phone: '',
    experience_level: 'Intermediate',
    experience_years: 2,
    skillsStr: 'Prompt Engineering, AI Cinematography, Motion Design',
    aiToolsStr: 'Midjourney, Runway Gen-3, Kling, ElevenLabs, Claude',
    profile_image: '',
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [pricingPackages, setPricingPackages] = useState<CreatorPricing[]>([]);
  const [availabilityData, setAvailabilityData] = useState({
    availability: 'Available' as 'Available' | 'Unavailable',
    turnaround_days: 3,
    working_preferences: 'Remote',
    working_hours: '9 AM - 6 PM IST',
    communication_schedule: 'Standard business hours',
    workload_notes: '',
  });
  const [bankDetails, setBankDetails] = useState({
    account_holder_name: '',
    bank_account_number: '',
    ifsc_code: '',
  });

  const [isPublished, setIsPublished] = useState(false);
  const [completion, setCompletion] = useState<any>(null);

  // Modal for new/edit portfolio item
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({
    title: '',
    media_type: 'Video' as any,
    media_url: '',
    description: '',
    creative_process: '',
    creator_contribution: '',
    aiToolsStr: 'Midjourney, Runway',
    categories: [] as string[],
  });

  // Modal for new/edit pricing package
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<any>(null);
  const [priceForm, setPriceForm] = useState({
    category: CATEGORIES_LIST[0] as string,
    deliverable_format: DELIVERABLE_FORMATS[0] as string,
    price_inr: 15000,
    min_budget_inr: 10000,
    max_budget_inr: 25000,
    package_details: 'Complete end-to-end AI generated video commercial including voiceover.',
    included_deliverables: '1x 4K Master Video, 3x Social Cuts (9:16), Script & Audio',
    included_revisions: 2,
    pricing_notes: 'Indicative quotation. Final project price mutually agreed in project brief.',
    estimated_turnaround_days: 3,
  });

  // Uploading file states
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profileRes, bankRes] = await Promise.all([
        api.getCreatorProfile(),
        api.getPaymentDetails().catch(() => null),
      ]);

      const prof = profileRes.profile;
      setBasicInfo({
        full_name: prof.full_name || '',
        bio: prof.bio || '',
        country: prof.country || 'India',
        state: prof.state || '',
        city: prof.city || '',
        location: prof.location || '',
        contact_email: prof.contact_email || '',
        contact_phone: prof.contact_phone || '',
        experience_level: prof.experience_level || 'Intermediate',
        experience_years: prof.experience_years || 2,
        skillsStr: (prof.skills || []).join(', '),
        aiToolsStr: (prof.ai_tools || []).join(', '),
        profile_image: prof.profile_image || '',
      });

      setSelectedCategories(prof.categories || []);
      setPortfolioItems(profileRes.portfolioItems || []);
      setPricingPackages(profileRes.pricingPackages || []);
      setAvailabilityData({
        availability: prof.availability || 'Available',
        turnaround_days: prof.turnaround_days || 3,
        working_preferences: prof.working_preferences || 'Remote',
        working_hours: prof.working_hours || '9 AM - 6 PM IST',
        communication_schedule: prof.communication_schedule || 'Standard business hours',
        workload_notes: prof.workload_notes || '',
      });
      setIsPublished(prof.is_published);
      setCompletion(profileRes.completion);

      if (bankRes) {
        setBankDetails({
          account_holder_name: bankRes.account_holder_name || '',
          bank_account_number: bankRes.bank_account_number || '',
          ifsc_code: bankRes.ifsc_code || '',
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const notifySave = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const skills = basicInfo.skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
      const ai_tools = basicInfo.aiToolsStr.split(',').map((s) => s.trim()).filter(Boolean);

      await api.updateCreatorProfile({
        ...basicInfo,
        skills,
        ai_tools,
        categories: selectedCategories,
        ...availabilityData,
      });
      notifySave('Basic information saved.');
      await loadAll();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving basic info.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategories = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await api.updateCreatorProfile({
        ...basicInfo,
        skills: basicInfo.skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
        ai_tools: basicInfo.aiToolsStr.split(',').map((s) => s.trim()).filter(Boolean),
        categories: selectedCategories,
        ...availabilityData,
      });
      notifySave('Advertising categories updated.');
      await loadAll();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      await api.updateCreatorProfile({
        ...basicInfo,
        skills: basicInfo.skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
        ai_tools: basicInfo.aiToolsStr.split(',').map((s) => s.trim()).filter(Boolean),
        categories: selectedCategories,
        ...availabilityData,
      });
      notifySave('Availability and working preferences saved.');
      await loadAll();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      await api.updatePaymentDetails(bankDetails);
      notifySave('Private bank coordinates saved securely.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    setErrorMsg(null);
    try {
      if (isPublished) {
        await api.unpublishPortfolio();
        setIsPublished(false);
        notifySave('Portfolio unpublished from discovery.');
      } else {
        await api.publishPortfolio();
        setIsPublished(true);
        notifySave('Congratulations! Your portfolio is now discoverable by brands and agencies.');
      }
      await loadAll();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Portfolio items actions
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemForm,
        ai_tools: itemForm.aiToolsStr.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (editingItem) {
        await api.updatePortfolioItem(editingItem.id, payload);
      } else {
        await api.addPortfolioItem(payload);
      }
      setShowItemModal(false);
      setEditingItem(null);
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;
    try {
      await api.deletePortfolioItem(id);
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Pricing package actions
  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPrice) {
        await api.updatePricingPackage(editingPrice.id, priceForm);
      } else {
        await api.addPricingPackage(priceForm);
      }
      setShowPriceModal(false);
      setEditingPrice(null);
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePrice = async (id: string) => {
    if (!confirm('Delete this pricing package?')) return;
    try {
      await api.deletePricingPackage(id);
      await loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileUpload = async (file: File, type: 'avatar' | 'portfolio') => {
    setIsUploading(true);
    try {
      const res = await api.uploadFile(file);
      if (type === 'avatar') {
        setBasicInfo((prev) => ({ ...prev, profile_image: res.url }));
      } else if (type === 'portfolio') {
        setItemForm((prev) => ({ ...prev, media_url: res.url }));
      }
    } catch (err: any) {
      alert(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">
        Loading portfolio editor...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner with Publication Control */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-950">Creator Profile & Portfolio Manager</h1>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${
                isPublished
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isPublished ? '● Published on Agency Discovery' : '○ Draft Mode'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Publishing automatically lists your verified profile and showcase work in brand searches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePublishToggle}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
              isPublished
                ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{isPublished ? 'Unpublish Portfolio' : 'Publish to Discovery'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
        {[
          { id: 'basic', label: '1. Basic Information', icon: Sparkles },
          { id: 'categories', label: '2. Advertising Categories', icon: Layers },
          { id: 'portfolio', label: '3. Previous Work & Media', icon: Upload },
          { id: 'pricing', label: '4. Creator Rates & Packages', icon: DollarSign },
          { id: 'availability', label: '5. Working Preferences', icon: Calendar },
          { id: 'bank', label: 'Private Bank Details', icon: Lock },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Basic Information */}
      {activeTab === 'basic' && (
        <form onSubmit={handleSaveBasic} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-950">Basic Information & Creative Identity</h3>
            <p className="text-xs text-slate-500">Your public profile card seen by advertising agencies.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name / Creator Handle *</label>
              <input
                type="text"
                required
                value={basicInfo.full_name}
                onChange={(e) => setBasicInfo({ ...basicInfo, full_name: e.target.value })}
                placeholder="e.g. Jasvanth Gunda"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City & State (Location) *</label>
              <input
                type="text"
                required
                value={basicInfo.location}
                onChange={(e) => setBasicInfo({ ...basicInfo, location: e.target.value, city: e.target.value })}
                placeholder="e.g. Bengaluru, Karnataka"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Professional Bio & Introduction *</label>
            <textarea
              rows={3}
              required
              value={basicInfo.bio}
              onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
              placeholder="Describe your creative specialty, background in AI filmmaking, commercial advertising experience..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Specialized Skills (comma separated) *</label>
              <input
                type="text"
                value={basicInfo.skillsStr}
                onChange={(e) => setBasicInfo({ ...basicInfo, skillsStr: e.target.value })}
                placeholder="Prompt Engineering, Motion Graphics, AI Video Direction, Color Grading"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">AI Tools Used (comma separated) *</label>
              <input
                type="text"
                value={basicInfo.aiToolsStr}
                onChange={(e) => setBasicInfo({ ...basicInfo, aiToolsStr: e.target.value })}
                placeholder="Midjourney, Runway Gen-3, Kling, Sora, ElevenLabs, Magnific"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Experience Level & Years</label>
              <div className="flex gap-2">
                <select
                  value={basicInfo.experience_level}
                  onChange={(e) => setBasicInfo({ ...basicInfo, experience_level: e.target.value })}
                  className="w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Beginner">Beginner (Under 1 yr)</option>
                  <option value="Intermediate">Intermediate (1-3 yrs)</option>
                  <option value="Senior">Senior / Lead (3-5+ yrs)</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={basicInfo.experience_years}
                  onChange={(e) => setBasicInfo({ ...basicInfo, experience_years: parseInt(e.target.value, 10) || 1 })}
                  className="w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  placeholder="Years"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Profile Photo / Avatar</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'avatar')}
                  className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                {basicInfo.profile_image && (
                  <img src={basicInfo.profile_image} alt="Avatar" className="w-8 h-8 rounded-full object-cover border" />
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Basic Info'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Advertising Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-950">Advertising Categories</h3>
            <p className="text-xs text-slate-500">
              Select at least one commercial industry vertical where you produce content. (Required before publishing).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES_LIST.map((cat) => {
              const isChecked = selectedCategories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => {
                    setSelectedCategories((prev) =>
                      isChecked ? prev.filter((c) => c !== cat) : [...prev, cat]
                    );
                  }}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat}</span>
                  {isChecked && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {selectedCategories.length} categories selected
            </span>
            <button
              onClick={handleSaveCategories}
              disabled={saving || selectedCategories.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Categories'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Portfolio Items */}
      {activeTab === 'portfolio' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-950">Previous Work & Portfolio Showcase</h3>
              <p className="text-xs text-slate-500">Upload videos, posters, images, and banners showcasing your commercial AI workflow.</p>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setItemForm({
                  title: '',
                  media_type: 'Video',
                  media_url: '',
                  description: '',
                  creative_process: '',
                  creator_contribution: '',
                  aiToolsStr: 'Midjourney, Runway Gen-3',
                  categories: selectedCategories.length > 0 ? [selectedCategories[0]] : [],
                });
                setShowItemModal(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Portfolio Item</span>
            </button>
          </div>

          {portfolioItems.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800">No portfolio items uploaded yet</p>
              <p className="text-xs text-slate-500 mt-1">Upload at least one commercial sample before publishing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolioItems.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs flex flex-col justify-between">
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {item.media_type}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setItemForm({
                              title: item.title,
                              media_type: item.media_type,
                              media_url: item.media_url,
                              description: item.description,
                              creative_process: item.creative_process,
                              creator_contribution: item.creator_contribution,
                              aiToolsStr: (item.ai_tools || []).join(', '),
                              categories: item.categories || [],
                            });
                            setShowItemModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-slate-950 line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{item.description}</p>
                    {item.creative_process && (
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        <span className="font-medium text-slate-700">Process:</span> {item.creative_process}
                      </p>
                    )}
                  </div>
                  {item.media_url && (
                    <div className="px-4 pb-3">
                      <a
                        href={item.media_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-medium text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <span>View Media Asset</span>
                        <Eye className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Creator Rates & Packages */}
      {activeTab === 'pricing' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-950">Creator-Controlled Pricing Packages (INR)</h3>
              <p className="text-xs text-slate-500">
                Only you control your indicative package quotations. Final project amounts are mutually confirmed in the invitation.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPrice(null);
                setPriceForm({
                  category: selectedCategories[0] || CATEGORIES_LIST[0],
                  deliverable_format: DELIVERABLE_FORMATS[0],
                  price_inr: 15000,
                  min_budget_inr: 10000,
                  max_budget_inr: 25000,
                  package_details: 'Complete end-to-end AI commercial video package.',
                  included_deliverables: '1x 4K Master Video, 3x Social Cuts, Script & Audio',
                  included_revisions: 2,
                  pricing_notes: 'Indicative quotation. Exact budget agreed during negotiation.',
                  estimated_turnaround_days: 3,
                });
                setShowPriceModal(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pricing Package</span>
            </button>
          </div>

          {pricingPackages.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <DollarSign className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800">No pricing packages configured</p>
              <p className="text-xs text-slate-500 mt-1">Add at least one deliverable format package before publishing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pricingPackages.map((pkg) => (
                <div key={pkg.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                        {pkg.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-950 mt-0.5">{pkg.deliverable_format}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-slate-900">
                        ₹{pkg.price_inr.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">Indicative rate</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{pkg.package_details}</p>

                  <div className="text-[11px] space-y-1 text-slate-500 border-t border-slate-100 pt-2">
                    <div>
                      <span className="font-semibold text-slate-700">Deliverables:</span> {pkg.included_deliverables}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Revisions Included:</span> {pkg.included_revisions} revisions
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Estimated Turnaround:</span> {pkg.estimated_turnaround_days} days
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setEditingPrice(pkg);
                        setPriceForm({
                          category: pkg.category,
                          deliverable_format: pkg.deliverable_format,
                          price_inr: pkg.price_inr,
                          min_budget_inr: pkg.min_budget_inr || pkg.price_inr,
                          max_budget_inr: pkg.max_budget_inr || pkg.price_inr * 2,
                          package_details: pkg.package_details,
                          included_deliverables: pkg.included_deliverables,
                          included_revisions: pkg.included_revisions,
                          pricing_notes: pkg.pricing_notes,
                          estimated_turnaround_days: pkg.estimated_turnaround_days,
                        });
                        setShowPriceModal(true);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Edit Package
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      onClick={() => handleDeletePrice(pkg.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Availability & Working Preferences */}
      {activeTab === 'availability' && (
        <form onSubmit={handleSaveAvailability} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-950">Availability & Working Preferences</h3>
            <p className="text-xs text-slate-500">Agencies filter creators by current availability and delivery speed.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Current Availability Status *</label>
              <select
                value={availabilityData.availability}
                onChange={(e) => setAvailabilityData({ ...availabilityData, availability: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="Available">Available (Accepting new commercial briefs)</option>
                <option value="Unavailable">Unavailable (Not currently accepting briefs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Standard Turnaround Time (Days) *</label>
              <input
                type="number"
                min={1}
                max={60}
                required
                value={availabilityData.turnaround_days}
                onChange={(e) => setAvailabilityData({ ...availabilityData, turnaround_days: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Working Arrangement</label>
              <input
                type="text"
                value={availabilityData.working_preferences}
                onChange={(e) => setAvailabilityData({ ...availabilityData, working_preferences: e.target.value })}
                placeholder="Remote, On-site for filming, or Hybrid"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Working Hours & Timezone</label>
              <input
                type="text"
                value={availabilityData.working_hours}
                onChange={(e) => setAvailabilityData({ ...availabilityData, working_hours: e.target.value })}
                placeholder="9 AM - 6 PM IST"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Workload / Availability Notes</label>
            <textarea
              rows={2}
              value={availabilityData.workload_notes}
              onChange={(e) => setAvailabilityData({ ...availabilityData, workload_notes: e.target.value })}
              placeholder="e.g. Can take up to 2 commercial video briefs this month."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: Private Bank Payment Details */}
      {activeTab === 'bank' && (
        <form onSubmit={handleSaveBank} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-950">Private Bank Transfer Coordinates (Option A: Direct Bank Transfer)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Strict Zero-Leakage Policy: These details are strictly protected and displayed ONLY to the sponsoring agency of a mutually confirmed project for executing payment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Account Holder Full Name *</label>
              <input
                type="text"
                required
                value={bankDetails.account_holder_name}
                onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                placeholder="As per bank passbook"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bank Account Number *</label>
              <input
                type="text"
                required
                value={bankDetails.bank_account_number}
                onChange={(e) => setBankDetails({ ...bankDetails, bank_account_number: e.target.value })}
                placeholder="e.g. 50100234567890"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">IFSC Code *</label>
              <input
                type="text"
                required
                value={bankDetails.ifsc_code}
                onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })}
                placeholder="e.g. HDFC0001234"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Protected Bank Coordinates'}
            </button>
          </div>
        </form>
      )}

      {/* MODAL: Portfolio Item */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-slate-950">
              {editingItem ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={itemForm.title}
                  onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                  placeholder="e.g. Futuristic Luxury Perfume Commercial"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Media Type</label>
                  <select
                    value={itemForm.media_type}
                    onChange={(e) => setItemForm({ ...itemForm, media_type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="Video">Video</option>
                    <option value="Poster">Poster</option>
                    <option value="Image">Image</option>
                    <option value="Banner">Banner</option>
                    <option value="Promotional Graphic">Promotional Graphic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Upload File / Enter Media URL *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.media_url}
                    onChange={(e) => setItemForm({ ...itemForm, media_url: e.target.value })}
                    placeholder="/uploads/sample.mp4 or URL"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'portfolio')}
                    className="mt-1 text-[11px] text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Campaign objective and deliverable breakdown"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Creative Workflow / Process</label>
                <textarea
                  rows={2}
                  value={itemForm.creative_process}
                  onChange={(e) => setItemForm({ ...itemForm, creative_process: e.target.value })}
                  placeholder="e.g. Midjourney for concept styling, Runway Gen-3 for fluid camera moves, Topaz for 4K upscaling"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Creator Contribution</label>
                <input
                  type="text"
                  value={itemForm.creator_contribution}
                  onChange={(e) => setItemForm({ ...itemForm, creator_contribution: e.target.value })}
                  placeholder="e.g. Prompt engineering, art direction, sound design"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg"
                >
                  {isUploading ? 'Uploading...' : 'Save Portfolio Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Pricing Package */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-base font-bold text-slate-950">
              {editingPrice ? 'Edit Pricing Package' : 'Create Pricing Package'}
            </h3>

            <form onSubmit={handleSavePrice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Industry Category</label>
                  <select
                    value={priceForm.category}
                    onChange={(e) => setPriceForm({ ...priceForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    {CATEGORIES_LIST.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Content / Deliverable Format</label>
                  <select
                    value={priceForm.deliverable_format}
                    onChange={(e) => setPriceForm({ ...priceForm, deliverable_format: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    {DELIVERABLE_FORMATS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Indicative Price in INR (₹) *</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={priceForm.price_inr}
                    onChange={(e) => setPriceForm({ ...priceForm, price_inr: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Turnaround Days *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={priceForm.estimated_turnaround_days}
                    onChange={(e) => setPriceForm({ ...priceForm, estimated_turnaround_days: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Package Details & Scope *</label>
                <textarea
                  rows={2}
                  required
                  value={priceForm.package_details}
                  onChange={(e) => setPriceForm({ ...priceForm, package_details: e.target.value })}
                  placeholder="Explain what is included in this commercial package"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Included Deliverables & Files</label>
                <input
                  type="text"
                  value={priceForm.included_deliverables}
                  onChange={(e) => setPriceForm({ ...priceForm, included_deliverables: e.target.value })}
                  placeholder="1x 4K Master Video, 3x Social Cuts, AI Voiceover"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Included Revisions</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={priceForm.included_revisions}
                    onChange={(e) => setPriceForm({ ...priceForm, included_revisions: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pricing Notes</label>
                  <input
                    type="text"
                    value={priceForm.pricing_notes}
                    onChange={(e) => setPriceForm({ ...priceForm, pricing_notes: e.target.value })}
                    placeholder="Indicative rate quotation"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
