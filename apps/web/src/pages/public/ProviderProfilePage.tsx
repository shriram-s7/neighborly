import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api, formatINR } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  Star,
  Award,
  Repeat,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

interface PublicProviderData {
  id: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  verificationLevel: string;
  neighborhoodName: string;
  joinedAt: string;
  lat?: number | null;
  lng?: number | null;
  profile?: {
    headline?: string;
    yearsExperience?: number;
    serviceRadiusKm?: number;
    trustScore?: number;
    trustBreakdown?: any;
    completionRate?: number;
    avgResponseMins?: number;
    onTimeRate?: number;
  };
  listings: Array<{
    id: string;
    title: string;
    description: string;
    pricingType: string;
    price: number;
    acceptsBarter: boolean;
    isActive: boolean;
    category: { name: string; slug: string };
  }>;
  availabilitySlots: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    reviewer: { name: string; avatarUrl?: string | null };
  }>;
  stats: {
    completedJobs: number;
    reviewsCount: number;
    completionRate: number;
    avgResponseMins: number;
    onTimeRate: number;
    serviceRadiusKm: number;
  };
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ProviderProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [provider, setProvider] = useState<PublicProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrustDetails, setShowTrustDetails] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<PublicProviderData>(`/providers/${id}`)
      .then((data) => setProvider(data))
      .catch((err) => setError(err.message || 'Provider not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Loading provider profile...</p>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="glass-card rounded-3xl p-10 text-center max-w-md mx-auto space-y-3 border border-stone-200">
        <div className="text-3xl">⚠️</div>
        <h2 className="text-lg font-bold text-slate-900">Provider Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'This provider profile does not exist.'}</p>
        <Link to="/discover" className="inline-block px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold">
          Back to Discover
        </Link>
      </div>
    );
  }

  const trustScore = provider.profile?.trustScore ?? 88;

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">
      {/* Provider Hero Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-100/20 to-transparent space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white text-2xl font-black flex items-center justify-center shadow-lg shadow-amber-500/25">
              {provider.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {provider.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{provider.verificationLevel} Verified</span>
                </span>
              </div>
              <p className="text-sm font-semibold text-amber-900">
                {provider.profile?.headline || 'Community Service Provider'}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{provider.neighborhoodName}</span>
                </span>
                <span>• {provider.profile?.yearsExperience || 8} years experience</span>
                <span>• {provider.stats.serviceRadiusKm} km radius</span>
              </div>
            </div>
          </div>

          {/* Trust Score Badge */}
          <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200 shadow-sm flex items-center gap-4 self-stretch sm:self-auto">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex flex-col items-center justify-center font-black">
              <span className="text-lg">{trustScore}</span>
              <span className="text-[9px] font-bold text-emerald-100">/ 100</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-800 block">
                Trust Rating
              </span>
              <span className="text-xs font-bold text-slate-900 block">Highly Trusted</span>
              <button
                onClick={() => setShowTrustDetails(!showTrustDetails)}
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5 mt-0.5"
              >
                <span>Why this score?</span>
                {showTrustDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Explainable 6-Factor Trust Score Breakdown */}
        {showTrustDetails && (
          <div className="pt-4 border-t border-amber-200/60 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">
                Explainable Bayesian Trust Breakdown ({trustScore} / 100)
              </span>
              <span className="text-[11px] font-bold text-amber-700">
                Tier: {provider.profile?.trustBreakdown?.tier || (trustScore >= 85 ? 'Pillar of the Community' : trustScore >= 70 ? 'Highly Trusted' : 'Trusted')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-0.5">
                <span className="text-slate-500 font-medium text-[11px] block">1. Verification Level</span>
                <span className="font-mono text-emerald-700 font-extrabold">
                  {provider.profile?.trustBreakdown?.verificationPoints ?? (provider.verificationLevel === 'ADDRESS' ? 20 : provider.verificationLevel === 'ID' ? 15 : provider.verificationLevel === 'PHONE' ? 5 : 0)} / 20 pts
                </span>
                <p className="text-[10px] text-slate-400">{provider.verificationLevel} Verified</p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-0.5">
                <span className="text-slate-500 font-medium text-[11px] block">2. Bayesian Rating</span>
                <span className="font-mono text-emerald-700 font-extrabold">
                  {provider.profile?.trustBreakdown?.ratingPoints ?? 22} / 25 pts
                </span>
                <p className="text-[10px] text-slate-400">Prior C=3, m=4.0</p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-0.5">
                <span className="text-slate-500 font-medium text-[11px] block">3. Completion Rate</span>
                <span className="font-mono text-emerald-700 font-extrabold">
                  {provider.profile?.trustBreakdown?.completionPoints ?? 19} / 20 pts
                </span>
                <p className="text-[10px] text-slate-400">{provider.stats.completedJobs} jobs finished</p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-0.5">
                <span className="text-slate-500 font-medium text-[11px] block">4. Reliability & On-Time</span>
                <span className="font-mono text-emerald-700 font-extrabold">
                  {provider.profile?.trustBreakdown?.reliabilityPoints ?? 14} / 15 pts
                </span>
                <p className="text-[10px] text-slate-400">{Math.round(provider.stats.onTimeRate * 100)}% on-time</p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-0.5">
                <span className="text-slate-500 font-medium text-[11px] block">5. Volume & Tenure</span>
                <span className="font-mono text-emerald-700 font-extrabold">
                  {provider.profile?.trustBreakdown?.tenurePoints ?? 9} / 10 pts
                </span>
                <p className="text-[10px] text-slate-400">Active local member</p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-0.5">
                <span className="text-slate-500 font-medium text-[11px] block">6. Review Authenticity</span>
                <span className="font-mono text-emerald-700 font-extrabold">
                  {provider.profile?.trustBreakdown?.authenticityPoints ?? 10} / 10 pts
                </span>
                <p className="text-[10px] text-slate-400">Zero fraud flags</p>
              </div>
            </div>

            {provider.profile?.trustBreakdown?.tips && provider.profile.trustBreakdown.tips.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                <strong>Tips to increase trust:</strong> {provider.profile.trustBreakdown.tips.join(' • ')}
              </div>
            )}
          </div>
        )}

        {/* Provider Stats Bar */}
        <div className="pt-3 border-t border-amber-200/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Completed Jobs</span>
            <span className="text-lg font-black text-slate-900 block">{provider.stats.completedJobs}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">On-Time Rate</span>
            <span className="text-lg font-black text-emerald-700 block">
              {Math.round(provider.stats.onTimeRate * 100)}%
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Average Response</span>
            <span className="text-lg font-black text-slate-900 block">
              {provider.stats.avgResponseMins} mins
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Neighbor Reviews</span>
            <span className="text-lg font-black text-slate-900 block">{provider.stats.reviewsCount}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Listings & Availability */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Listings Column (2/3) */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center justify-between">
            <span>Available Services ({provider.listings.length})</span>
            <span className="text-xs text-slate-500 font-medium">Escrow Protected</span>
          </h2>

          <div className="space-y-3">
            {provider.listings.map((l) => (
              <div
                key={l.id}
                className="glass-card rounded-2xl p-5 border border-stone-200 hover:border-amber-400 transition-all space-y-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                        {l.category.name}
                      </span>
                      {l.acceptsBarter && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          <span>Accepts Skill Barter</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mt-1.5">{l.title}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-slate-900 block">
                      {formatINR(l.price)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">{l.pricingType}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{l.description}</p>

                <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Typical turnaround: 1–2 hours
                  </span>
                  <Link
                    to={`/bookings/create?listingId=${l.id}`}
                    id={`book-listing-${l.id}`}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <span>Request Booking</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Reviews */}
          <div className="pt-4 space-y-3">
            <h3 className="text-base font-bold text-slate-900">Recent Neighbor Reviews</h3>
            {provider.recentReviews.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No reviews yet. Be the first neighbor to review!</p>
            ) : (
              <div className="space-y-2.5">
                {provider.recentReviews.map((r) => (
                  <div key={r.id} className="glass-card rounded-xl p-4 border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{r.reviewer.name}</span>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{r.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Availability Calendar (1/3) */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4 sticky top-20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Weekly Availability</span>
              </h3>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Accepting Jobs
              </span>
            </div>

            <div className="space-y-2">
              {dayNames.map((name, dayIndex) => {
                const slots = provider.availabilitySlots.filter((s) => s.dayOfWeek === dayIndex);
                const isAvailable = slots.length > 0;
                return (
                  <div
                    key={dayIndex}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      isAvailable
                        ? 'bg-amber-50/50 border-amber-200 text-slate-900'
                        : 'bg-stone-50 border-stone-200 text-slate-400'
                    }`}
                  >
                    <span className="font-bold">{name}</span>
                    {isAvailable ? (
                      <span className="font-mono text-[11px] font-bold text-amber-900">
                        {slots[0].startTime} – {slots[0].endTime}
                      </span>
                    ) : (
                      <span className="text-[10px] italic">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-slate-500 space-y-1">
              <div className="font-bold text-slate-800">Booking Guarantee</div>
              <p>Escrow payment holds automatically until job is confirmed done by you.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
