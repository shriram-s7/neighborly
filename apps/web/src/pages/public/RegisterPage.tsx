import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Role } from '@neighborly/shared';
import { UserPlus, MapPin, AlertCircle, CheckCircle, Navigation } from 'lucide-react';

interface NeighborhoodOption {
  id: string;
  name: string;
  city: string;
  centerLat: number;
  centerLng: number;
}

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodOption[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [isProvider, setIsProvider] = useState(false);
  const [bio, setBio] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<NeighborhoodOption[]>('/neighborhoods')
      .then((data) => {
        setNeighborhoods(data);
        if (data.length > 0) {
          setNeighborhoodId(data[0].id);
          setLat(data[0].centerLat);
          setLng(data[0].centerLng);
        }
      })
      .catch((err) => console.error('Failed to load neighborhoods:', err));
  }, []);

  const handleNeighborhoodChange = (id: string) => {
    setNeighborhoodId(id);
    const selected = neighborhoods.find((n) => n.id === id);
    if (selected) {
      setLat(selected.centerLat);
      setLng(selected.centerLng);
    }
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => {
          // Fallback to selected neighborhood coordinates
          const selected = neighborhoods.find((n) => n.id === neighborhoodId);
          if (selected) {
            setLat(selected.centerLat);
            setLng(selected.centerLng);
          }
        },
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({
        name,
        email,
        phone: phone || undefined,
        password,
        role: Role.USER,
        neighborhoodId: neighborhoodId || undefined,
        isProvider,
        bio: bio || undefined,
        lat,
        lng,
      });

      navigate(isProvider ? '/provider' : '/discover', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white text-2xl flex items-center justify-center mx-auto shadow-md shadow-amber-500/20">
          🏡
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Join Your Neighborhood Network
        </h1>
        <p className="text-xs text-slate-500">
          Connect with trusted residents in Ramapuram, Porur, Valasaravakkam, and KK Nagar
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                id="register-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Phone Number</label>
              <input
                type="tel"
                id="register-phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9840123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Address *</label>
              <input
                type="email"
                required
                id="register-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Password *</label>
              <input
                type="password"
                required
                id="register-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
              />
            </div>
          </div>

          {/* Neighborhood Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Your Neighborhood in Chennai *</span>
              <button
                type="button"
                onClick={handleUseLocation}
                className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                <span>Use device GPS location</span>
              </button>
            </label>
            <div className="relative">
              <select
                id="register-neighborhood-select"
                value={neighborhoodId}
                onChange={(e) => handleNeighborhoodChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white appearance-none"
              >
                {neighborhoods.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}, {n.city}
                  </option>
                ))}
              </select>
              <MapPin className="w-4 h-4 text-stone-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>
            {lat && lng && (
              <p className="text-[11px] text-stone-500 font-mono">
                Location pinned at {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
              </p>
            )}
          </div>

          {/* Provider checkbox */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                id="register-is-provider-checkbox"
                checked={isProvider}
                onChange={(e) => setIsProvider(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">
                  I want to offer services as a Provider
                </span>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Lists you on the neighborhood directory, allows creating skill listings, and unlocks provider dashboard.
                </span>
              </div>
            </label>

            {isProvider && (
              <div className="pt-2 border-t border-amber-200/60">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Provider Headline / Bio
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Master Electrician with 8 yrs experience in Ramapuram"
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 text-xs bg-white"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            id="register-submit-button"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>Complete Registration</span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-stone-100">
          Already a resident?{' '}
          <Link to="/login" className="font-bold text-amber-700 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
