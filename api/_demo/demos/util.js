/** Helpers shared by the demo agents (S7). Everything here is sandbox data: fictional businesses, made-up people. */

export const str = (v, max = 120) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : typeof v === 'number' ? String(v) : '');
export const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(Number(v)) ? Number(v) : NaN);

const DAY = 86_400_000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "2026-11-21" in UTC. */
export const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
/** "Saturday 21 Nov". */
export function dayLabel(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}`;
}
/** Noon (UTC) of the visitor's local today, so the sandbox calendar starts on their date, not the server's. */
export function localToday(tz) {
  let iso = isoDay(Date.now());
  try {
    if (tz) iso = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {}
  return Date.parse(`${iso}T12:00:00Z`);
}
export const weekday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();

/** Small deterministic PRNG, so a day's calendar looks the same on every turn. */
export function rng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * A sandbox calendar: the next `days` open days from today, each with free slots.
 * @param {{ from: number, days: number, open: (wd: number) => [number, number] | null, step: number, people: string[], busy: number, seed: string }} o
 *   open(weekday) → [startHour, endHour] or null when closed; step in minutes; busy = share of slots already taken.
 */
export function makeCalendar({ from, days, open, step, people, busy, seed }) {
  const out = [];
  for (let i = 0, t = from; out.length < days && i < 21; i++, t += DAY) {
    const iso = isoDay(t);
    const hours = open(weekday(iso));
    if (!hours) continue;
    const r = rng(`${seed}:${iso}`);
    const slots = [];
    for (let m = hours[0] * 60; m + step <= hours[1] * 60; m += step) {
      if (r() < busy) continue;
      const time = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      slots.push({ id: `${iso.slice(5)}-${time.replace(':', '')}`, time, with: people[Math.floor(r() * people.length)] });
    }
    out.push({ date: iso, label: dayLabel(iso), slots });
  }
  return out;
}

/** Resolves "today", "tomorrow", "Monday", "2026-11-23" or "23 Nov" to a calendar day. */
export function findDay(cal, q) {
  const s = str(q, 40).toLowerCase();
  if (!s || s === 'today' || s === 'asap' || s === 'soonest' || s === 'earliest') return cal[0];
  if (s === 'tomorrow') {
    const t = isoDay(new Date(`${cal[0].date}T12:00:00Z`).getTime() + DAY);
    return cal.find((d) => d.date === t) ?? null;
  }
  const md = s.match(/^\d{4}-(\d{2}-\d{2})$/)?.[1]; // models sometimes guess the year wrong: match month and day
  return cal.find((d) => d.date === s || (md && d.date.slice(5) === md) || d.label.toLowerCase().startsWith(s) || d.label.toLowerCase().includes(s.replace(/^next /, ''))) ?? null;
}

export function findSlot(cal, id) {
  const s = str(id, 20);
  for (const d of cal) {
    const slot = d.slots.find((x) => x.id === s);
    if (slot) return { day: d, slot };
  }
  return null;
}

export const code = (prefix, n) => `${prefix}-${String(n).padStart(3, '0')}`;
