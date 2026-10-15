import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, CheckCircle2, Sparkles, Save, RotateCcw } from 'lucide-react';

interface SlotRow {
  dayOfWeek: number;
  dayName: string;
  active: boolean;
  startTime: string;
  endTime: string;
}

const defaultDays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const AvailabilityEditorPage: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<SlotRow[]>(
    defaultDays.map((name, i) => ({
      dayOfWeek: i,
      dayName: name,
      active: i >= 1 && i <= 6, // Mon-Sat active by default
      startTime: '09:00',
      endTime: '19:00',
    })),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Array<{ dayOfWeek: number; startTime: string; endTime: string }>>('/availability/my-slots')
      .then((serverSlots) => {
        if (serverSlots && serverSlots.length > 0) {
          setSlots((prev) =>
            prev.map((row) => {
              const match = serverSlots.find((s) => s.dayOfWeek === row.dayOfWeek);
              if (match) {
                return {
                  ...row,
                  active: true,
                  startTime: match.startTime,
                  endTime: match.endTime,
                };
              }
              return { ...row, active: false };
            }),
          );
        }
      })
      .catch((err) => console.error('Failed to load slots:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleDay = (index: number) => {
    setSlots((prev) =>
      prev.map((row, i) => (i === index ? { ...row, active: !row.active } : row)),
    );
  };

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', val: string) => {
    setSlots((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: val } : row)),
    );
  };

  // Preset handlers
  const applyMonSatPreset = () => {
    setSlots(
      defaultDays.map((name, i) => ({
        dayOfWeek: i,
        dayName: name,
        active: i >= 1 && i <= 6,
        startTime: '09:00',
        endTime: '19:00',
      })),
    );
    setToastMessage('Applied Mon–Sat 9:00 AM – 7:00 PM preset');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const applyEverydayPreset = () => {
    setSlots(
      defaultDays.map((name, i) => ({
        dayOfWeek: i,
        dayName: name,
        active: true,
        startTime: '08:00',
        endTime: '20:00',
      })),
    );
    setToastMessage('Applied Everyday 8:00 AM – 8:00 PM preset');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const applyWeekendPreset = () => {
    setSlots(
      defaultDays.map((name, i) => ({
        dayOfWeek: i,
        dayName: name,
        active: i === 0 || i === 6,
        startTime: '10:00',
        endTime: '18:00',
      })),
    );
    setToastMessage('Applied Weekends Only (Sat–Sun 10 AM – 6 PM) preset');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = slots
        .filter((s) => s.active)
        .map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        }));

      await api.post('/availability/batch', { slots: payload });
      setToastMessage('Weekly availability schedule saved successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 py-2 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Weekly Availability Schedule
          </h1>
          <p className="text-xs text-slate-500">
            Define your working hours so neighbors book slots when you are ready to visit
          </p>
        </div>

        <button
          onClick={handleSave}
          id="save-availability-btn"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto hover:scale-[1.02] disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Availability'}</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quick Presets Bar */}
      <div className="glass-card rounded-2xl p-4 border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Schedule Presets:</span>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={applyMonSatPreset}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-xs font-semibold text-slate-700 transition-colors"
          >
            Mon–Sat (9 AM – 7 PM)
          </button>
          <button
            onClick={applyEverydayPreset}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-xs font-semibold text-slate-700 transition-colors"
          >
            Everyday (8 AM – 8 PM)
          </button>
          <button
            onClick={applyWeekendPreset}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-xs font-semibold text-slate-700 transition-colors"
          >
            Weekends Only
          </button>
        </div>
      </div>

      {/* 7 Days Schedule Table */}
      <div className="glass-card rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3">
        {slots.map((row, idx) => (
          <div
            key={row.dayOfWeek}
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
              row.active
                ? 'bg-amber-50/40 border-amber-200 text-slate-900'
                : 'bg-stone-50 border-stone-200/80 text-slate-400'
            }`}
          >
            {/* Day Name & Toggle */}
            <div className="flex items-center space-x-3 w-40">
              <input
                type="checkbox"
                id={`slot-active-day-${row.dayOfWeek}`}
                checked={row.active}
                onChange={() => handleToggleDay(idx)}
                className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
              />
              <span className={`text-sm font-bold ${row.active ? 'text-slate-900' : 'text-slate-400'}`}>
                {row.dayName}
              </span>
            </div>

            {/* Time Slot Inputs */}
            {row.active ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-medium text-slate-500">From</span>
                  <input
                    type="time"
                    id={`slot-start-${row.dayOfWeek}`}
                    value={row.startTime}
                    onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-bold bg-white"
                  />
                </div>
                <span className="text-slate-400 font-bold">–</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-medium text-slate-500">To</span>
                  <input
                    type="time"
                    id={`slot-end-${row.dayOfWeek}`}
                    value={row.endTime}
                    onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-bold bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">Day Off (No bookings accepted)</div>
            )}
          </div>
        ))}

        <div className="pt-4 flex items-center justify-between border-t border-stone-100">
          <p className="text-[11px] text-slate-500">
            Matches during smart request matching prioritize slots within your active window.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  );
};
