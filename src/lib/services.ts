/**
 * Service pages (S4): read services through `getServices()`. It keeps the content collection, the menu catalogue
 * (`src/data/catalogue.ts`) and the price list (`src/data/pricing.ts` → `servicePrices`, D27/D32) in step, and fails
 * the build if they drift apart. Same pattern as `getAgents()` (src/lib/agents.ts).
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { services as catalogue, pillars, type Pillar } from '@/data/catalogue';
import { servicePrices, teamRates, money } from '@/data/pricing';
import { getWork, type WorkEntry } from '@/lib/work';
import type { FaqItem, OfferInput } from '@/lib/schema';

export type ServiceEntry = CollectionEntry<'services'>;

export async function getServices(): Promise<ServiceEntry[]> {
  const all = await getCollection('services', (e) => !e.data.draft);
  const problems: string[] = [];
  for (const c of catalogue) {
    const e = all.find((s) => s.id === c.slug);
    if (!e) problems.push(`catalogue service "${c.slug}" has no content file in src/content/services/`);
    else {
      if (e.data.name !== c.name) problems.push(`${c.slug}: name "${e.data.name}" ≠ catalogue "${c.name}"`);
      if (e.data.pillar !== c.pillar) problems.push(`${c.slug}: pillar "${e.data.pillar}" ≠ catalogue "${c.pillar}"`);
      if (e.data.icon !== c.icon) problems.push(`${c.slug}: icon "${e.data.icon}" ≠ catalogue "${c.icon}"`);
      if (e.data.related.services.some((r) => r.id === c.slug)) problems.push(`${c.slug}: links to itself in related.services`);
    }
    if (!servicePrices[c.slug]) problems.push(`${c.slug}: no price in src/data/pricing.ts → servicePrices`);
  }
  for (const e of all) if (!catalogue.some((c) => c.slug === e.id)) problems.push(`content file "${e.id}" is not in the catalogue (menus would miss it)`);
  if (problems.length) throw new Error(`Service catalogue out of sync:\n - ${problems.join('\n - ')}`);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export const pillarOrder = Object.keys(pillars) as Pillar[];

export function byPillar(entries: ServiceEntry[]) {
  return pillarOrder.map((p) => ({ key: p, ...pillars[p], items: entries.filter((e) => e.data.pillar === p) }));
}

/* ---------- prices (always from pricing.ts) ---------- */
export interface ServicePricing {
  from: number;
  monthly: boolean;
  basis: string;
  /** "From $8,000" or "From $2,200/mo" */
  label: string;
  offers: OfferInput[];
}

export function servicePricing(slug: string, name: string): ServicePricing {
  const p = servicePrices[slug];
  if (!p) throw new Error(`No price for service "${slug}" in src/data/pricing.ts → servicePrices`);
  const monthly = p.per === 'month';
  return {
    from: p.from,
    monthly,
    basis: p.basis,
    label: `From ${money(p.from)}${monthly ? '/mo' : ''}`,
    offers: [{ name, amount: p.from, currency: 'USD', ...(monthly ? { billingUnit: 'MON' as const } : {}) }],
  };
}

/** "AI agent development" stays; "Custom software development" → "custom software development". */
export const inSentence = (name: string) => (/^[A-Z][a-z]+\b/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name);

/** The price question, generated from pricing.ts so the FAQ (and its JSON-LD) never disagrees with the price card. */
export function serviceFaq(slug: string, name: string): FaqItem {
  const p = servicePrices[slug]!;
  const q = p.question ?? `How much does ${inSentence(name)} cost?`;
  if (p.per === 'month') {
    const roles = teamRates.map((r) => `${r.role.replace(/^AI \/ ML/, 'AI/ML').replace(/^Full-stack/, 'full-stack').replace(/^Mobile/, 'mobile')} from ${money(r.monthly)}`).join(', ');
    const extra = p.basis.replace(/^per full-time engineer;\s*/i, '');
    return {
      q,
      a: `Dedicated engineers start from ${money(p.from)} a month each, full time: ${roles}. ${extra.charAt(0).toUpperCase()}${extra.slice(1)} for smaller pieces of work. Your engineers work hours that overlap yours, report to one named lead, and you own all the code they write.`,
    };
  }
  return {
    q,
    a: `Prices start from ${money(p.from)} (${p.basis}). The final price depends on scope, integrations and timeline. After a free 30-minute call you get a fixed quote within 24 hours, and you pay by milestone, so you see the work before each payment.`,
  };
}

/** Published case studies tagged with this service (featured first), via the getWork() launch gate. */
export async function workFor(slug: string, limit = 3): Promise<WorkEntry[]> {
  const work = await getWork();
  return work.filter((w) => (w.data.services as string[]).includes(slug)).slice(0, limit);
}
