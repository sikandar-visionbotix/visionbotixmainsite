/**
 * Country pages (S9): read locations through `getLocations()`. It keeps the content collection and the catalogue
 * (`src/data/catalogue.ts` → `locations`) in step and fails the build if they drift, like getIndustries().
 * Everything that is the same rule for every country is computed here, so no page can contradict another:
 *  - live overlap hours from the page's `zones` + `shift` and our PKT offset (site.hours);
 *  - local prices from pricing.ts (USD) through `localMoney()` (approximate, rounded, dated);
 *  - the generated price question;
 *  - whether we may say "delivered for clients in <country>" (site.deliveredInCodes, owner-confirmed).
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { locations as catalogue } from '@/data/catalogue';
import { agentPrices, audit, projectFrom, teamRates, hourlyFrom, fx, fxAsOf, localMoney, usMoney, type LocalCurrency } from '@/data/pricing';
import { site } from '@/data/site';
import { agentItem } from '@/lib/industries';
import type { FaqItem, OfferInput } from '@/lib/schema';

export type LocationEntry = CollectionEntry<'locations'>;
export type LocationData = LocationEntry['data'];

/** Minimum live overlap a page may promise for its first (main) city. */
export const MIN_OVERLAP = 4;

export async function getLocations(): Promise<LocationEntry[]> {
  const all = await getCollection('locations', (e) => !e.data.draft);
  const problems: string[] = [];
  for (const c of catalogue) {
    const e = all.find((s) => s.id === c.slug);
    if (!e) problems.push(`catalogue location "${c.slug}" has no content file in src/content/locations/`);
    else {
      if (e.data.name !== c.name) problems.push(`${c.slug}: name "${e.data.name}" ≠ catalogue "${c.name}"`);
      if (e.data.code !== c.code) problems.push(`${c.slug}: code "${e.data.code}" ≠ catalogue "${c.code}"`);
      if (e.data.currency !== c.currency) problems.push(`${c.slug}: currency "${e.data.currency}" ≠ catalogue "${c.currency}"`);
      if (!site.areaServed.includes(e.data.code as never)) problems.push(`${c.slug}: ${e.data.code} is not in site.areaServed`);
      const o = overlap(e.data);
      if (o[0]!.hours < MIN_OVERLAP) problems.push(`${c.slug}: only ${o[0]!.hours} h overlap with ${o[0]!.city} (min ${MIN_OVERLAP})`);
    }
  }
  for (const e of all) if (!catalogue.some((c) => c.slug === e.id)) problems.push(`content file "${e.id}" is not in the catalogue`);
  if (problems.length) throw new Error(`Location catalogue out of sync:\n - ${problems.join('\n - ')}`);
  return catalogue.map((c) => all.find((e) => e.id === c.slug)!).filter(Boolean);
}

export const delivered = (d: LocationData) => site.deliveredInCodes.includes(d.code);

/* ---------------- time-zone overlap ---------------- */
const mod24 = (h: number) => ((h % 24) + 24) % 24;
export const hh = (h: number) => `${String(Math.floor(mod24(h))).padStart(2, '0')}:${mod24(h) % 1 ? '30' : '00'}`;

export interface ZoneOverlap {
  city: string;
  abbr: string;
  /** Our shift in the client's local time. */
  shiftLocal: [number, number];
  /** Overlap with the client's working day, local time (from, to); hours = 0 when none. */
  from: number;
  to: number;
  hours: number;
}

/** Overlap of our shift (PKT) with each zone's working day, in that zone's local time. */
export function overlap(d: LocationData): ZoneOverlap[] {
  const [ws, we] = d.workday;
  return d.zones.map((z) => {
    const delta = z.offset - site.hours.utcOffset;
    const start = mod24(d.shift[0] + delta);
    const len = mod24(d.shift[1] - d.shift[0]) || 24;
    // The shift as one or two intervals within the client's 0–24 day.
    const parts: [number, number][] = start + len <= 24 ? [[start, start + len]] : [[start, 24], [0, start + len - 24]];
    let from = 0;
    let to = 0;
    for (const [a, b] of parts) {
      const f = Math.max(a, ws);
      const t = Math.min(b, we);
      if (t - f > to - from) {
        from = f;
        to = t;
      }
    }
    return { city: z.city, abbr: z.abbr, shiftLocal: [start, mod24(start + len)], from, to, hours: Math.max(0, to - from) };
  });
}

/** "17:00–02:00 PKT" */
export const shiftLabel = (d: LocationData) => `${hh(d.shift[0])}–${hh(d.shift[1])} ${site.hours.tz}`;
/** "09:00–16:00 ET" for the main city. */
export const overlapLabel = (z: ZoneOverlap) => (z.hours ? `${hh(z.from)}–${hh(z.to)} ${z.abbr}` : 'by arrangement');

