import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  ShieldCheck,
  Repeat,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  Coins,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  const neighborhoods = [
    { name: 'Ramapuram', tag: 'High Activity', count: '28+ Neighbors' },
    { name: 'Porur', tag: 'High Demand', count: '22+ Neighbors' },
    { name: 'Valasaravakkam', tag: 'Active Barters', count: '18+ Neighbors' },
    { name: 'KK Nagar', tag: 'Top Rated', count: '24+ Neighbors' },
  ];

  const features = [
    {
      icon: Sparkles,
      color: 'text-amber-600 bg-amber-50',
      title: 'Explainable Smart Matching',
      desc: 'Transparent 6-factor score showing exact breakdown of skill, distance, availability, ratings, price, and reliability.',
    },
    {
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-50',
      title: 'Escrow-Protected Payments',
      desc: 'Funds held securely until the job is done. Full refund guarantee on disputes and automatic releases after 48 hours.',
    },
    {
      icon: Repeat,
      color: 'text-indigo-600 bg-indigo-50',
      title: 'Skill Barter & Time-Banking',
      desc: 'Trade hours directly: teach math in exchange for tailoring. Both neighbors earn community credits on completion.',
    },
    {
      icon: HeartHandshake,
      color: 'text-rose-600 bg-rose-50',
      title: 'Community Free Help',
      desc: 'Lend a ladder, help carry furniture, or assist an elder. Neighbors help neighbors and earn recognition credits.',
    },
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-500/10 via-amber-100/30 to-transparent p-8 sm:p-12 border border-amber-200/60 shadow-sm">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold tracking-wide shadow-sm">
            <span>✨ Hyperlocal Community Services</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Chennai Neighborhoods</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Everyday help from neighbors you can{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
              actually trust.
            </span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Need an electrician, tutor, home cook, or tailor in your street? Discover verified neighbors,
            enjoy transparent explainable matching, and book with escrow peace of mind.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link
                to="/discover"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Search className="w-5 h-5" />
                <span>Explore Services in {user.neighborhoodName || 'Chennai'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>Join Your Neighborhood</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 font-bold text-base border border-stone-300 shadow-sm transition-all"
                >
                  <span>Try One-Click Demo Logins</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Neighborhood chips */}
        <div className="mt-12 pt-8 border-t border-amber-200/50">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-4">
            Currently live across Chennai communities
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {neighborhoods.map((n) => (
              <div
                key={n.name}
                className="glass-card rounded-2xl p-3.5 text-center border border-amber-100 hover:border-amber-300 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-center gap-1 text-slate-900 font-bold text-sm">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{n.name}</span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-amber-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{n.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Pillars Feature Cards */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Engineered for High-Trust Local Exchange
          </h2>
          <p className="text-sm text-slate-500">
            Not just another classifieds board. Neighborly brings mathematical explainability and financial safety to street-level help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="glass-card rounded-2xl p-6 border border-stone-200 hover:border-amber-300 transition-all shadow-sm space-y-3"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color} shadow-sm`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Walkthrough */}
      <section className="rounded-3xl bg-stone-900 text-white p-8 sm:p-12 space-y-8 shadow-xl">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Simple 4-Step Journey</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">From Request to Fair Payment</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Express Your Need',
              desc: 'Type naturally: "need ceiling fan repair tomorrow evening". AI parser detects category, urgency and budget.',
            },
            {
              step: '02',
              title: 'Explainable Match',
              desc: 'See ranked nearby neighbors with full factor breakdown: distance, skill overlap, availability, and trust.',
            },
            {
              step: '03',
              title: 'Escrow Hold',
              desc: 'Agreed fee is locked safely into escrow. Provider accepts, confirms slot, and arrives on time.',
            },
            {
              step: '04',
              title: 'Release & Review',
              desc: 'Confirm job completion to release payment minus a 5% platform fee. Both neighbors update community trust.',
            },
          ].map((s) => (
            <div key={s.step} className="space-y-2 border-t border-stone-700 pt-4">
              <span className="font-mono text-2xl font-black text-amber-400">{s.step}</span>
              <h4 className="font-bold text-base text-white">{s.title}</h4>
              <p className="text-xs text-stone-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
