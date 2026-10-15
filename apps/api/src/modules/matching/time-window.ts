/**
 * Resolves relative day / part-of-day words in a request into a concrete
 * time window in Indian Standard Time (UTC+05:30), independent of the
 * server's own time zone.
 */
const IST_OFFSET_MS = 5.5 * 3600 * 1000;

export const DAY_PARTS: Record<string, { label: string; startHour: number; endHour: number }> = {
  morning: { label: 'morning', startHour: 8, endHour: 12 },
  afternoon: { label: 'afternoon', startHour: 12, endHour: 17 },
  evening: { label: 'evening', startHour: 17, endHour: 21 },
};

export interface TimeWindow {
  start: Date;
  end: Date;
  /** e.g. "Tomorrow evening (17:00–21:00)" */
  label: string;
}

const pad = (h: number) => `${String(h).padStart(2, '0')}:00`;

/** Returns the window for "morning/afternoon/evening" (optionally with "today"/"tomorrow"), or null. */
export function resolveTimeWindow(text: string, now: Date = new Date()): TimeWindow | null {
  const lower = text.toLowerCase();
  const partKey = Object.keys(DAY_PARTS).find((p) => new RegExp(`\\b${p}\\b`).test(lower));
  if (!partKey) return null;

  const dayOffset = /\btomorrow\b/.test(lower) ? 1 : 0;
  const part = DAY_PARTS[partKey];

  // Calendar date in IST, then convert IST wall-clock hours back to UTC instants.
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear(), m = ist.getUTCMonth(), d = ist.getUTCDate() + dayOffset;
  const start = new Date(Date.UTC(y, m, d, part.startHour) - IST_OFFSET_MS);
  const end = new Date(Date.UTC(y, m, d, part.endHour) - IST_OFFSET_MS);

  const day = dayOffset === 1 ? 'Tomorrow' : 'Today';
  return { start, end, label: `${day} ${part.label} (${pad(part.startHour)}–${pad(part.endHour)})` };
}
