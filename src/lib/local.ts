/**
 * Service × country pages (S11, D75): one packaged agent in one country, at /locations/<location>/<agent>/.
 * Copy lives in src/content/local/<location>/<agent>.md; every number here is computed (pricing.ts, the location's
 * currency and fx rate, D66), so the page, its FAQ and its JSON-LD cannot disagree with the price list.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { agentPrices, bundles, audit, localMoney, usMoney, type LocalCurrency } from '@/data/pricing';
import { agentItem } from '@/lib/industries';
import { getLocations, fxLabel } from '@/lib/locations';
import type { FaqItem, OfferInput } from '@/lib/schema';

export type LocalEntry = CollectionEntry<'local'>;

export const localPath = (e: LocalEntry) => `/locations/${e.data.location.id}/${e.data.agent.id}/`;

let cache: Promise<LocalEntry[]> | null = null;
/** Published local pages; fails the build if a file sits in the wrong folder or has no price. */
export function getLocalOffers(): Promise<LocalEntry[]> {
  cache ??= (async () => {
    const all = (await getCollection('local', (e) => !e.data.draft)).sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
    const locs = new Set((await getLocations()).map((l) => l.id));
    for (const e of all) {
      const expected = `${e.data.location.id}/${e.data.agent.id}`;
      if (e.id !== expected) throw new Error(`local/${e.id}.md: must live at src/content/local/${expected}.md`);
      if (!locs.has(e.data.location.id)) throw new Error(`local/${e.id}.md: unknown location "${e.data.location.id}"`);
      if (!agentPrices[e.data.agent.id]) throw new Error(`local/${e.id}.md: no price for agent "${e.data.agent.id}"`);
    }
    return all;
  })();
  return cache;
}

export const localFor = async (location: string) => (await getLocalOffers()).filter((e) => e.data.location.id === location);
export const localForAgent = async (agent: string) => (await getLocalOffers()).filter((e) => e.data.agent.id === agent);

export interface LocalPriceRow {
  name: string;
  href: string;
  local: string;
  usd: string;
  note?: string;
}

/** The agent, the bundles that contain it, and the audit, in the location's currency (≈) and in US dollars. */
export function localPrices(agent: string, c: LocalCurrency): LocalPriceRow[] {
  const p = agentPrices[agent]!;
  const fmt = (setup: number, monthly?: number | null) => ({
    local: monthly ? `${localMoney(setup, c)} + ${localMoney(monthly, c)}/mo` : localMoney(setup, c),
    usd: monthly ? `${usMoney(setup)} + ${usMoney(monthly)}/mo` : usMoney(setup),
  });
  const rows: LocalPriceRow[] = [{ name: agentItem(agent).name, href: `/ai-agents/${agent}/`, ...fmt(p.setup, p.monthly), note: 'Setup, then monthly management' }];
  for (const b of bundles.filter((b) => b.agents.includes(agent))) {
    rows.push({ name: `${b.name} bundle`, href: `/ai-agents/#${b.slug}`, ...fmt(b.setup, b.monthly), note: b.agents.map((a) => agentItem(a).name).join(', ') });
  }
  rows.push({ name: audit.name, href: '/services/ai-consulting/', ...fmt(audit.price), note: 'Credited in full against a build' });
  return rows;
}

/** The price question, generated so it always matches the table (and the FAQPage JSON-LD). */
export function localPriceFaq(agent: string, c: LocalCurrency, inName: string): FaqItem {
  const p = agentPrices[agent]!;
  const name = agentItem(agent).name;
  const local = c !== 'USD';
  const approx = local ? 'about ' : '';
  return {
    q: `How much does the ${name} cost in ${inName}?`,
    a:
      `Setup is ${approx}${localMoney(p.setup, c)}${p.monthly ? `, then ${approx}${localMoney(p.monthly, c)} a month for hosting, monitoring, weekly tuning and a fair-use volume of usage` : ''}. ` +
      `Usage above that (call minutes, WhatsApp conversation fees, AI model costs) is passed through at cost with no markup, and we tell you before it happens. ` +
      (local ? `Our prices are set in US dollars (${usMoney(p.setup)}${p.monthly ? ` + ${usMoney(p.monthly)}/mo` : ''}); local figures are approximate at ${fxLabel(c)}, and your quote states the exact amount and currency.` : 'Your quote states the exact amount before any work starts.'),
  };
}

export function localOffers(agent: string): OfferInput[] {
  const p = agentPrices[agent]!;
  const name = agentItem(agent).name;
  return [
    { name: `${name} setup`, amount: p.setup, currency: 'USD' },
    ...(p.monthly ? [{ name: `${name} monthly management`, amount: p.monthly, currency: 'USD', billingUnit: 'MON' as const }] : []),
  ];
}
