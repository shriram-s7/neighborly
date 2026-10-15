import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '@neighborly/shared';
import {
  MapPin,
  Sparkles,
  ArrowRightLeft,
  ShieldCheck,
  Wallet as WalletIcon,
  LogOut,
  Wrench,
  Search,
  HandHeart,
  Repeat,
  BarChart3,
  Menu,
  X,
  Clock,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isProviderMode, toggleProviderMode, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Logo and Neighborhood Badge */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <Link to="/" className="flex items-center space-x-2 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                <span className="text-lg">🏘️</span>
              </div>
              <div className="flex flex-col shrink-0">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 flex items-center gap-1.5 leading-tight">
                  Neighborly
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    Chennai
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide hidden 2xl:block">
                  Hyperlocal Community Services
                </span>
              </div>
            </Link>

            {/* Neighborhood Indicator */}
            {user?.neighborhoodName && (
              <div className="hidden xl:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-700 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-semibold">{user.neighborhoodName}</span>
              </div>
            )}
          </div>

          {/* Center Navigation Links (Desktop - 1280px+) */}
          {user && (
            <nav className="hidden xl:flex items-center space-x-1 shrink-0">
              {!isProviderMode ? (
                <>
                  <Link
                    to="/discover"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive('/discover')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-stone-100'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Discover</span>
                  </Link>
                  <Link
                    to="/request/smart"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive('/request/smart')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-stone-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Smart Dispatch</span>
                  </Link>
                  <Link
                    to="/bookings"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      isActive('/bookings')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-stone-100'
                    }`}
                  >
                    <span>My Bookings</span>
                  </Link>
                  <Link
                    to="/free-help"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
                      isActive('/free-help')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-stone-100'
                    }`}
                  >
                    <HandHeart className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Free Help</span>
                  </Link>
                  <Link
                    to="/barter"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
                      isActive('/barter')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-stone-100'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Skill Exchange</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/provider"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive('/provider')
                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-stone-100'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/provider/listings"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      isActive('/provider/listings')
                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-stone-100'
                    }`}
                  >
                    <span>My Listings</span>
                  </Link>
                  <Link
                    to="/provider/jobs"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      isActive('/provider/jobs')
                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-stone-100'
                    }`}
                  >
                    <span>Job Queue</span>
                  </Link>
                </>
              )}

              {user.role === Role.ADMIN && (
                <>
                  <Link
                    to="/admin"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive('/admin')
                        ? 'bg-rose-100 text-rose-950 border border-rose-300'
                        : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Admin</span>
                  </Link>
                  <Link
                    to="/admin/analytics"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive('/admin/analytics')
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : 'text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Analytics</span>
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* Right Side: Role Toggle + Wallet + User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {user ? (
              <>
                {/* Role Switcher Pill */}
                <button
                  id="navbar-role-toggle"
                  onClick={toggleProviderMode}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs transition-all border shrink-0 whitespace-nowrap ${
                    isProviderMode
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                      : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                  }`}
                  title="Switch between Requester and Provider mode"
                >
                  <ArrowRightLeft className="w-3 h-3 shrink-0" />
                  <span>{isProviderMode ? 'Provider' : 'Resident'}</span>
                </button>

                {/* Wallet Button */}
                <Link
                  to="/wallet"
                  id="navbar-wallet-button"
                  className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors shrink-0 whitespace-nowrap"
                >
                  <WalletIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Wallet</span>
                </Link>

                {/* User menu / Logout (Desktop) */}
                <div className="flex items-center space-x-2 pl-2 border-l border-stone-200 shrink-0">
                  <div className="flex flex-col text-right hidden md:block shrink-0">
                    <span className="text-xs font-bold text-slate-900 leading-tight block">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize leading-tight block">
                      {user.role === Role.ADMIN ? 'Admin' : isProviderMode ? 'Provider' : 'Resident'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    id="navbar-logout-btn"
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors hidden sm:block shrink-0"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                  </button>
                </div>

                {/* Mobile/Tablet Hamburger Toggle (Shown when < 1280px) */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  id="navbar-mobile-toggle"
                  className="p-2 text-slate-700 hover:text-slate-900 xl:hidden rounded-lg hover:bg-stone-100 transition-colors shrink-0"
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 shrink-0 text-slate-900" />
                  ) : (
                    <Menu className="w-5 h-5 shrink-0 text-slate-900" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2 shrink-0">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Navigation Drawer (Visible on < 1280px when opened) */}
        {user && mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-stone-200 space-y-3 bg-white/95 backdrop-blur-md rounded-b-2xl shadow-lg">
            {/* User & Neighborhood Banner */}
            <div className="flex items-center justify-between px-3 pb-2.5 border-b border-stone-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{user.name}</span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    📍 {user.neighborhoodName || 'Chennai'} •{' '}
                    {user.role === Role.ADMIN ? 'Admin' : isProviderMode ? 'Provider' : 'Resident'}
                  </span>
                </div>
              </div>
              <Link
                to="/wallet"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200"
              >
                <WalletIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Wallet</span>
              </Link>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col space-y-1 px-2">
              {!isProviderMode ? (
                <>
                  <Link
                    to="/discover"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                      isActive('/discover')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    <Search className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Discover Services</span>
                  </Link>
                  <Link
                    to="/request/smart"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                      isActive('/request/smart')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Smart Dispatch (NLP Parser & Matcher)</span>
                  </Link>
                  <Link
                    to="/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                      isActive('/bookings')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>My Bookings</span>
                  </Link>
                  <Link
                    to="/free-help"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                      isActive('/free-help')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    <HandHeart className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free Community Help</span>
                  </Link>
                  <Link
                    to="/barter"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                      isActive('/barter')
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    <Repeat className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Skill Exchange Board</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/provider"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                      isActive('/provider')
                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                        : 'text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Provider Dashboard</span>
                  </Link>
                  <Link
                    to="/provider/listings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                      isActive('/provider/listings')
                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                        : 'text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    <Search className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>My Service Listings</span>
                  </Link>
                  <Link
                    to="/provider/jobs"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                      isActive('/provider/jobs')
                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                        : 'text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Incoming Job Queue</span>
                  </Link>
                </>
              )}

              {user.role === Role.ADMIN && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                      isActive('/admin')
                        ? 'bg-rose-100 text-rose-950 border border-rose-300'
                        : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Admin Mediation Console</span>
                  </Link>
                  <Link
                    to="/admin/analytics"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors ${
                      isActive('/admin/analytics')
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : 'text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Neighborhood Analytics & Deficits</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Sign Out */}
            <div className="pt-2 px-2 border-t border-stone-100">
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out ({user.name})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
