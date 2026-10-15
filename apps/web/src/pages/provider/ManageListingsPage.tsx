import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { PricingType } from '@neighborly/shared';
import {
  PlusCircle,
  Wrench,
  Repeat,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Tag,
  Info,
  X,
} from 'lucide-react';

interface ListingItem {
  id: string;
  title: string;
  description: string;
  pricingType: PricingType;
  price: number;
  acceptsBarter: boolean;
  isActive: boolean;
  createdAt: string;
  category: { id: string; name: string };
  _count?: { bookings: number };
}

interface CategoryOption {
  id: string;
  name: string;
}

export const ManageListingsPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>(PricingType.FIXED);
  const [priceRupees, setPriceRupees] = useState<number>(450);
  const [acceptsBarter, setAcceptsBarter] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listingsData, categoriesData] = await Promise.all([
        api.get<ListingItem[]>('/listings/my-listings'),
        api.get<CategoryOption[]>('/categories'),
      ]);
      setListings(listingsData);
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !categoryId) {
        setCategoryId(categoriesData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (listingId: string, currentActive: boolean) => {
    try {
      const updated = await api.patch<ListingItem>(`/listings/${listingId}/toggle`, {
        isActive: !currentActive,
      });
      setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, isActive: updated.isActive } : l)));
      setToastMessage(`Listing ${updated.isActive ? 'activated' : 'paused'} successfully!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle listing');
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const newListing = await api.post<ListingItem>('/listings', {
        categoryId,
        title,
        description,
        pricingType,
        price: Math.round(priceRupees * 100), // convert to paise
        acceptsBarter,
      });

      setListings([newListing, ...listings]);
      setShowModal(false);
      // Reset form
      setTitle('');
      setDescription('');
      setPriceRupees(450);
      setToastMessage('New service listing published successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Service Listings
          </h1>
          <p className="text-xs text-slate-500">
            Offer your skills to neighbors in {user?.neighborhoodName || 'Ramapuram'} with escrow security
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          id="create-listing-open-btn"
          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Listing</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Listings List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 border border-stone-200 animate-pulse h-28"></div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-stone-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl">
            🛠️
          </div>
          <h3 className="font-bold text-base text-slate-900">You haven't listed any services yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first skill listing to start receiving booking requests from neighbors.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
          >
            Create First Listing
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div
              key={l.id}
              className={`glass-card rounded-2xl p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                l.isActive ? 'border-stone-200 hover:border-amber-300' : 'border-stone-200/50 opacity-70 bg-stone-50'
              }`}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                    {l.category.name}
                  </span>
                  {l.acceptsBarter && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      <span>Barter Enabled</span>
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {l.isActive ? '● Live on Map' : '○ Paused'}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">{l.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{l.description}</p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-lg font-black text-slate-900 block leading-tight">
                    {formatINR(l.price)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">{l.pricingType}</span>
                </div>

                <button
                  onClick={() => handleToggle(l.id, l.isActive)}
                  id={`toggle-listing-btn-${l.id}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    l.isActive
                      ? 'bg-stone-100 hover:bg-stone-200 text-slate-700 border-stone-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {l.isActive ? 'Pause Listing' : 'Activate Listing'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Listing Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                  ⚡
                </div>
                <h2 className="text-lg font-bold text-slate-900">Create New Service Listing</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Service Category *</label>
                <select
                  id="create-listing-category-select"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs sm:text-sm bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Listing Title *</label>
                <input
                  type="text"
                  required
                  id="create-listing-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ceiling Fan, Geyser & Switchboard Electrical Repairs"
                  minLength={5}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs sm:text-sm bg-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description *</label>
                <textarea
                  required
                  id="create-listing-description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe your service, standard diagnostic procedure, and materials included..."
                  minLength={10}
                  maxLength={1000}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs sm:text-sm bg-white"
                />
              </div>

              {/* Pricing Type & Price in Rupees */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Pricing Model</label>
                  <select
                    id="create-listing-pricing-type-select"
                    value={pricingType}
                    onChange={(e) => setPricingType(e.target.value as PricingType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm bg-white"
                  >
                    <option value={PricingType.FIXED}>Fixed Price</option>
                    <option value={PricingType.HOURLY}>Hourly Rate</option>
                    <option value={PricingType.FREE}>Free Community Help</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Price (in Rupees ₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-stone-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      required
                      id="create-listing-price-input"
                      value={priceRupees}
                      onChange={(e) => setPriceRupees(Number(e.target.value))}
                      min={0}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs sm:text-sm bg-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Fair-Price Hint Callout */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Fair-Price Guidance:</span> Typical price for this category in{' '}
                  <span className="font-bold">{user?.neighborhoodName || 'Ramapuram'}</span> is{' '}
                  <span className="font-mono font-bold text-amber-950">₹350 – ₹600</span>.
                </div>
              </div>

              {/* Barter Checkbox */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    id="create-listing-accepts-barter-checkbox"
                    checked={acceptsBarter}
                    onChange={(e) => setAcceptsBarter(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-stone-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Accept Skill Barter (Time-Banking)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Allows neighbors to trade hours directly (e.g. 2 hours of electrical repair for 2 hours of tutoring).
                    </span>
                  </div>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-slate-700 text-xs font-bold hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="create-listing-submit-btn"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Service Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