/* ---------------- local prices ---------------- */
export interface PriceRow {
  name: string;
  href?: string;
  /** Local, approximate. */
  local: string;
  usd: string;
  group: 'agent' | 'start' | 'build' | 'team';
}

const both = (setup: number, monthly: number | null | undefined, c: LocalCurrency) => ({
  local: monthly ? `${localMoney(setup, c)} + ${localMoney(monthly, c)}/mo` : localMoney(setup, c),
  usd: monthly ? `${usMoney(setup)} + ${usMoney(monthly)}/mo` : usMoney(setup),
});

export function priceRows(d: LocationData): PriceRow[] {
  const c = d.currency;
  const rows: PriceRow[] = d.popular.map(({ agent }) => {
    const p = agentPrices[agent.id];
    if (!p) throw new Error(`No price for agent "${agent.id}"`);
    return { name: agentItem(agent.id).name, href: `/ai-agents/${agent.id}/`, ...both(p.setup, p.monthly, c), group: 'agent' as const };
  });
  rows.push({ name: audit.name, href: '/services/ai-consulting/', ...both(audit.price, null, c), group: 'start' });
  const builds: [string, string, number][] = [
    ['Custom AI agent', '/services/ai-agent-development/', projectFrom.customAgent],
    ['Website or web app', '/services/web-app-development/', projectFrom.webApp],
    ['Mobile app (iOS and Android)', '/services/mobile-app-development/', projectFrom.mobileApp],
    ['SaaS MVP', '/services/saas-mvp-development/', projectFrom.saasMvp],
  ];
  for (const [name, href, n] of builds) rows.push({ name, href, ...both(n, null, c), group: 'build' });
  const minTeam = Math.min(...teamRates.map((r) => r.monthly));
  rows.push({ name: 'Dedicated engineer, full time', href: '/services/dedicated-teams/', local: `${localMoney(minTeam, c)}/mo`, usd: `${usMoney(minTeam)}/mo`, group: 'team' });
  rows.push({ name: 'Hourly, for smaller pieces of work', href: '/pricing/', local: `${localMoney(hourlyFrom, c)}/h`, usd: `${usMoney(hourlyFrom)}/h`, group: 'team' });
  return rows;
}

/** "£0.75 per US$1, November 2026" */
export const fxLabel = (c: LocalCurrency) => `${new Intl.NumberFormat('en-US', { style: 'currency', currency: c, maximumFractionDigits: fx[c] < 10 ? 4 : 0 }).format(fx[c]).replace(/^([A-Z]{3})\s?/, '$1 ')} per US$1, ${fxAsOf}`;

/** Lowest-priced packaged agent (with a monthly fee) across the whole catalogue. */
function cheapestAgent() {
  return Object.entries(agentPrices)
    .filter(([, p]) => p.monthly)
    .reduce((a, b) => (b[1].setup + b[1].monthly! * 12 < a[1].setup + a[1].monthly! * 12 ? b : a));
}

const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/** The price question, generated from pricing.ts so the FAQ (and its JSON-LD) never disagrees with the table. */
export function locationFaq(d: LocationData): FaqItem {
  const c = d.currency;
  const [cheapSlug, cheap] = cheapestAgent();
  const lead = d.popular.slice(0, 2).map(({ agent }) => {
    const p = agentPrices[agent.id]!;
    return `the ${agentItem(agent.id).name} from about ${localMoney(p.setup, c)}${p.monthly ? ` plus ${localMoney(p.monthly, c)} a month` : ''}`;
  });
  const local = c !== 'USD';
  return {
    q: `How much does an AI agent cost in ${d.inName}?`,
    a:
      `Our packaged agents start from ${local ? 'about ' : ''}${localMoney(cheap.setup, c)} setup plus ${localMoney(cheap.monthly!, c)} a month (the ${agentItem(cheapSlug).name}). ` +
      `Popular with ${d.who}: ${list(lead)}. Custom agents start from ${local ? 'about ' : ''}${localMoney(projectFrom.customAgent, c)}, fixed price after scoping, and the ${audit.name} is ${local ? 'about ' : ''}${localMoney(audit.price, c)}, credited in full against a build. ` +
      (local
        ? `Our prices are set in US dollars; these figures are approximate at ${fxLabel(c)}. Your fixed quote states the exact amount and currency.`
        : 'Your fixed quote states the exact amount before any work starts.'),
  };
}

/** Service JSON-LD offers: the lead agent's real (USD) prices. */
export function locationOffers(d: LocationData): OfferInput[] {
  const lead = d.popular[0]!.agent.id;
  const p = agentPrices[lead]!;
  const name = agentItem(lead).name;
  return [
    { name: `${name} setup`, amount: p.setup, currency: 'USD' },
    ...(p.monthly ? [{ name: `${name} monthly management`, amount: p.monthly, currency: 'USD', billingUnit: 'MON' as const }] : []),
  ];
}
