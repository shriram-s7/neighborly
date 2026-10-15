import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, formatINR } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Zap,
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Tag,
  DollarSign,
  Sliders,
  Calendar,
  ArrowRight,
  Info,
  TrendingUp,
} from 'lucide-react';
import {
  RequestUrgency,
  MatchResult,
  ParsedRequestResult,
  PriceEstimateResult,
} from '@neighborly/shared';

const PRESETS = [
  {
    label: '⚡ Urgent Leaking Pipe',
    text: 'Urgent: leaking tap in my kitchen in Ramapuram, need help today around 6pm, budget around 400',
  },
  {
    label: '📚 Class 10 Math Tutoring',
    text: 'Looking for a CBSE Class 10 math tutor in Porur for weekly sessions, budget 600 rupees per hour',
  },
  {
    label: '⚡ Sparking Switchboard',
    text: 'Emergency: bedroom electrical switchboard sparking, need an electrician right now in Valasaravakkam, budget 500',
  },
  {
    label: '🐾 Pet Care Weekend',
    text: 'Need pet sitting for my labrador dog this weekend in KK Nagar, flexible schedule, budget 800',
  },
];

export const SmartRequestPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [promptText, setPromptText] = useState(PRESETS[0].text);
  const [parsing, setParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedRequestResult | null>(null);

  // Editable chips state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [urgency, setUrgency] = useState<RequestUrgency>(RequestUrgency.URGENT);
  const [budgetPaise, setBudgetPaise] = useState<number | undefined>(40000);
  const [isUrgentMode, setIsUrgentMode] = useState<boolean>(true);

  // Category and Price Estimation
  const [categories, setCategories] = useState<any[]>([]);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimateResult | null>(null);

  // Matching Engine Results
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    api.get<any[]>('/categories').then((data) => {
      setCategories(data);
    });
  }, []);

  // Parse text whenever prompt is submitted or initialized
  const handleParse = async (textToParse?: string) => {
    const text = textToParse ?? promptText;
    if (!text.trim()) return;

    setParsing(true);
    try {
      const res = await api.post<ParsedRequestResult>('/matching/parse', { text });
      setParsedResult(res);

      if (res.categoryId) {
        setSelectedCategoryId(res.categoryId);
      }
      setUrgency(res.urgency);
      setIsUrgentMode(res.urgency === RequestUrgency.URGENT);
      if (res.budgetMax) {
        setBudgetPaise(res.budgetMax);
      }

      // Load fair price estimate for this category
      if (res.categoryId) {
        loadPriceEstimate(res.categoryId);
      }

      // Automatically search matches
      await runSearch({
        categoryId: res.categoryId ?? undefined,
        budgetMax: res.budgetMax ?? undefined,
        urgency: res.urgency,
        isUrgentMode: res.urgency === RequestUrgency.URGENT,
      });
    } catch (err) {
      console.error('Parse error', err);
    } finally {
      setParsing(false);
    }
  };

  const loadPriceEstimate = async (catId: string) => {
    try {
      const est = await api.get<PriceEstimateResult>(
        `/matching/pricing-estimate?categoryId=${catId}${
          user?.neighborhoodId ? `&neighborhoodId=${user.neighborhoodId}` : ''
        }`,
      );
      setPriceEstimate(est);
    } catch (err) {
      console.error('Failed to load price estimate', err);
    }
  };

  const runSearch = async (overrides?: any) => {
    setMatching(true);
    try {
      const searchCatId = overrides?.categoryId ?? selectedCategoryId;
      const searchBudget = overrides?.budgetMax ?? budgetPaise;
      const searchUrgency = overrides?.urgency ?? urgency;
      const searchUrgentMode = overrides?.isUrgentMode ?? isUrgentMode;

      const res = await api.post<MatchResult[]>('/matching/search', {
        categoryId: searchCatId || undefined,
        budgetMax: searchBudget,
        urgency: searchUrgency,
        isUrgentMode: searchUrgentMode,
        requesterLat: user?.lat ?? 13.0315,
        requesterLng: user?.lng ?? 80.1815,
        neighborhoodId: user?.neighborhoodId ?? undefined,
      });

      setMatches(res);
      if (res.length > 0) {
        setExpandedMatchId(res[0].listingId);
      }
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setMatching(false);
    }
  };

  // Initial parse on load
  useEffect(() => {
    handleParse(PRESETS[0].text);
  }, []);

  return (
    <div className="space-y-8 py-2 max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-100/20 to-transparent space-y-4">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Natural Language Parser & 6-Factor Matching</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Smart Neighborhood Service Dispatch
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Type your request in plain English or Tamil-English. Our offline NLP engine extracts category, urgency, and budget, then matches the best local providers with 100% transparent factor breakdowns.
          </p>
        </div>
      </div>

      {/* Natural Language Prompt Input */}
      <div className="glass-card rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4 bg-white">
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Describe What You Need</span>
          </label>

          <div className="relative">
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. Urgent: leaking pipe in kitchen in Ramapuram, need help today, budget 400..."
              className="w-full px-4 py-3 rounded-2xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-stone-50/50"
            />
            <button
              onClick={() => handleParse()}
              disabled={parsing}
              className="absolute right-3 bottom-3 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>{parsing ? 'Parsing...' : 'Analyze & Match'}</span>
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400">Try quick demos:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPromptText(p.text);
                handleParse(p.text);
              }}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-[11px] font-semibold text-slate-700 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Chips & Controls */}
      {parsedResult && (
        <div className="glass-card rounded-2xl p-5 border border-amber-300 bg-amber-50/30 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Parsed Extraction:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                {Math.round(parsedResult.confidence * 100)}% Confidence
              </span>
            </div>

            {/* Urgent Mode Toggle */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
              <Zap className={`w-4 h-4 ${isUrgentMode ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-slate-700">Urgent Mode:</span>
              <button
                type="button"
                onClick={() => {
                  const next = !isUrgentMode;
                  setIsUrgentMode(next);
                  runSearch({ isUrgentMode: next });
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isUrgentMode ? 'bg-amber-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isUrgentMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Interactive Chips Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 shadow-sm">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-slate-500 font-medium">Category:</span>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  loadPriceEstimate(e.target.value);
                  runSearch({ categoryId: e.target.value });
                }}
                className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-slate-500 font-medium">Urgency:</span>
              <select
                value={urgency}
                onChange={(e) => {
                  const u = e.target.value as RequestUrgency;
                  setUrgency(u);
                  setIsUrgentMode(u === RequestUrgency.URGENT);
                  runSearch({ urgency: u, isUrgentMode: u === RequestUrgency.URGENT });
                }}
                className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value={RequestUrgency.URGENT}>URGENT (35% Proximity)</option>
                <option value={RequestUrgency.NORMAL}>NORMAL</option>
                <option value={RequestUrgency.LOW}>LOW / Flexible</option>
              </select>
            </div>

            {/* Budget Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 shadow-sm">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500 font-medium">Max Budget:</span>
              <input
                type="number"
                step="50"
                value={budgetPaise ? budgetPaise / 100 : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) * 100 : undefined;
                  setBudgetPaise(val);
                  runSearch({ budgetMax: val });
                }}
                placeholder="None"
                className="w-16 font-bold text-slate-900 bg-transparent focus:outline-none"
              />
            </div>

            {parsedResult.parsedChips.time && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold text-slate-800">{parsedResult.parsedChips.time}</span>
              </div>
            )}
          </div>

          {/* Fair-Price Estimator Hint */}
          {priceEstimate && (
            <div className="p-3 rounded-xl bg-white border border-emerald-300/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-700">
                  <strong>Fair Price Intelligence:</strong> Historical completed bookings in{' '}
                  {priceEstimate.neighborhoodName || 'Chennai'} range from{' '}
                  <span className="font-bold text-emerald-800 font-mono">
                    {formatINR(priceEstimate.p25)}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-emerald-800 font-mono">
                    {formatINR(priceEstimate.p75)}
                  </span>{' '}
                  (Median{' '}
                  <span className="font-extrabold text-slate-900 font-mono">
                    {formatINR(priceEstimate.median)}
                  </span>
                  ).
                </span>
              </div>
              {priceEstimate.isFallback && (
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                  (City-wide aggregation baseline)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Weighting Formula Transparency Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2">
        <div className="flex items-center justify-between font-bold">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Active Matching Weights ({isUrgentMode ? '⚡ Urgent Mode' : 'Standard Mode'})</span>
          </span>
          <span className="text-slate-400 font-mono text-[11px]">Sum = 100%</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[11px]">
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 block">Distance</span>
            <span className="font-bold text-amber-400">{isUrgentMode ? '35%' : '20%'}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 block">Skill Match</span>
            <span className="font-bold text-amber-400">{isUrgentMode ? '20%' : '30%'}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 block">Availability</span>
            <span className="font-bold text-amber-400">{isUrgentMode ? '20%' : '15%'}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 block">Trust Rating</span>
            <span className="font-bold text-amber-400">{isUrgentMode ? '10%' : '15%'}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 block">Reliability</span>
            <span className="font-bold text-amber-400">10%</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-slate-400 block">Price Fit</span>
            <span className="font-bold text-amber-400">{isUrgentMode ? '5%' : '10%'}</span>
          </div>
        </div>
      </div>

      {/* Matched Providers Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            Ranked Provider Matches ({matches.length})
          </h2>
          <span className="text-xs text-slate-500">Sorted by Composite Score</span>
        </div>

        {matching ? (
          <div className="glass-card rounded-2xl p-12 text-center space-y-3 border border-stone-200">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">Computing 6-factor composite scores across Chennai...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-xs text-slate-500 border border-stone-200">
            No active providers found matching this category. Try adjusting budget or category.
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((m, idx) => {
              const isExpanded = expandedMatchId === m.listingId;

              return (
                <div
                  key={m.listingId}
                  className={`glass-card rounded-2xl border transition-all overflow-hidden ${
                    idx === 0
                      ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md bg-white'
                      : 'border-stone-200 shadow-sm bg-white'
                  }`}
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Top Match Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start space-x-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-md shadow-amber-600/20">
                          {m.providerName.charAt(0)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-slate-900">
                              {m.providerName}
                            </h3>
                            {idx === 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-300">
                                Best Match #1
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-semibold text-slate-700">{m.title}</h4>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-600" />
                              <span>{m.distanceKm} km away</span>
                            </span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Trust {m.trustScore}/100</span>
                            </span>
                            <span>•</span>
                            <span className="text-amber-600 font-bold">★ {m.rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* Score & Book Button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Composite Score</div>
                          <div className="text-2xl font-black text-amber-600 font-mono tracking-tight">
                            {m.totalScore}
                            <span className="text-xs font-normal text-slate-400">/100</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedMatchId(isExpanded ? null : m.listingId)}
                            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1"
                          >
                            <span>Why this match?</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <Link
                            to={`/bookings/create?listingId=${m.listingId}`}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center gap-1"
                          >
                            <span>Book ({formatINR(m.price)})</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Explainable Factor Accordion */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-stone-100 space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-900">
                            Transparent Factor Contributions
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Total: {m.totalScore} pts
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {m.breakdown.map((f) => (
                            <div
                              key={f.factor}
                              className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 capitalize">
                                  {f.factor} ({Math.round(f.weight * 100)}%)
                                </span>
                                <span className="font-mono font-extrabold text-emerald-700">
                                  +{f.contribution} pts
                                </span>
                              </div>

                              {/* Mini progress bar */}
                              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.round(f.rawValue * 100)}%` }}
                                />
                              </div>

                              <p className="text-[11px] text-slate-500 mt-1">{f.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
