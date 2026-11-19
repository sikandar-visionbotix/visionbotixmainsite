/**
 * Industry pages (S8): read industries through `getIndustries()`. It keeps the content collection and the menu catalogue
 * (`src/data/catalogue.ts`) in step and fails the build if they drift. Same pattern as getAgents()/getServices().
 * Every price on an industry page is computed here from `src/data/pricing.ts` (D23, D27): the recommended agents, the
 * bundle (when the sector has one) and the generated price question.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { industries as catalogue, agents as agentCatalogue, type AgentItem } from '@/data/catalogue';
import { agentPrices, bundles, audit, money, priceLabel } from '@/data/pricing';
import { liveDemos, type LiveDemoConfig } from '@/data/demos';
import { getWork, type WorkEntry } from '@/lib/work';
import type { FaqItem, OfferInput } from '@/lib/schema';

export type IndustryEntry = CollectionEntry<'industries'>;

export async function getIndustries(): Promise<IndustryEntry[]> {
  const all = await getCollection('industries', (e) => !e.data.draft);
  const problems: string[] = [];
  for (const c of catalogue) {
    const e = all.find((s) => s.id === c.slug);
    if (!e) problems.push(`catalogue industry "${c.slug}" has no content file in src/content/industries/`);
    else {
      if (e.data.name !== c.name) problems.push(`${c.slug}: name "${e.data.name}" ≠ catalogue "${c.name}"`);
      if (e.data.icon !== c.icon) problems.push(`${c.slug}: icon "${e.data.icon}" ≠ catalogue "${c.icon}"`);
      if (e.data.relatedIndustries.includes(c.slug)) problems.push(`${c.slug}: lists itself in relatedIndustries`);
    }
  }
  for (const e of all) if (!catalogue.some((c) => c.slug === e.id)) problems.push(`content file "${e.id}" is not in the catalogue (menus would miss it)`);
  if (problems.length) throw new Error(`Industry catalogue out of sync:\n - ${problems.join('\n - ')}`);
  // Hub and menus follow the catalogue order.
  return catalogue.map((c) => all.find((e) => e.id === c.slug)!).filter(Boolean);
}

export const agentItem = (slug: string): AgentItem => {
  const a = agentCatalogue.find((x) => x.slug === slug);
  if (!a) throw new Error(`Unknown agent "${slug}"`);
  return a;
};

/** The live demo for an agent (every agent has one since S7b). */
export const demoFor = (agentSlug: string): LiveDemoConfig | undefined => liveDemos.find((d) => d.agent === agentSlug);

export interface TeamPricing {
  /** The sector's bundle, when it has one. */
  bundle?: { slug: string; name: string; agents: string[]; setup: number; monthly: number; separateSetup: number; separateMonthly: number } | undefined;
  /** Every recommended agent bought separately. */
  separateSetup: number;
  separateMonthly: number;
  /** Agents that are fixed-price projects (no monthly fee). */
  projectOnly: string[];
  /** Headline shown in the hero: the bundle, or the lead agent. */
  headline: { name: string; label: string };
  offers: OfferInput[];
}

