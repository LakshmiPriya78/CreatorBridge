import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Building, ShieldCheck, Check, AlertCircle } from 'lucide-react';

export const AgencyProfilePage: React.FC = () => {
  const [profile, setProfile] = useState({
    agency_name: '',
    contact_person: '',
    account_type: 'Agency',
    company_brand_name: '',
    country: 'India',
    state: '',
    city: '',
    locality: '',
    office_location: '',
    filming_location: '',
    verification_status: 'Verified',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getAgencyProfile();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAgencyProfile(profile);
      setMsg('Agency profile updated successfully.');
      setTimeout(() => setMsg(null), 3000);
      await loadProfile();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">Loading agency profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-950">Agency & Brand Profile</h1>
        <p className="text-xs text-slate-500">
          Manage your verified commercial identity, registered office address, and contact details.
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-950">Enterprise Information</h3>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{profile.verification_status}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Company / Brand Legal Name *</label>
            <input
              type="text"
              required
              value={profile.company_brand_name}
              onChange={(e) => setProfile({ ...profile, company_brand_name: e.target.value })}
              placeholder="e.g. Apex Creative Media Pvt Ltd"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Agency Display Name</label>
            <input
              type="text"
              value={profile.agency_name}
              onChange={(e) => setProfile({ ...profile, agency_name: e.target.value })}
              placeholder="e.g. Apex Ads"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Contact Person Full Name *</label>
            <input
              type="text"
              required
              value={profile.contact_person}
              onChange={(e) => setProfile({ ...profile, contact_person: e.target.value })}
              placeholder="e.g. Sarah Jenkins (Head of Creative Production)"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Account Type *</label>
            <select
              value={profile.account_type}
              onChange={(e) => setProfile({ ...profile, account_type: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg bg-white"
            >
              <option value="Agency">Advertising / Creative Agency</option>
              <option value="Brand">In-House Brand / Direct Advertiser</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Office Location / City *</label>
            <input
              type="text"
              required
              value={profile.office_location}
              onChange={(e) => setProfile({ ...profile, office_location: e.target.value })}
              placeholder="e.g. Bandra West, Mumbai, Maharashtra"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Default Campaign / Filming Location</label>
            <input
              type="text"
              value={profile.filming_location}
              onChange={(e) => setProfile({ ...profile, filming_location: e.target.value })}
              placeholder="e.g. India / Worldwide Digital"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
