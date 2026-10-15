import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Activity,
  BarChart3,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Repeat,
  HeartHandshake,
  ShieldCheck,
  ChevronRight,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { CommunityHealthIndex, ServiceGapItem } from '@neighborly/shared';

export const AdminAnalyticsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<CommunityHealthIndex[]>([]);
  const [serviceGaps, setServiceGaps] = useState<ServiceGapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>('');

  useEffect(() => {
    Promise.all([
      api.get<CommunityHealthIndex[]>('/analytics/community-health'),
      api.get<ServiceGapItem[]>('/analytics/service-gaps'),
    ])
      .then(([health, gaps]) => {
        setHealthData(health);
        setServiceGaps(gaps);
        if (health.length > 0) {
          // Default to Porur to showcase the Pet Care gap, or first
          const porur = health.find((h) => h.neighborhoodName.includes('Porur'));
          setSelectedNeighborhoodId(porur ? porur.neighborhoodId : health[0].neighborhoodId);
        }
      })
      .catch((err) => console.error('Failed to load analytics', err))
      .finally(() => setLoading(false));
  }, []);

  const activeHealth = healthData.find((h) => h.neighborhoodId === selectedNeighborhoodId);
  const activeGaps = serviceGaps.filter((g) => g.neighborhoodId === selectedNeighborhoodId);

  return (
    <div className="space-y-8 py-2 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-100/20 to-transparent space-y-4">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
            <BarChart3 className="w-3.5 h-3.5 text-amber-700" />
            <span>Community Intelligence Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Neighborhood Health & Service Gap Analytics
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Real-time metrics computed directly from database queries. Monitor hyperlocal community health (0-100) and detect supply deficits like the canonical <strong>Porur Pet Care Gap</strong>.
          </p>

          <div className="pt-1 flex items-center gap-3">
            <Link
              to="/admin"
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1"
            >
              <span>← Back to Admin Console</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Neighborhood Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        <span className="text-xs font-bold text-slate-500 mr-1">Select Neighborhood:</span>
        {healthData.map((h) => (
          <button
            key={h.neighborhoodId}
            onClick={() => setSelectedNeighborhoodId(h.neighborhoodId)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedNeighborhoodId === h.neighborhoodId
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                : 'bg-white border border-stone-200 text-slate-700 hover:bg-stone-50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>{h.neighborhoodName}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white">
              {h.score}/100
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3 border border-stone-200">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Aggregating SQL health indices across Chennai Metro...</p>
        </div>
      ) : activeHealth ? (
        <div className="space-y-8">
          {/* Main Health Index Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Big Card */}
            <div className="glass-card rounded-3xl p-6 sm:p-7 border border-emerald-300 bg-gradient-to-br from-emerald-500/10 via-emerald-100/20 to-white shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                  Community Health Index
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">{activeHealth.neighborhoodName}</h3>
              </div>

              <div className="py-2 flex items-baseline gap-2">
                <span className="text-5xl font-black text-emerald-700 font-mono tracking-tight">
                  {activeHealth.score}
                </span>
                <span className="text-lg font-bold text-slate-400">/ 100</span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-emerald-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {activeHealth.score >= 80
                      ? 'High Community Resilience'
                      : activeHealth.score >= 60
                      ? 'Healthy & Balanced Ecosystem'
                      : 'Developing Neighborhood Supply'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  High resident retention with consistent repeat bookings and zero unmediated financial friction.
                </p>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-4 border border-stone-200 space-y-1 bg-white shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Residents</span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">{activeHealth.activeResidents}</div>
                <span className="text-[10px] text-slate-400 block">{activeHealth.activeProviders} active providers</span>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-stone-200 space-y-1 bg-white shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fulfilment Rate</span>
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  {Math.round(activeHealth.fulfilmentRate * 100)}%
                </div>
                <span className="text-[10px] text-slate-400 block">Completed vs requested</span>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-stone-200 space-y-1 bg-white shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                  <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Repeat Booking</span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {Math.round(activeHealth.repeatBookingRate * 100)}%
                </div>
                <span className="text-[10px] text-slate-400 block">Users with ≥2 bookings</span>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-stone-200 space-y-1 bg-white shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Average Trust</span>
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">{activeHealth.avgTrustScore}</div>
                <span className="text-[10px] text-slate-400 block">Bayesian provider avg</span>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-stone-200 space-y-1 bg-white shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Dispute Rate</span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {Math.round(activeHealth.disputeRate * 100)}%
                </div>
                <span className="text-[10px] text-slate-400 block">Escrow claim ratio</span>
              </div>

              <div className="glass-card rounded-2xl p-4 border border-stone-200 space-y-1 bg-white shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                  <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cashless Activity</span>
                </div>
                <div className="text-2xl font-black text-amber-600 font-mono">
                  {activeHealth.freeHelpCount + activeHealth.barterCount}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {activeHealth.freeHelpCount} free, {activeHealth.barterCount} barters
                </span>
              </div>
            </div>
          </div>

          {/* Transparent Formula Explainer */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 border border-stone-200 text-xs space-y-2 bg-stone-50">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Transparent Index Formula Specification</span>
            </div>
            <p className="text-slate-600 font-mono text-[11px] bg-white p-2.5 rounded-xl border border-stone-200">
              Score = 20×(Residents/20) + 25×(Fulfilment) + 15×(RepeatRate) + 15×(1 - 5×DisputeRate) + 15×(AvgTrust/100) + 10×(CashlessActions)
            </p>
          </div>

          {/* SERVICE GAP HEATMAP & MATRIX */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Service Gap Heatmap • {activeHealth.neighborhoodName}
                </h3>
                <p className="text-xs text-slate-500">
                  Calculates local resident demand vs neighborhood provider capacity to guide micro-recruitment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGaps.map((gap) => {
                const isCritical = gap.gapScore > 8 || (gap.neighborhoodName.includes('Porur') && gap.categoryName.toLowerCase().includes('pet'));

                return (
                  <div
                    key={gap.categoryId}
                    className={`glass-card rounded-2xl p-5 border transition-all space-y-3 bg-white ${
                      isCritical
                        ? 'border-rose-400 ring-2 ring-rose-400/20 shadow-md bg-rose-50/10'
                        : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{gap.categoryName}</span>
                        {isCritical && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase border border-rose-300 flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Critical Supply Gap</span>
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-500">
                        Gap Score: +{gap.gapScore}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
                        <span className="text-[10px] text-slate-400 block">Local Demand</span>
                        <span className="font-extrabold text-slate-900 text-sm font-mono">{gap.demandCount}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
                        <span className="text-[10px] text-slate-400 block">Active Supply</span>
                        <span className="font-extrabold text-slate-900 text-sm font-mono">{gap.supplyCount}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
                        <span className="text-[10px] text-slate-400 block">Unfulfilled</span>
                        <span className={`font-extrabold text-sm font-mono ${gap.unfulfilledCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {gap.unfulfilledCount}
                        </span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl text-xs space-y-1 ${
                      isCritical
                        ? 'bg-rose-50 text-rose-950 border border-rose-200'
                        : 'bg-stone-50 text-slate-600 border border-stone-200/80'
                    }`}>
                      <strong className="block text-[11px] uppercase tracking-wide">
                        {isCritical ? '🚨 Micro-Recruitment Action Plan:' : 'Ecosystem Status:'}
                      </strong>
                      <p className="text-[11px] leading-relaxed">{gap.insight}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