export function teamPricing(d: IndustryEntry['data']): TeamPricing {
  const slugs = d.agents.map((r) => r.id);
  const parts = slugs.map((s) => {
    const p = agentPrices[s];
    if (!p) throw new Error(`No price for agent "${s}" in src/data/pricing.ts`);
    return p;
  });
  const b = d.bundle ? bundles.find((x) => x.slug === d.bundle)! : undefined;
  const bundle = b
    ? {
        slug: b.slug,
        name: b.name,
        agents: b.agents,
        setup: b.setup,
        monthly: b.monthly,
        separateSetup: b.agents.reduce((s, a) => s + agentPrices[a]!.setup, 0),
        separateMonthly: b.agents.reduce((s, a) => s + (agentPrices[a]!.monthly ?? 0), 0),
      }
    : undefined;
  const lead = agentItem(slugs[0]!);
  const headline = bundle
    ? { name: `${bundle.name} bundle`, label: `From ${money(bundle.setup)} + ${money(bundle.monthly)}/mo` }
    : { name: lead.name, label: priceLabel(lead.slug)! };
  const offers: OfferInput[] = bundle
    ? [
        { name: `${bundle.name} bundle setup`, amount: bundle.setup, currency: 'USD' },
        { name: `${bundle.name} bundle monthly management`, amount: bundle.monthly, currency: 'USD', billingUnit: 'MON' },
      ]
    : [
        { name: `${lead.name} setup`, amount: agentPrices[lead.slug]!.setup, currency: 'USD' },
        ...(agentPrices[lead.slug]!.monthly ? [{ name: `${lead.name} monthly management`, amount: agentPrices[lead.slug]!.monthly!, currency: 'USD', billingUnit: 'MON' as const }] : []),
      ];
  return {
    bundle,
    separateSetup: parts.reduce((s, p) => s + p.setup, 0),
    separateMonthly: parts.reduce((s, p) => s + (p.monthly ?? 0), 0),
    projectOnly: slugs.filter((s) => agentPrices[s]!.monthly === null),
    headline,
    offers,
  };
}

const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
/** The price question, generated from pricing.ts so the FAQ (and its JSON-LD) never disagrees with the page. */
export function industryFaq(d: IndustryEntry['data']): FaqItem {
  const t = teamPricing(d);
  const names = d.agents.map((r) => agentItem(r.id).name);
  const each = d.agents.map((r) => `the ${agentItem(r.id).name} ${priceLabel(r.id)!.replace(/^From/, 'from')}`);
  const q = `How much do AI agents for ${d.who} cost?`;
  const bundleLine = t.bundle
    ? `Together as the ${t.bundle.name} bundle, the core agents cost from ${money(t.bundle.setup)} setup plus ${money(t.bundle.monthly)} a month, against ${money(t.bundle.separateSetup)} plus ${money(t.bundle.separateMonthly)} a month bought separately. `
    : '';
  return {
    q,
    a:
      `${bundleLine}Each agent can also be bought on its own: ${list(each)}. ` +
      `Monthly fees cover hosting, monitoring, weekly tuning and a fair-use volume; usage above that is passed through at cost. ` +
      `If you are not sure where to start, the ${audit.name} (${money(audit.price)}, ${audit.duration}) maps where ${names.length > 1 ? 'these agents' : 'an agent'} would pay off first and is credited in full against a build.`,
  };
}

/** Published case studies tagged with this industry (featured first), via the getWork() launch gate. */
export async function workForIndustry(slug: string, limit = 3): Promise<WorkEntry[]> {
  const work = await getWork();
  return work.filter((w) => (w.data.industries as string[]).includes(slug)).slice(0, limit);
}

/**
 * How long the recommended agents take to go live, from each agent's own `timeline` (src/content/agents/*.md), so the
 * industry page never promises less than an agent page. Fixed-price projects (MVP, audit, MCP) are left out.
 * "Live in about 2 weeks" when every agent says so, otherwise the widest range, e.g. "Agents live in 2–4 weeks".
 */
export async function teamTimeline(d: IndustryEntry['data']): Promise<string> {
  let lo = Infinity;
  let hi = 0;
  for (const r of d.agents) {
    if (agentPrices[r.id]?.monthly === null) continue;
    const t = (await getEntry('agents', r.id))?.data.timeline ?? '';
    const m = t.match(/(\d+)\s*[–-]\s*(\d+)\s*weeks/) ?? t.match(/about (\d+) weeks/);
    if (!m) throw new Error(`Agent "${r.id}": cannot read weeks from timeline "${t}"`);
    lo = Math.min(lo, Number(m[1]));
    hi = Math.max(hi, Number(m[2] ?? m[1]));
  }
  if (!hi) return 'Fixed timeline agreed before we start';
  return lo === hi ? `Live in about ${hi} weeks` : `Agents live in ${lo}–${hi} weeks`;
}
