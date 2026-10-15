import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, formatINR } from '../../lib/api';
import {
  Search,
  Wrench,
  ShieldCheck,
  Zap,
  BookOpen,
  Utensils,
  Scissors,
  Laptop,
  Dog,
  Sparkles,
  ArrowRight,
  HandHeart,
  Repeat,
  Wallet,
  Clock,
  MapPin,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  _count: {
    listings: number;
    requests: number;
  };
}

const iconMap: Record<string, any> = {
  Zap,
  Wrench,
  BookOpen,
  Utensils,
  Scissors,
  Laptop,
  Dog,
  Sparkles,
};

export const RequesterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [wallet, setWallet] = useState<{ balance: number; credits: number } | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<CategoryItem[]>('/categories'),
      api.get<{ balance: number; credits: number }>('/wallet/me'),
      api.get<any[]>('/bookings/my-bookings?roleTab=requester'),
    ])
      .then(([catData, walletData, bookingsData]) => {
        setCategories(catData);
        setWallet(walletData);
        setRecentBookings(bookingsData);
      })
      .catch((err) => console.error('Failed to load dashboard data:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 py-2">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-100/20 to-transparent">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>Hyperlocal Neighborhood: {user?.neighborhoodName || 'Chennai'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Vanakkam, {user?.name}! 👋
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Discover verified neighbors nearby for quick repairs, tutoring, home-cooked food, or trade skills with time-banking.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/request/smart"
              id="dashboard-smart-dispatch-btn"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Smart Dispatch (NLP Matcher)</span>
            </Link>
            <Link
              to="/discover"
              id="dashboard-search-services-btn"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-amber-600" />
              <span>Browse Directory & Map</span>
            </Link>
            <Link
              to="/barter"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Repeat className="w-4 h-4 text-indigo-600" />
              <span>Skill Barter Board</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metrics & Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Verification Level</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>{user?.verificationLevel || 'NONE'} Verified</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            ✓
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Community Credits</span>
            <span className="text-lg font-black text-amber-600 mt-0.5 block">
              {wallet?.credits ?? 0} Credits
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Wallet Balance</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">
              {formatINR(wallet?.balance ?? 0)}
            </span>
          </div>
          <Link
            to="/wallet"
            className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 flex items-center justify-center transition-colors"
            title="Open Wallet"
          >
            <Wallet className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Service Categories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Explore Neighborhood Services</h2>
            <p className="text-xs text-slate-500">Everyday essentials within walking or short scooter distance</p>
          </div>
          <Link
            to="/discover"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((c) => {
            const Icon = (c.icon && iconMap[c.icon]) || Wrench;
            return (
              <Link
                key={c.id}
                to={`/discover?category=${c.slug}`}
                className="glass-card rounded-2xl p-5 border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-700 flex items-center justify-center mb-3 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {c._count.listings} active {c._count.listings === 1 ? 'provider' : 'providers'}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent / Active Bookings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Your Recent Bookings</h2>
            <p className="text-xs text-slate-500">Live escrow status and service appointments</p>
          </div>
          {recentBookings.length > 0 && (
            <Link
              to="/bookings"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>View All ({recentBookings.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {recentBookings.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 border border-stone-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">No active service bookings yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Post what you need or pick an electrician, tutor or tailor from your neighborhood directory.
            </p>
            <div className="pt-2">
              <Link
                to="/discover"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors"
              >
                <span>Find a Provider Nearby</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.slice(0, 3).map((b) => (
              <div
                key={b.id}
                className="glass-card rounded-2xl p-4 sm:p-5 border border-stone-200 hover:border-amber-400 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                      {b.listing?.category?.name || 'Service'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        b.status === 'PAID' || b.status === 'REVIEWED'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : b.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-blue-100 text-blue-900 border-blue-300'
                      }`}
                    >
                      ● {b.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">#{b.id.slice(-6)}</span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">{b.listing?.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Provider: <strong className="text-slate-700">{b.provider?.name}</strong></span>
                    <span>•</span>
                    <span>{new Date(b.scheduledAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-stone-100">
                  <span className="text-base font-black text-slate-900">{formatINR(b.agreedPrice)}</span>
                  <Link
                    to={`/bookings/${b.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-colors"
                  >
                    <span>View Status</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
