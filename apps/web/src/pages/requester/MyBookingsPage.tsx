import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, formatINR } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { BookingStatus } from '@neighborly/shared';
import {
  Calendar,
  Clock,
  ShieldCheck,
  Lock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface BookingItem {
  id: string;
  status: BookingStatus;
  scheduledAt: string;
  agreedPrice: number;
  paymentMode: string;
  listing: { title: string; category: { name: string } };
  requester: { name: string };
  provider: { name: string; providerProfile?: { trustScore: number } };
}

export const MyBookingsPage: React.FC = () => {
  const { user, isProviderMode } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requester' | 'provider'>(
    isProviderMode ? 'provider' : 'requester',
  );

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await api.get<BookingItem[]>(`/bookings/my-bookings?roleTab=${activeTab}`);
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeTab === 'provider' ? 'Provider Job Queue' : 'My Service Bookings'}
          </h1>
          <p className="text-xs text-slate-500">
            Track real-time state machine progress, appointments, and escrow releases
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-stone-100 border border-stone-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('requester')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'requester' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            As Requester
          </button>
          <button
            onClick={() => setActiveTab('provider')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'provider' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            As Provider
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 border border-stone-200 animate-pulse h-24"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-stone-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl">
            📋
          </div>
          <h3 className="font-bold text-base text-slate-900">
            No {activeTab === 'provider' ? 'incoming jobs' : 'bookings'} yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'provider'
              ? 'When neighbors book your services, incoming job requests will appear here.'
              : 'Browse verified providers in your street and book everyday services with escrow protection.'}
          </p>
          <Link
            to={activeTab === 'provider' ? '/provider/listings' : '/discover'}
            className="inline-block px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
          >
            {activeTab === 'provider' ? 'Manage Service Listings' : 'Explore Services Nearby'}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="glass-card rounded-2xl p-5 border border-stone-200 hover:border-amber-400 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                    {b.listing.category.name}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      b.status === BookingStatus.PAID || b.status === BookingStatus.REVIEWED
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : b.status === BookingStatus.IN_PROGRESS
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-blue-100 text-blue-900 border-blue-300'
                    }`}
                  >
                    ● {b.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">#{b.id.slice(-6)}</span>
                </div>

                <h3 className="font-bold text-base text-slate-900">{b.listing.title}</h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>
                    {activeTab === 'provider' ? `Requester: ${b.requester.name}` : `Provider: ${b.provider.name}`}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{new Date(b.scheduledAt).toLocaleString()}</span>
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100 shrink-0">
                <span className="text-base font-black text-slate-900 block leading-tight">
                  {formatINR(b.agreedPrice)}
                </span>
                <Link
                  to={`/bookings/${b.id}`}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-colors"
                >
                  <span>Open Timeline & Chat</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
