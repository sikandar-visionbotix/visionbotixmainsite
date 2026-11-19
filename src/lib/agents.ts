/**
 * Agent pages (S3): read agents through `getAgents()`. It keeps the content collection, the menu catalogue
 * (`src/data/catalogue.ts`) and the price list (`src/data/pricing.ts`, the single price source, D23/D27) in step,
 * and fails the build if they drift apart.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { agents as catalogue, agentGroups, type AgentGroup } from '@/data/catalogue';
import { agentPrices, bundles, money } from '@/data/pricing';
import type { FaqItem, OfferInput } from '@/lib/schema';

export type AgentEntry = CollectionEntry<'agents'>;

export async function getAgents(): Promise<AgentEntry[]> {
  const all = await getCollection('agents', (e) => !e.data.draft);
  const problems: string[] = [];
  for (const c of catalogue) {
    const e = all.find((a) => a.id === c.slug);
    if (!e) problems.push(`catalogue agent "${c.slug}" has no content file in src/content/agents/`);
    else {
      if (e.data.name !== c.name) problems.push(`${c.slug}: name "${e.data.name}" ≠ catalogue "${c.name}"`);
      if (e.data.group !== c.group) problems.push(`${c.slug}: group "${e.data.group}" ≠ catalogue "${c.group}"`);
    }
    if (!agentPrices[c.slug]) problems.push(`${c.slug}: no price in src/data/pricing.ts`);
  }
  for (const e of all) if (!catalogue.some((c) => c.slug === e.id)) problems.push(`content file "${e.id}" is not in the catalogue (menus would miss it)`);
  if (problems.length) throw new Error(`Agent catalogue out of sync:\n - ${problems.join('\n - ')}`);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export const groupOrder = Object.keys(agentGroups) as AgentGroup[];

export function byGroup(entries: AgentEntry[]) {
  return groupOrder.map((g) => ({ key: g, ...agentGroups[g], items: entries.filter((e) => e.data.group === g) }));
}

/* ---------- prices (always from pricing.ts) ---------- */
export interface AgentPricing {
  setup: number;
  monthly: number | null;
  note?: string | undefined;
  /** "From $1,500 + $349/mo" */
  label: string;
  offers: OfferInput[];
}

export function agentPricing(slug: string, name: string): AgentPricing {
  const p = agentPrices[slug];
  if (!p) throw new Error(`No price for agent "${slug}" in src/data/pricing.ts`);
  const offers: OfferInput[] = [{ name: p.monthly ? `${name} setup` : name, amount: p.setup, currency: 'USD' }];
  if (p.monthly) offers.push({ name: `${name} monthly management`, amount: p.monthly, currency: 'USD', billingUnit: 'MON' });
  return {
    setup: p.setup,
    monthly: p.monthly,
    note: p.note,
    label: p.monthly ? `From ${money(p.setup)} + ${money(p.monthly)}/mo` : `From ${money(p.setup)}`,
    offers,
  };
}

/** Bundles that include this agent, with what the agents would cost bought separately. */
export function bundlesWith(slug?: string) {
  return bundles
    .filter((b) => !slug || b.agents.includes(slug))
    .map((b) => {
      const parts = b.agents.map((a) => agentPrices[a]!);
      return {
        ...b,
        separateSetup: parts.reduce((s, p) => s + p.setup, 0),
        separateMonthly: parts.reduce((s, p) => s + (p.monthly ?? 0), 0),
      };
    });
}

/** The price question, generated from pricing.ts so the FAQ (and its JSON-LD) never disagrees with the price block. */
export function pricingFaq(slug: string, name: string): FaqItem {
  const p = agentPricing(slug, name);
  const inBundles = bundlesWith(slug);
  const bundleLine = inBundles.length
    ? ` It is also part of the ${inBundles.map((b) => b.name).join(' and ')} bundle${inBundles.length > 1 ? 's' : ''}, which cost less than buying the agents separately.`
    : '';
  const a = p.monthly
    ? `The ${name} starts from ${money(p.setup)} for setup, plus ${money(p.monthly)} a month. The monthly fee covers hosting, monitoring, weekly tuning and a fair-use volume; model, messaging or call usage above that is passed through at cost, with no markup. You get a fixed quote after a free 30-minute call.${bundleLine}`
    : `The ${name} is a fixed-price project starting from ${money(p.setup)}${p.note ? ` (${p.note.charAt(0).toLowerCase()}${p.note.slice(1)})` : ''}. You get a fixed quote with the exact scope after a free 30-minute call, before any work starts.`;
  return { q: `How much does the ${name} cost?`, a };
}
