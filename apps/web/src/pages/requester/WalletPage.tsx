import React, { useState, useEffect } from 'react';
import { api, formatINR } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { LedgerEntryType } from '@neighborly/shared';
import {
  Wallet as WalletIcon,
  Lock,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  History,
  ShieldCheck,
} from 'lucide-react';

interface LedgerEntryItem {
  id: string;
  type: LedgerEntryType;
  amount: number;
  balanceAfter: number;
  description?: string | null;
  createdAt: string;
  booking?: { id: string; agreedPrice: number; status: string } | null;
}

interface WalletData {
  id: string;
  balance: number;
  heldBalance: number;
  credits: number;
  entries: LedgerEntryItem[];
}

export const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState<number>(1000);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      const data = await api.get<WalletData>('/wallet/me');
      setWallet(data);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTopup = async (rupees: number) => {
    setSubmitting(true);
    try {
      await api.post('/wallet/topup', { amount: rupees * 100 });
      setToastMessage(`Successfully added ₹${rupees} to wallet!`);
      setTimeout(() => setToastMessage(null), 3500);
      await fetchWallet();
    } catch (err: any) {
      alert(err.message || 'Top-up failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getEntryBadge = (type: LedgerEntryType) => {
    switch (type) {
      case LedgerEntryType.TOPUP:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">TOP-UP</span>;
      case LedgerEntryType.ESCROW_HOLD:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">ESCROW HOLD</span>;
      case LedgerEntryType.ESCROW_RELEASE:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">RELEASED</span>;
      case LedgerEntryType.REFUND:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900">REFUNDED</span>;
      case LedgerEntryType.PLATFORM_FEE:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700">PLATFORM FEE</span>;
      case LedgerEntryType.CREDIT_EARN:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-900">+CREDITS</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800">{type}</span>;
    }
  };

  return (
    <div className="space-y-6 py-2 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Wallet & Escrow Ledger
        </h1>
        <p className="text-xs text-slate-500">
          Simulated double-entry ledger with transparent escrow holds, instant refunds, and community credits
        </p>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3 Metric Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="glass-panel rounded-3xl p-6 border border-emerald-200 shadow-sm relative overflow-hidden bg-gradient-to-tr from-emerald-500/10 via-emerald-100/20 to-transparent">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
            <span>Available Balance</span>
            <WalletIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-black text-slate-900 mt-2 block tracking-tight">
            {formatINR(wallet?.balance ?? 0)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Ready to book local services
          </span>
        </div>

        {/* Held in Escrow */}
        <div className="glass-panel rounded-3xl p-6 border border-amber-200 shadow-sm relative overflow-hidden bg-gradient-to-tr from-amber-500/10 via-amber-100/20 to-transparent">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800">
            <span>Held in Escrow</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-3xl font-black text-slate-900 mt-2 block tracking-tight">
            {formatINR(wallet?.heldBalance ?? 0)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Locked safely until jobs complete
          </span>
        </div>

        {/* Community Credits */}
        <div className="glass-panel rounded-3xl p-6 border border-indigo-200 shadow-sm relative overflow-hidden bg-gradient-to-tr from-indigo-500/10 via-indigo-100/20 to-transparent">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-800">
            <span>Community Credits</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-3xl font-black text-indigo-950 mt-2 block tracking-tight">
            {wallet?.credits ?? 0} Credits
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Earned by helping neighbors (1 cr = ₹10)
          </span>
        </div>
      </div>

      {/* Demo Top-Up Bar */}
      <div className="glass-card rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-amber-600" />
            <span>Simulate Wallet Top-Up (Demo Mode)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Add funds instantly to test booking escrow holds without real payment gateway credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTopup(500)}
            disabled={submitting}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-300 text-xs font-bold text-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            + ₹500
          </button>
          <button
            onClick={() => handleTopup(1000)}
            disabled={submitting}
            id="wallet-topup-1000-btn"
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-md shadow-amber-600/20 disabled:opacity-50"
          >
            + ₹1,000
          </button>
          <button
            onClick={() => handleTopup(2500)}
            disabled={submitting}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-300 text-xs font-bold text-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            + ₹2,500
          </button>
        </div>
      </div>

      {/* Append-Only Ledger History Table */}
      <div className="glass-card rounded-2xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900">Immutable Ledger Entries</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Append-only audit trail
          </span>
        </div>

        {loading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-stone-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : !wallet?.entries || wallet.entries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 italic">
            No transaction entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {wallet.entries.map((e) => (
                  <tr key={e.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(e.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3 px-3">{getEntryBadge(e.type)}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{e.description || '—'}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(e.amount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {formatINR(e.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
