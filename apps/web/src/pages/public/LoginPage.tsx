import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, UserCheck, Wrench, Shield, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setError(null);
    setSubmitting(true);
    setEmail(demoEmail);
    setPassword('Demo@123');
    try {
      await login({ email: demoEmail, password: 'Demo@123' });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white text-2xl flex items-center justify-center mx-auto shadow-md shadow-amber-500/20">
          🏘️
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Welcome to Neighborly
        </h1>
        <p className="text-xs text-slate-500">
          Sign in to discover, book, or offer services in your neighborhood
        </p>
      </div>

      {/* One-Click Demo Credentials */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Instant Demo Logins
          </span>
          <span className="text-[10px] text-amber-700 font-mono font-medium">PW: Demo@123</span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('requester@demo.in')}
            disabled={submitting}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200/80 text-left transition-all group"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Priya Sundaram</div>
                <div className="text-[10px] text-slate-500">Requester • Ramapuram • ₹2,500 balance</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('provider@demo.in')}
            disabled={submitting}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200/80 text-left transition-all group"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Karthik Raja</div>
                <div className="text-[10px] text-slate-500">Provider • Electrician • 88 Trust Score</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('admin@demo.in')}
            disabled={submitting}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-200/80 text-left transition-all group"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Administrator</div>
                <div className="text-[10px] text-slate-500">Admin • Health analytics • Disputes</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Manual Login Form */}
      <div className="glass-card rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <input
              type="email"
              id="login-email-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. requester@demo.in"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <input
              type="password"
              id="login-password-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
            />
          </div>

          <button
            type="submit"
            id="login-submit-button"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>Sign In</span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-stone-100">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-amber-700 hover:underline">
            Register your street
          </Link>
        </div>
      </div>
    </div>
  );
};
