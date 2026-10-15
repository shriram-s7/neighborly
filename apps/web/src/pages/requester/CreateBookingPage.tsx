import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api, formatINR } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { BookingPaymentMode } from '@neighborly/shared';
import {
  Calendar,
  Clock,
  ShieldCheck,
  Lock,
  Wallet,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  pricingType: string;
  acceptsBarter: boolean;
  category: { name: string };
  provider: {
    id: string;
    name: string;
    neighborhoodName?: string;
    trustScore: number;
    availabilitySlots: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
  };
}

interface WalletData {
  balance: number;
  heldBalance: number;
  credits: number;
}

export const CreateBookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listingId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [paymentMode, setPaymentMode] = useState<BookingPaymentMode>(BookingPaymentMode.WALLET);

  useEffect(() => {
    if (!listingId) return;
    Promise.all([
      api.get<any>(`/listings/${listingId}`),
      api.get<WalletData>('/wallet/me'),
    ])
      .then(([lData, wData]) => {
        setListing(lData);
        setWallet(wData);
      })
      .catch((err) => setErrorMessage(err.message || 'Failed to load booking details'))
      .finally(() => setLoading(false));
  }, [listingId]);

  const hasSufficientBalance = wallet ? wallet.balance >= (listing?.price ?? 0) : false;

  const handleQuickTopup = async () => {
    try {
      await api.post('/wallet/topup', { amount: 100000 }); // + ₹1,000
      const w = await api.get<WalletData>('/wallet/me');
      setWallet(w);
      setErrorMessage(null);
    } catch (err: any) {
      alert(err.message || 'Top-up failed');
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const booking = await api.post<any>('/bookings', {
        listingId: listing.id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        paymentMode,
      });

      navigate(`/bookings/${booking.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500">Preparing booking and escrow details...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center max-w-md mx-auto space-y-3 border border-stone-200">
        <div className="text-3xl">⚠️</div>
        <h3 className="font-bold text-base text-slate-900">Service listing not found</h3>
        <Link to="/discover" className="inline-block px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold">
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Confirm Service Booking
        </h1>
        <p className="text-xs text-slate-500">
          Your payment will be secured in escrow and only released when the work is completed
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {!hasSufficientBalance && (
            <button
              onClick={handleQuickTopup}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs shrink-0 hover:bg-rose-700"
            >
              + Quick Top Up ₹1,000
            </button>
          )}
        </div>
      )}

      {/* Selected Service Card */}
      <div className="glass-card rounded-2xl p-5 border border-amber-200 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              {listing.category.name}
            </span>
            <h2 className="text-base font-extrabold text-slate-900 mt-1">{listing.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
              <span className="font-bold text-slate-900">{listing.provider.name}</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Trust {listing.provider.trustScore}/100</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl font-black text-slate-900 block">{formatINR(listing.price)}</span>
            <span className="text-[10px] text-slate-500">{listing.pricingType}</span>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleConfirmBooking} className="glass-card rounded-2xl p-6 border border-stone-200 space-y-5 shadow-sm">
        {/* Preferred Date & Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Select Preferred Date & Time *</span>
          </label>
          <input
            type="datetime-local"
            required
            id="booking-scheduled-at-input"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white font-mono"
          />
        </div>

        {/* Payment Mode Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-amber-600" />
            <span>Payment Method</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                paymentMode === BookingPaymentMode.WALLET
                  ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                  : 'bg-white border-stone-200'
              }`}
            >
              <input
                type="radio"
                name="paymentMode"
                value={BookingPaymentMode.WALLET}
                checked={paymentMode === BookingPaymentMode.WALLET}
                onChange={() => setPaymentMode(BookingPaymentMode.WALLET)}
                className="mt-0.5 text-amber-600"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">Neighborly Escrow Wallet</span>
                <span className="text-[11px] text-slate-500 block">
                  Balance: {formatINR(wallet?.balance ?? 0)}
                </span>
              </div>
            </label>

            {listing.acceptsBarter && (
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  paymentMode === BookingPaymentMode.CREDITS
                    ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
                    : 'bg-white border-stone-200'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value={BookingPaymentMode.CREDITS}
                  checked={paymentMode === BookingPaymentMode.CREDITS}
                  onChange={() => setPaymentMode(BookingPaymentMode.CREDITS)}
                  className="mt-0.5 text-indigo-600"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">Community Credits</span>
                  <span className="text-[11px] text-slate-500 block">
                    Available: {wallet?.credits ?? 0} credits
                  </span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Escrow Guarantee Notice */}
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-800">
            <Lock className="w-3.5 h-3.5" />
            <span>Escrow Protection Active</span>
          </div>
          <p className="text-[11px] text-emerald-900 leading-relaxed">
            {formatINR(listing.price)} will be moved from your available balance to held escrow.
            The provider will be paid only after you confirm satisfaction (or automatically after 48h).
            You can cancel or dispute anytime before completion for a full refund.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-between gap-4">
          <Link to="/discover" className="text-xs font-bold text-slate-500 hover:text-slate-800">
            Cancel
          </Link>

          {!hasSufficientBalance ? (
            <button
              type="button"
              onClick={handleQuickTopup}
              className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20"
            >
              Top Up Wallet & Continue
            </button>
          ) : (
            <button
              type="submit"
              id="confirm-booking-submit-btn"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Locking Escrow...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirm Booking & Lock Escrow ({formatINR(listing.price)})</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
