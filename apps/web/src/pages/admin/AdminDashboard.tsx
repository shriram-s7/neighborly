import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, formatINR } from '../../lib/api';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Users,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileText,
  BarChart3,
  Map,
  Lock,
  RefreshCw,
  Sliders,
  Check,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface DisputeItem {
  id: string;
  bookingId: string;
  reason: string;
  evidenceText: string;
  status: 'OPEN' | 'RESOLVED';
  resolution?: 'REFUND' | 'RELEASE' | 'SPLIT' | null;
  splitPercent?: number | null;
  adminNote?: string | null;
  createdAt: string;
  raisedBy: { id: string; name: string; email: string };
  booking: {
    id: string;
    agreedPrice: number;
    listing: { id: string; title: string; price: number };
    requester: { id: string; name: string; email: string; phone?: string | null };
    provider: { id: string; name: string; email: string; phone?: string | null };
  };
}

interface FlaggedReviewItem {
  id: string;
  bookingId: string;
  rating: number;
  comment: string;
  flagReasons: string[];
  createdAt: string;
  reviewer: { id: string; name: string; email: string };
  reviewee: { id: string; name: string; email: string };
  booking: {
    id: string;
    agreedPrice: number;
    status: string;
    listing: { title: string };
  };
}

interface ProviderUserItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isProvider: boolean;
  verificationLevel: 'NONE' | 'PHONE' | 'ID' | 'ADDRESS';
  joinedAt: string;
  neighborhood?: { id: string; name: string } | null;
  providerProfile?: { trustScore: number; headline?: string } | null;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'disputes' | 'reviews' | 'verification' | 'ledger'>('disputes');

  // Ledger verification state
  const [ledgerStatus, setLedgerStatus] = useState<'IDLE' | 'VERIFYING' | 'VALID' | 'ERROR'>('IDLE');
  const [ledgerData, setLedgerData] = useState<any>(null);

  // Disputes state
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [resolutionMode, setResolutionMode] = useState<'REFUND' | 'RELEASE' | 'SPLIT'>('SPLIT');
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [adminNote, setAdminNote] = useState('Mutual settlement reached after review of evidence.');
  const [resolving, setResolving] = useState(false);

  // Flagged reviews state
  const [flaggedReviews, setFlaggedReviews] = useState<FlaggedReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Users / Providers state
  const [usersList, setUsersList] = useState<ProviderUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load ledger verification
  const handleVerifyLedger = async () => {
    setLedgerStatus('VERIFYING');
    try {
      const res = await api.get<any>('/wallet/verify');
      setLedgerData(res);
      setLedgerStatus(res.isValid ? 'VALID' : 'ERROR');
    } catch (err) {
      setLedgerStatus('ERROR');
    }
  };

  // Fetch disputes
  const loadDisputes = async () => {
    setLoadingDisputes(true);
    try {
      const data = await api.get<DisputeItem[]>('/disputes');
      setDisputes(data);
    } catch (err) {
      console.error('Failed to load disputes', err);
    } finally {
      setLoadingDisputes(false);
    }
  };

  // Fetch flagged reviews
  const loadFlaggedReviews = async () => {
    setLoadingReviews(true);
    try {
      const data = await api.get<FlaggedReviewItem[]>('/reviews/admin/flagged');
      setFlaggedReviews(data);
    } catch (err) {
      console.error('Failed to load flagged reviews', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch users for verification
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.get<ProviderUserItem[]>('/users/admin/list');
      setUsersList(data);
    } catch (err) {
      console.error('Failed to load users list', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadDisputes();
    loadFlaggedReviews();
    loadUsers();
    handleVerifyLedger();
  }, []);

  // Resolve Dispute handler
  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setResolving(true);
    try {
      await api.post(`/disputes/${selectedDispute.id}/resolve`, {
        resolution: resolutionMode,
        splitPercent: resolutionMode === 'SPLIT' ? splitPercent : undefined,
        adminNote,
      });

      showToast(`Dispute #${selectedDispute.id.slice(-6)} successfully resolved via ${resolutionMode}!`);
      setSelectedDispute(null);
      await loadDisputes();
      await handleVerifyLedger();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  // Dismiss review flag
  const handleDismissFlag = async (id: string) => {
    try {
      await api.post(`/reviews/admin/${id}/dismiss`);
      showToast('Review unflagged and verified safe.');
      await loadFlaggedReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to dismiss review flag');
    }
  };

  // Delete fraudulent review
  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fraudulent review? Trust score will be recomputed.')) return;
    try {
      await api.delete(`/reviews/admin/${id}`);
      showToast('Fraudulent review deleted and trust score updated.');
      await loadFlaggedReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  // Upgrade verification level
  const handleUpgradeVerification = async (userId: string, level: 'PHONE' | 'ID' | 'ADDRESS') => {
    try {
      await api.patch(`/users/admin/${userId}/verify`, { level });
      showToast(`Verification level upgraded to ${level}! Trust score recomputed.`);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to upgrade verification level');
    }
  };

  const openDisputesCount = disputes.filter((d) => d.status === 'OPEN').length;
  const flaggedCount = flaggedReviews.length;

  return (
    <div className="space-y-8 py-2">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-sm relative overflow-hidden bg-gradient-to-r from-rose-500/10 via-rose-100/20 to-transparent">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-bold border border-rose-200">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            <span>Administrator Console • Chennai Metro Governance</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Community Safety & Escrow Mediation
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Preserve community trust across Ramapuram, Porur, Valasaravakkam, and KK Nagar. Mediate disputes with mathematical escrow splits, moderate flagged reviews, and verify provider credentials.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleVerifyLedger}
              id="admin-verify-ledger-btn"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-slate-900/20"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Verify Double-Entry Invariant</span>
            </button>
            <Link
              to="/admin/analytics"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>Service Gap Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Double-Entry Ledger Invariant Status Card */}
      {ledgerData && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border text-xs shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            ledgerData.isValid
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-rose-50/80 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-start sm:items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-extrabold text-sm block">Double-Entry Financial Ledger Invariant</span>
              <p className="text-emerald-800 font-mono text-[11px] mt-0.5">
                Formula: sum(balances + heldBalances + platformFees) == sum(top-ups)
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] font-semibold text-emerald-900">
                <span>Active Balances: {formatINR(ledgerData.totalBalances)}</span>
                <span>•</span>
                <span>Escrow Held: {formatINR(ledgerData.totalHeld)}</span>
                <span>•</span>
                <span>Platform Fees: {formatINR(ledgerData.totalPlatformFees)}</span>
                <span>•</span>
                <span>Total Top-ups: {formatINR(ledgerData.totalTopups)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="font-mono font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-sm">
              DELTA = {formatINR(ledgerData.delta)}
            </span>
            <button
              onClick={handleVerifyLedger}
              title="Refresh Ledger Invariant"
              className="p-2 rounded-xl bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${ledgerStatus === 'VERIFYING' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'disputes'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Dispute Resolution</span>
          {openDisputesCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
              {openDisputesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Flagged Reviews</span>
          {flaggedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
              {flaggedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'verification'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Provider Verification</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'ledger'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Audit & Ledger</span>
        </button>
      </div>

      {/* TAB 1: DISPUTES MEDIATION */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Escrow Dispute Mediation Console</h2>
              <p className="text-xs text-slate-500">
                Review submitted claims, inspect audit events and chat logs, then choose 100% refund, 100% payout, or custom escrow split.
              </p>
            </div>
            <button
              onClick={loadDisputes}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-bold text-slate-700 hover:bg-stone-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDisputes ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {disputes.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-xs text-slate-500 border border-stone-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>No active or historical disputes found. The neighborhood is peaceful!</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Disputes List */}
              <div className="space-y-4">
                {disputes.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDispute(d)}
                    className={`glass-card rounded-2xl p-5 border cursor-pointer transition-all space-y-3 ${
                      selectedDispute?.id === d.id
                        ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20 bg-amber-50/20'
                        : 'border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          d.status === 'OPEN' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {d.status}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">#{d.id.slice(-6)}</span>
                      </div>
                      <span className="font-bold text-xs text-slate-900">{formatINR(d.booking.agreedPrice)} in Escrow</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{d.booking.listing.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>Reason:</strong> {d.reason}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
                      <div>
                        <span className="text-slate-500 block">Resident:</span>
                        <span className="font-bold text-slate-800">{d.booking.requester.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Provider:</span>
                        <span className="font-bold text-slate-800">{d.booking.provider.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Raised by {d.raisedBy.name}</span>
                      <Link
                        to={`/bookings/${d.bookingId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-amber-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Open Booking</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Settlement Panel */}
              <div className="space-y-4">
                {selectedDispute ? (
                  <form onSubmit={handleResolveDispute} className="glass-card rounded-2xl p-6 border border-amber-300 shadow-sm space-y-5 bg-white">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-700">
                          Mediation Action Panel
                        </span>
                        <h3 className="font-bold text-base text-slate-900">
                          Dispute #{selectedDispute.id.slice(-6)}
                        </h3>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
                        Escrow: {formatINR(selectedDispute.booking.agreedPrice)}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                      <div>
                        <strong className="text-slate-700">Resident Evidence:</strong>
                        <p className="text-slate-600 italic mt-0.5">"{selectedDispute.evidenceText}"</p>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Service: {selectedDispute.booking.listing.title} • {selectedDispute.booking.requester.name} vs {selectedDispute.booking.provider.name}
                      </div>
                    </div>

                    {selectedDispute.status === 'OPEN' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700">Mediation Settlement Mode</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setResolutionMode('REFUND')}
                              className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                                resolutionMode === 'REFUND'
                                  ? 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-400/20'
                                  : 'bg-white border-stone-200 text-slate-600'
                              }`}
                            >
                              100% Refund (Resident)
                            </button>

                            <button
                              type="button"
                              onClick={() => setResolutionMode('RELEASE')}
                              className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                                resolutionMode === 'RELEASE'
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-400/20'
                                  : 'bg-white border-stone-200 text-slate-600'
                              }`}
                            >
                              100% Release (Provider)
                            </button>

                            <button
                              type="button"
                              onClick={() => setResolutionMode('SPLIT')}
                              className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                                resolutionMode === 'SPLIT'
                                  ? 'bg-amber-50 border-amber-400 text-amber-800 ring-2 ring-amber-400/20'
                                  : 'bg-white border-stone-200 text-slate-600'
                              }`}
                            >
                              Custom Split Escrow
                            </button>
                          </div>
                        </div>

                        {resolutionMode === 'SPLIT' && (
                          <div className="space-y-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span>Resident Refund: {splitPercent}%</span>
                              <span>Provider Payout: {100 - splitPercent}%</span>
                            </div>

                            <input
                              type="range"
                              min="10"
                              max="90"
                              step="5"
                              value={splitPercent}
                              onChange={(e) => setSplitPercent(Number(e.target.value))}
                              className="w-full accent-amber-600"
                            />

                            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                              <div className="p-2 rounded-lg bg-white border border-stone-200">
                                <span className="text-[10px] text-slate-500 block">Resident Gets:</span>
                                <span className="font-extrabold text-slate-900 font-mono">
                                  {formatINR(Math.floor((selectedDispute.booking.agreedPrice * splitPercent) / 100))}
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-stone-200">
                                <span className="text-[10px] text-slate-500 block">Provider Gets:</span>
                                <span className="font-extrabold text-slate-900 font-mono">
                                  {formatINR(
                                    Math.floor(
                                      (selectedDispute.booking.agreedPrice * (100 - splitPercent)) / 100 * 0.95
                                    )
                                  )}{' '}
                                  <span className="text-[10px] text-slate-400 font-normal">(-5% fee)</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Official Admin Resolution Note</label>
                          <textarea
                            required
                            rows={3}
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs bg-white"
                            placeholder="Explain the mediation judgment..."
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={resolving}
                          id="confirm-dispute-resolution-btn"
                          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>{resolving ? 'Executing Escrow Settlement...' : 'Enforce Mediation Decision'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 text-xs text-blue-950">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span>Dispute has been settled</span>
                        </div>
                        <p><strong>Outcome:</strong> {selectedDispute.resolution}</p>
                        {selectedDispute.splitPercent && (
                          <p><strong>Split:</strong> {selectedDispute.splitPercent}% / {100 - selectedDispute.splitPercent}%</p>
                        )}
                        <p><strong>Admin Note:</strong> {selectedDispute.adminNote}</p>
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="glass-card rounded-2xl p-8 text-center text-xs text-slate-400 border border-dashed border-stone-300 flex flex-col items-center justify-center min-h-[300px]">
                    <Scale className="w-10 h-10 text-stone-300 mb-2" />
                    <span>Select an open dispute from the list to examine evidence and execute escrow settlement.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FLAGGED REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Review Moderation Queue (Rule-Based Fraud Detection)</h2>
              <p className="text-xs text-slate-500">
                Automatic safety detectors flag rapid submissions (&lt;2 min after completion with 5★), reciprocal review loops, and suspicious short praise.
              </p>
            </div>
            <button
              onClick={loadFlaggedReviews}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-bold text-slate-700 hover:bg-stone-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingReviews ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {flaggedReviews.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-xs text-slate-500 border border-stone-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>Zero flagged reviews. All resident feedback passed integrity rules.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flaggedReviews.map((rev) => (
                <div key={rev.id} className="glass-card rounded-2xl p-5 border border-amber-300 shadow-sm space-y-4 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>Fraud Rule Triggered</span>
                    </span>
                    <span className="font-bold text-xs text-amber-600">{'★'.repeat(rev.rating)}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-500">
                      <strong>{rev.reviewer.name}</strong> reviewed <strong>{rev.reviewee.name}</strong>
                    </div>
                    <p className="text-xs text-slate-800 italic bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                      "{rev.comment}"
                    </p>
                  </div>

                  {rev.flagReasons && rev.flagReasons.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                      <span className="font-bold block">Integrity Violation Flags:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {rev.flagReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => handleDismissFlag(rev.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Dismiss Flag (Safe)</span>
                    </button>
                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs border border-rose-300 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Review</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROVIDER VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Provider Verification & Trust Level-Up</h2>
              <p className="text-xs text-slate-500">
                Upgrading verification levels directly unlocks +5 to +20 points in the provider's explainable Trust Score.
              </p>
            </div>
            <button
              onClick={loadUsers}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-bold text-slate-700 hover:bg-stone-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="glass-card rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100/80 text-slate-700 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">Provider Name</th>
                    <th className="p-3.5">Neighborhood</th>
                    <th className="p-3.5">Current Verification</th>
                    <th className="p-3.5">Trust Score</th>
                    <th className="p-3.5 text-right">Verification Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {usersList
                    .filter((u) => u.isProvider)
                    .map((provider) => (
                      <tr key={provider.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div>{provider.name}</div>
                          <span className="text-[11px] text-slate-400 font-normal">{provider.email}</span>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {provider.neighborhood?.name || 'Chennai Metro'}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            provider.verificationLevel === 'ADDRESS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : provider.verificationLevel === 'ID'
                              ? 'bg-blue-100 text-blue-800'
                              : provider.verificationLevel === 'PHONE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            {provider.verificationLevel}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          <span className="text-emerald-700">🛡️ {provider.providerProfile?.trustScore ?? 0}</span> / 100
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {provider.verificationLevel === 'NONE' && (
                            <button
                              onClick={() => handleUpgradeVerification(provider.id, 'PHONE')}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-300 transition-colors"
                            >
                              + Phone (+5 pts)
                            </button>
                          )}
                          {(provider.verificationLevel === 'NONE' || provider.verificationLevel === 'PHONE') && (
                            <button
                              onClick={() => handleUpgradeVerification(provider.id, 'ID')}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[11px] border border-blue-300 transition-colors"
                            >
                              + ID (+10 pts)
                            </button>
                          )}
                          {provider.verificationLevel !== 'ADDRESS' && (
                            <button
                              onClick={() => handleUpgradeVerification(provider.id, 'ADDRESS')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300 transition-colors"
                            >
                              + Address (+5 pts)
                            </button>
                          )}
                          {provider.verificationLevel === 'ADDRESS' && (
                            <span className="text-emerald-700 font-bold text-[11px] flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Fully Verified (Max)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT & LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-stone-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Double-Entry Financial Escrow Architecture</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Neighborly uses an integer-paise double-entry ledger. No mock numbers are stored in any balance column.
              Money is held during booking creation, locked in escrow during disputes, and released atomically with a 5% platform fee upon completion or mediation settlement.
            </p>
            <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto space-y-1">
              <div>// INVARIANT EQUATION:</div>
              <div>totalBalances + totalHeld + totalPlatformFees == totalTopups</div>
              <div className="text-slate-400 mt-2">// VERIFICATION OUTCOME:</div>
              <div className="text-white">
                Status: {ledgerData?.isValid ? '✅ MATHEMATICALLY SOUND' : '❌ DISCREPANCY'} | Delta: ₹
                {(ledgerData?.delta ?? 0) / 100}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
