import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, formatINR } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Repeat,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  Filter,
  Check,
  X,
  MessageSquare,
  Award,
  Layers,
  MapPin,
} from 'lucide-react';

interface BarterListingItem {
  id: string;
  title: string;
  description: string;
  price: number;
  acceptsBarter: boolean;
  category: { id: string; name: string; icon?: string | null };
  provider: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    verificationLevel: string;
    neighborhood?: { id: string; name: string } | null;
    providerProfile?: { trustScore: number; headline?: string } | null;
  };
}

interface SkillExchangeItem {
  id: string;
  proposerId: string;
  receiverId: string;
  offeredHours: number;
  requestedHours: number;
  status: 'PROPOSED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED' | 'CANCELLED';
  proposerConfirmed: boolean;
  receiverConfirmed: boolean;
  createdAt: string;
  proposer: { id: string; name: string; avatarUrl?: string | null; neighborhood?: { name: string } | null };
  receiver: { id: string; name: string; avatarUrl?: string | null; neighborhood?: { name: string } | null };
  offeredListing: { id: string; title: string; category?: { name: string } };
  requestedListing: { id: string; title: string; category?: { name: string } };
  conversation?: { id: string } | null;
}

export const BarterBoardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'board' | 'my_exchanges'>('board');

  const [listings, setListings] = useState<BarterListingItem[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  const [myExchanges, setMyExchanges] = useState<SkillExchangeItem[]>([]);
  const [loadingExchanges, setLoadingExchanges] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Proposal Modal
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [targetListing, setTargetListing] = useState<BarterListingItem | null>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [selectedMyListingId, setSelectedMyListingId] = useState<string>('');
  const [offeredHours, setOfferedHours] = useState<number>(2);
  const [requestedHours, setRequestedHours] = useState<number>(2);
  const [submittingProposal, setSubmittingProposal] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadListings = async () => {
    setLoadingListings(true);
    try {
      const data = await api.get<BarterListingItem[]>('/exchanges/board');
      setListings(data);
    } catch (err) {
      console.error('Failed to load barter listings', err);
    } finally {
      setLoadingListings(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.get<any[]>('/categories');
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadMyExchanges = async () => {
    if (!user) return;
    setLoadingExchanges(true);
    try {
      const data = await api.get<SkillExchangeItem[]>('/exchanges/my');
      setMyExchanges(data);
    } catch (err) {
      console.error('Failed to load my exchanges', err);
    } finally {
      setLoadingExchanges(false);
    }
  };

  const loadMyListings = async () => {
    if (!user) return;
    try {
      const data = await api.get<any[]>('/listings/my');
      setMyListings(data);
      if (data.length > 0) {
        setSelectedMyListingId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load user listings', err);
    }
  };

  useEffect(() => {
    loadListings();
    loadCategories();
    if (user) {
      loadMyExchanges();
      loadMyListings();
    }
  }, [user]);

  const handleOpenProposal = (item: BarterListingItem) => {
    if (!user) {
      alert('Please log in to propose a skill exchange.');
      return;
    }
    if (item.provider.id === user.id) {
      alert('You cannot propose a barter swap with yourself.');
      return;
    }
    setTargetListing(item);
    setShowProposalModal(true);
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetListing || !selectedMyListingId) return;

    setSubmittingProposal(true);
    try {
      await api.post('/exchanges', {
        receiverId: targetListing.provider.id,
        offeredListingId: selectedMyListingId,
        requestedListingId: targetListing.id,
        offeredHours,
        requestedHours,
      });

      showToast(`Skill exchange proposal sent to ${targetListing.provider.name}!`);
      setShowProposalModal(false);
      await loadMyExchanges();
      setActiveTab('my_exchanges');
    } catch (err: any) {
      alert(err.message || 'Failed to submit proposal');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleRespond = async (exchangeId: string, accept: boolean) => {
    try {
      await api.post(`/exchanges/${exchangeId}/respond`, { accept });
      showToast(accept ? 'Skill exchange accepted! Coordination chat open.' : 'Exchange proposal declined.');
      await loadMyExchanges();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleConfirm = async (exchangeId: string) => {
    try {
      await api.post(`/exchanges/${exchangeId}/confirm`);
      showToast('Completion confirmed! Community Credits credited upon mutual confirmation.');
      await loadMyExchanges();
    } catch (err: any) {
      alert(err.message || 'Confirmation failed');
    }
  };

  const filteredListings = listings.filter((l) => {
    if (selectedCategory !== 'ALL' && l.category.id !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 py-2 max-w-6xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-100/20 to-transparent space-y-4">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
            <span>Cashless Hyperlocal Economy</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Neighborhood Skill Exchange & Barter Board
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Trade everyday talents without cash: tutor math in exchange for home electrical repair, or offer graphic design for home-cooked meals. Both residents earn <strong>+5 Community Credits</strong> upon mutual confirmation.
          </p>

          <div className="pt-1 flex items-center gap-4 text-xs font-bold text-amber-900">
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Earn 5 Credits Per Completed Swap</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Dual-Confirmation Safety</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'board'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Barter Listings Board</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
              {listings.length}
            </span>
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('my_exchanges')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'my_exchanges'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
              }`}
            >
              <Repeat className="w-4 h-4" />
              <span>My Skill Swaps</span>
              {myExchanges.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">
                  {myExchanges.length}
                </span>
              )}
            </button>
          )}
        </div>

        {activeTab === 'board' && (
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: BARTER LISTINGS BOARD */}
      {activeTab === 'board' && (
        <div className="space-y-6">
          {filteredListings.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center text-xs text-slate-500 border border-stone-200 space-y-2">
              <ArrowRightLeft className="w-8 h-8 text-stone-300 mx-auto" />
              <p>No listings currently accept barter in this category.</p>
              <p className="text-[11px] text-slate-400">
                You can enable "Accepts Barter" on any of your listings in your Provider Dashboard.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="glass-card rounded-2xl p-5 border border-amber-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 bg-white"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase border border-amber-200">
                        {listing.category.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-emerald-600" />
                        <span>Barter Welcomed</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900 line-clamp-1">{listing.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">{listing.description}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {listing.provider.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate">{listing.provider.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          <span>{listing.provider.neighborhood?.name || 'Chennai'}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">
                            🛡️ {listing.provider.providerProfile?.trustScore ?? 88}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cash Reference</span>
                      <span className="font-extrabold text-xs text-slate-700">{formatINR(listing.price)}</span>
                    </div>

                    <button
                      onClick={() => handleOpenProposal(listing)}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Propose Swap</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SKILL SWAPS */}
      {activeTab === 'my_exchanges' && (
        <div className="space-y-6">
          {myExchanges.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center text-xs text-slate-500 border border-stone-200 space-y-2">
              <Repeat className="w-8 h-8 text-stone-300 mx-auto" />
              <p>You have not proposed or received any skill swaps yet.</p>
              <button
                onClick={() => setActiveTab('board')}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
              >
                Browse Barter Board
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myExchanges.map((ex) => {
                const isProposer = ex.proposerId === user?.id;
                const otherParty = isProposer ? ex.receiver : ex.proposer;

                return (
                  <div
                    key={ex.id}
                    className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4 bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            ex.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : ex.status === 'ACCEPTED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : ex.status === 'PROPOSED'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {ex.status}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          Swap with {otherParty.name} ({otherParty.neighborhood?.name || 'Chennai'})
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(ex.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber-800 block">
                          Offered Service ({ex.offeredHours} Hours)
                        </span>
                        <div className="font-extrabold text-slate-900">{ex.offeredListing.title}</div>
                        <span className="text-[11px] text-slate-500">Provided by {ex.proposer.name}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-blue-800 block">
                          Requested Service ({ex.requestedHours} Hours)
                        </span>
                        <div className="font-extrabold text-slate-900">{ex.requestedListing.title}</div>
                        <span className="text-[11px] text-slate-500">Provided by {ex.receiver.name}</span>
                      </div>
                    </div>

                    {/* Dual Confirmation Progress */}
                    {ex.status === 'ACCEPTED' && (
                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-[11px]">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            {ex.proposerConfirmed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-stone-400" />
                            )}
                            <span>{ex.proposer.name}: {ex.proposerConfirmed ? 'Confirmed' : 'Pending'}</span>
                          </span>

                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            {ex.receiverConfirmed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-stone-400" />
                            )}
                            <span>{ex.receiver.name}: {ex.receiverConfirmed ? 'Confirmed' : 'Pending'}</span>
                          </span>
                        </div>

                        {((isProposer && !ex.proposerConfirmed) || (!isProposer && !ex.receiverConfirmed)) && (
                          <button
                            onClick={() => handleConfirm(ex.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm Completed Job</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      {ex.status === 'PROPOSED' && !isProposer && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRespond(ex.id, true)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Swap</span>
                          </button>
                          <button
                            onClick={() => handleRespond(ex.id, false)}
                            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}

                      {ex.status === 'COMPLETED' && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span>Both Parties Confirmed • +5 Community Credits Awarded!</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PROPOSAL MODAL */}
      {showProposalModal && targetListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitProposal}
            className="glass-card rounded-3xl p-6 sm:p-7 max-w-lg w-full bg-white border border-amber-300 shadow-2xl space-y-5 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base text-slate-900">Propose Skill Exchange</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Requested From Neighbor:</span>
                <div className="font-bold text-slate-900 text-sm">{targetListing.title}</div>
                <div className="text-[11px] text-slate-500">{targetListing.provider.name} • {targetListing.provider.neighborhood?.name}</div>
              </div>
            </div>

            {myListings.length === 0 ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                <p><strong>No active listings found:</strong> You must create at least one service listing in your provider profile to offer in a barter swap.</p>
                <Link
                  to="/provider/listings"
                  className="inline-block px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
                >
                  Create Listing →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">What service will you offer in return?</label>
                  <select
                    value={selectedMyListingId}
                    onChange={(e) => setSelectedMyListingId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white font-medium text-slate-800"
                  >
                    {myListings.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} (Cash Ref: {formatINR(l.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Hours You Offer</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={offeredHours}
                      onChange={(e) => setOfferedHours(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Hours Requested</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={requestedHours}
                      onChange={(e) => setRequestedHours(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                  💡 <strong>Honor System:</strong> Once accepted, both parties coordinate schedule via private chat. When completed, both confirm to receive +5 Community Credits!
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProposalModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 text-slate-600 font-bold text-xs hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProposal}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 disabled:opacity-50"
                  >
                    {submittingProposal ? 'Sending Proposal...' : 'Send Barter Proposal'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
