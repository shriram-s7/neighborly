import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, formatINR } from '../../lib/api';
import { MarketplaceMap } from '../../components/maps/MarketplaceMap';
import {
  Search,
  MapPin,
  ShieldCheck,
  Repeat,
  SlidersHorizontal,
  Map as MapIcon,
  List as ListIcon,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle,
  Clock,
  Star,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface NeighborhoodItem {
  id: string;
  name: string;
  city: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

interface ListingItem {
  id: string;
  title: string;
  description: string;
  pricingType: string;
  price: number;
  acceptsBarter: boolean;
  distanceKm: number;
  isWithinRadius: boolean;
  category: { id: string; name: string; slug: string };
  provider: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    verificationLevel: string;
    neighborhoodName: string;
    headline: string;
    yearsExperience: number;
    trustScore: number;
    lat: number;
    lng: number;
    slotsCount: number;
    completedJobsCount: number;
    reviewsCount: number;
  };
}

export const DiscoverPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodItem[]>([]);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || '',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>(
    user?.neighborhoodId || '',
  );
  const [barterOnly, setBarterOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'trustScore' | 'priceAsc' | 'priceDesc'>(
    'distance',
  );
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>();

  // Fetch categories and neighborhoods on mount
  useEffect(() => {
    Promise.all([
      api.get<CategoryItem[]>('/categories'),
      api.get<NeighborhoodItem[]>('/neighborhoods'),
    ])
      .then(([catData, nData]) => {
        setCategories(catData);
        setNeighborhoods(nData);
        if (!selectedNeighborhoodId && nData.length > 0) {
          setSelectedNeighborhoodId(nData[0].id);
        }
      })
      .catch((err) => console.error('Failed to load filter metadata:', err));
  }, []);

  // Fetch listings on filter change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) {
      // Find category ID from slug or ID
      const cat = categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory);
      if (cat) params.append('categoryId', cat.id);
    }
    if (selectedNeighborhoodId) params.append('neighborhoodId', selectedNeighborhoodId);
    if (searchQuery) params.append('search', searchQuery);
    if (barterOnly) params.append('barterOnly', 'true');
    params.append('sortBy', sortBy);

    // Use user coordinates if available
    if (user?.lat && user?.lng) {
      params.append('lat', user.lat.toString());
      params.append('lng', user.lng.toString());
    }

    api
      .get<ListingItem[]>(`/listings?${params.toString()}`)
      .then((data) => setListings(data))
      .catch((err) => console.error('Failed to load listings:', err))
      .finally(() => setLoading(false));
  }, [
    selectedCategory,
    selectedNeighborhoodId,
    searchQuery,
    barterOnly,
    sortBy,
    categories,
    user?.lat,
    user?.lng,
  ]);

  // Current map center
  const activeNeighborhood =
    neighborhoods.find((n) => n.id === selectedNeighborhoodId) || neighborhoods[0];
  const mapCenter: [number, number] = activeNeighborhood
    ? [activeNeighborhood.centerLat, activeNeighborhood.centerLng]
    : [13.0315, 80.1817];

  return (
    <div className="space-y-6 py-2">
      {/* Header & Search Bar */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Discover Local Services
            </h1>
            <p className="text-xs text-slate-500">
              Verified providers in {activeNeighborhood?.name || 'Chennai'} sorted by proximity & trust
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/request/smart"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Smart Dispatch (NLP)</span>
            </Link>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-stone-100 border border-stone-200">
            <button
              onClick={() => setViewMode('list')}
              id="view-mode-list-btn"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              id="view-mode-map-btn"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
          </div>
        </div>
      </div>

        {/* Search & Location Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Keyword Search */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              id="discover-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by skill, appliance, or keyword (e.g. fan repair, pipe leak, math)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs sm:text-sm bg-white"
            />
          </div>

          {/* Neighborhood Selector */}
          <div className="md:col-span-3 relative">
            <MapPin className="w-4 h-4 text-amber-600 absolute left-3.5 top-3.5 pointer-events-none" />
            <select
              id="discover-neighborhood-select"
              value={selectedNeighborhoodId}
              onChange={(e) => setSelectedNeighborhoodId(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs sm:text-sm bg-white appearance-none font-semibold text-slate-800"
            >
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}, {n.city}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-3 relative">
            <select
              id="discover-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs sm:text-sm bg-white appearance-none font-semibold text-slate-800"
            >
              <option value="distance">📍 Sort: Closest Distance</option>
              <option value="trustScore">🛡️ Sort: Highest Trust Score</option>
              <option value="priceAsc">💰 Sort: Price Low to High</option>
              <option value="priceDesc">💎 Sort: Price High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills & Barter Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory('')}
              id="category-pill-all"
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedCategory === ''
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)}
                id={`category-pill-${c.slug}`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  selectedCategory === c.slug || selectedCategory === c.id
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Barter Only Filter Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-stone-200 text-xs font-bold text-slate-700 hover:border-amber-300 transition-colors">
            <input
              type="checkbox"
              id="filter-barter-only-checkbox"
              checked={barterOnly}
              onChange={(e) => setBarterOnly(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-stone-300 focus:ring-indigo-500"
            />
            <Repeat className="w-3.5 h-3.5 text-indigo-600" />
            <span>Accepts Barter (Trade Hours)</span>
          </label>
        </div>
      </div>

      {/* Main Content: Map or List */}
      {viewMode === 'map' ? (
        <div className="space-y-4">
          <MarketplaceMap
            listings={listings}
            center={mapCenter}
            radiusKm={activeNeighborhood?.radiusKm || 2.5}
            selectedId={selectedListingId}
            onSelectListing={(id) => setSelectedListingId(id)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <span className="font-bold text-slate-900">{listings.length}</span> active{' '}
              {listings.length === 1 ? 'service listing' : 'service listings'}
            </span>
            <span className="text-[11px] font-semibold text-amber-800">
              📍 Geocoded from {activeNeighborhood?.name || 'Ramapuram'}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card rounded-2xl p-6 border border-stone-200 space-y-3 animate-pulse">
                  <div className="w-1/3 h-4 bg-stone-200 rounded"></div>
                  <div className="w-3/4 h-6 bg-stone-200 rounded"></div>
                  <div className="w-full h-12 bg-stone-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center border border-stone-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl">
                🔍
              </div>
              <h3 className="font-bold text-base text-slate-900">No matching services found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try selecting "All Categories", clearing search terms, or checking neighboring areas like Porur or Valasaravakkam.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSearchQuery('');
                  setBarterOnly(false);
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-5 border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Category, Distance & Price */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                          {item.category.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          <span>{item.distanceKm} km away</span>
                        </span>
                        {item.acceptsBarter && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                            <Repeat className="w-3 h-3" />
                            <span>Barter OK</span>
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-slate-900 block leading-tight">
                          {formatINR(item.price)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {item.pricingType}
                        </span>
                      </div>
                    </div>

                    {/* Listing Title & Description */}
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-snug hover:text-amber-700 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Provider Info Footer */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                        {item.provider.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                          <span>{item.provider.name}</span>
                          <span title="Verified Neighbor">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-semibold text-emerald-700">
                            🛡️ Trust {item.provider.trustScore}/100
                          </span>
                          <span>• {item.provider.completedJobsCount} jobs completed</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/providers/${item.provider.id}`}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-xs transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        to={`/providers/${item.provider.id}?bookListing=${item.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1"
                      >
                        <span>Book</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
