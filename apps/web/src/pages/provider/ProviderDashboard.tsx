import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, formatINR } from '../../lib/api';
import {
  ShieldCheck,
  Award,
  Clock,
  TrendingUp,
  MapPin,
  Calendar,
  PlusCircle,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Wallet,
} from 'lucide-react';

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [wallet, setWallet] = useState<{ balance: number; heldBalance: number } | null>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [incomingJobs, setIncomingJobs] = useState<any[]>([]);

  useEffect(() => {
    api.get<{ balance: number; heldBalance: number }>('/wallet/me').then(setWallet).catch(() => {});
    api.get<any[]>('/listings/my-listings').then(setMyListings).catch(() => {});
    api.get<any[]>('/bookings/my-bookings?roleTab=provider').then(setIncomingJobs).catch(() => {});
  }, []);

  const trustScore = user?.trustScore ?? 88;

  const trustBreakdown = [
    { label: 'Address & ID Verification', points: 25, max: 25, status: 'Full Points' },
    { label: 'Bayesian Rating (4.9★)', points: 23, max: 25, status: 'Top 5%' },
    { label: 'Completion Rate (96%)', points: 19, max: 20, status: 'Excellent' },
    { label: 'On-time & Fast Response (14m)', points: 9, max: 10, status: 'Very High' },
    { label: 'Tenure & Job Volume', points: 6, max: 10, status: 'Growing' },
    { label: 'Review Authenticity (Zero flags)', points: 8, max: 10, status: 'Clean' },
  ];

  return (
    <div className="space-y-8 py-2">
      {/* Provider Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-sm relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-emerald-100/20 to-transparent">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Provider Mode Active • {user?.neighborhoodName || 'Ramapuram'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Provider Dashboard: {user?.name}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Manage your service listings, view incoming neighbor requests, track escrow releases, and build your community trust badge.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/provider/listings"
              id="provider-manage-listings-btn"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Manage Service Listings</span>
            </Link>
            <Link
              to="/provider/availability"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Weekly Availability</span>
            </Link>
            <Link
              to="/wallet"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Wallet className="w-4 h-4 text-amber-600" />
              <span>Earnings & Escrow</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Trust Score & Badging Card (Explainable Trust Engine) */}
      <div className="glass-card rounded-2xl p-6 border border-emerald-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex flex-col items-center justify-center shadow-md shadow-emerald-600/20">
              <span className="text-xl font-black">{trustScore}</span>
              <span className="text-[10px] font-bold tracking-tight text-emerald-100">/ 100</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wide border border-emerald-300">
                  Highly Trusted Provider
                </span>
                <span className="text-xs text-slate-500 font-semibold">• Top 5% in Ramapuram</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Transparent Community Trust Score
              </h2>
              <p className="text-xs text-slate-500">
                Calculated dynamically from verified identity, ratings, completion rates, and response times.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            id="toggle-trust-breakdown-btn"
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>{showBreakdown ? 'Hide Breakdown' : 'Why this score?'}</span>
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expandable Breakdown Drawer */}
        {showBreakdown && (
          <div className="pt-4 border-t border-stone-100 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trustBreakdown.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {item.points} / {item.max} pts
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{ width: `${(item.points / item.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>{item.status}</span>
                    <span>Weight applied</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Next badge milestone:</span> Complete 5 more on-time jobs with zero disputes to unlock the{' '}
                <span className="font-extrabold text-amber-800">"Pillar of the Community"</span> badge (90+ score)!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Provider Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm text-center space-y-1">
          <span className="text-xs text-slate-500 font-medium">Completion Rate</span>
          <span className="text-2xl font-black text-slate-900 block">96%</span>
          <span className="text-[10px] text-emerald-600 font-bold">24 of 25 jobs completed</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm text-center space-y-1">
          <span className="text-xs text-slate-500 font-medium">Avg Response</span>
          <span className="text-2xl font-black text-slate-900 block">14 mins</span>
          <span className="text-[10px] text-emerald-600 font-bold">Lightning fast</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm text-center space-y-1">
          <span className="text-xs text-slate-500 font-medium">On-Time Arrival</span>
          <span className="text-2xl font-black text-slate-900 block">94%</span>
          <span className="text-[10px] text-emerald-600 font-bold">Reliable neighbor</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm text-center space-y-1">
          <span className="text-xs text-slate-500 font-medium">Service Radius</span>
          <span className="text-2xl font-black text-slate-900 block">5.0 km</span>
          <span className="text-[10px] text-slate-500 font-medium">Around Ramapuram</span>
        </div>
      </div>

      {/* Incoming Jobs / Active Listings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Active Service Listings</h3>
            <Link
              to="/provider/listings"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              + Add Listing
            </Link>
          </div>

          {myListings.length === 0 ? (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-500 text-center">
              No active listings yet. Click "+ Add Listing" to start offering services!
            </div>
          ) : (
            myListings.slice(0, 3).map((l) => (
              <div key={l.id} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {l.category?.name || 'Service'}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{l.title}</h4>
                  </div>
                  <span className="font-black text-sm text-slate-900">{formatINR(l.price)}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{l.description}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
                  <span className="text-emerald-700 font-bold">✓ Active</span>
                  {l.acceptsBarter && <span>• Barter Accepted (Trade hours)</span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Earnings & Escrow</h3>
              <Link
                to="/wallet"
                className="text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                View Ledger
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-xs text-emerald-800 font-semibold block">Available Balance</span>
                <span className="text-xl font-black text-emerald-950 mt-1 block">
                  {formatINR(wallet?.balance ?? 0)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="text-xs text-amber-800 font-semibold block">Held in Escrow</span>
                <span className="text-xl font-black text-amber-950 mt-1 block">
                  {formatINR(wallet?.heldBalance ?? 0)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Protected by double-entry ledger: funds held in escrow until neighbor confirms completion or auto-releases after 48h.
            </p>
          </div>

          {/* Incoming Job Queue */}
          <div className="glass-card rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                <span>Incoming Jobs Queue</span>
                {incomingJobs.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                    {incomingJobs.length}
                  </span>
                )}
              </h3>
              <Link to="/provider/jobs" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
                View All
              </Link>
            </div>

            {incomingJobs.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No pending job requests at this moment.</p>
            ) : (
              incomingJobs.slice(0, 2).map((j) => (
                <div key={j.id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {j.status}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{j.listing?.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      From: {j.requester?.name} • {new Date(j.scheduledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/bookings/${j.id}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0"
                  >
                    Open Job
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
