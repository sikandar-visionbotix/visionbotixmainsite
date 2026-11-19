/**
 * llms.txt and llms-full.txt (S5), generated from the same content as the pages so they never drift.
 * PLAN §6.1: harmless and cheap, not a ranking lever. Visible page text is what AI search actually uses.
 */
import { site } from '@/data/site';
import { agentPrices, audit, money, priceLabel, serviceLabel, teamRates, hourlyFrom } from '@/data/pricing';
import { getAgents } from '@/lib/agents';
import { getServices } from '@/lib/services';
import { getProducts } from '@/lib/products';
import { getWork } from '@/lib/work';
import { typicalProjects, estimate, rangeLabel } from '@/data/estimator';

const u = (p: string) => new URL(p, site.url).href;
const f = site.facts;

export async function llmsTxt(full: boolean): Promise<string> {
  const [agents, services, products, work] = await Promise.all([getAgents(), getServices(), getProducts(), getWork()]);
  const minSetup = Math.min(...Object.values(agentPrices).filter((p) => p.monthly).map((p) => p.setup));
  const minMonthly = Math.min(...Object.values(agentPrices).filter((p) => p.monthly).map((p) => p.monthly!));
  const L: string[] = [];
  const faq = (items: { q: string; a: string }[]) => items.map((x) => `- Q: ${x.q}\n  A: ${x.a.replace(/<[^>]+>/g, '')}`).join('\n');

  L.push(`# ${site.name}`, '');
  L.push(`> ${site.description}`, '');
  L.push(
    `Facts: founded ${f.foundingYear}; team of ${f.teamSize}; ${f.projectsDelivered}+ projects delivered by our team for clients in ${f.countriesServed} countries, including ${site.deliveredIn.join(', ')}. ` +
      `Office: ${site.address.street}, ${site.address.locality}, ${site.address.countryName}. Legal name: ${site.legalName}. Founder: ${site.founder.name}.`,
    `Contact: ${site.contact.email} · ${site.contact.phone} · ${u('/contact/')} (fixed quote within 24 hours of a call).`,
    `Pricing (USD, "from"): packaged AI agents from ${money(minSetup)} setup + ${money(minMonthly)}/month; ${audit.name} ${money(audit.price)}; dedicated engineers from ${money(Math.min(...teamRates.map((r) => r.monthly)))}/month, hourly from ${money(hourlyFrom)}. Details: ${u('/pricing/')}`,
    `Typical project costs (indicative ranges from our price list; a fixed quote follows a call): ${typicalProjects
      .map((p) => {
        const e = estimate(p.input);
        return `${p.name.toLowerCase()} ${rangeLabel(e)} (${e.weeksLabel})`;
      })
      .join('; ')}. Estimator: ${u('/estimate/')}`,
    'Promises: NDA from the first call; the client owns 100% of the code and IP; fixed price or monthly, paid by milestone; overlap hours with the US, UK, Europe, the Gulf and Australia; weekly demos; 30 days of post-launch support.',
    '',
  );

  L.push('## Packaged AI agents', '');
  for (const a of agents) {
    L.push(`- [${a.data.name}](${u(`/ai-agents/${a.id}/`)}): ${a.data.summary.replace(/\s+/g, ' ')} ${priceLabel(a.id) ?? ''}`.trim());
    if (full && a.data.faq.length) L.push(faq(a.data.faq));
  }
  L.push('', '## Services', '');
  for (const s of services) {
    L.push(`- [${s.data.name}](${u(`/services/${s.id}/`)}): ${s.data.summary.replace(/\s+/g, ' ')} ${serviceLabel(s.id) ?? ''}`.trim());
    if (full && s.data.faq.length) L.push(faq(s.data.faq));
  }
  L.push('', '## Our own products', '');
  for (const p of products) {
    L.push(`- [${p.data.name}](${u(`/products/${p.id}/`)}): ${p.data.summary.replace(/\s+/g, ' ')}${p.data.externalUrl ? ` Live at ${p.data.externalUrl}` : ''}`);
    if (full && p.data.faq.length) L.push(faq(p.data.faq));
  }
  for (const s of site.properties) L.push(`- [${s.name}](${s.href})`);
  L.push('', '## Case studies (anonymous by policy: client names are never published)', '');
  for (const w of work) L.push(`- [${w.data.title}](${u(`/work/${w.id}/`)}): ${w.data.clientType}. ${full ? w.data.summary.replace(/\s+/g, ' ') : ''}`.trim());
  L.push('', '## Company', '');
  L.push(
    `- [About](${u('/about/')})`,
    `- [How we work](${u('/process/')})`,
    `- [Pricing](${u('/pricing/')})`,
    `- [Project cost estimator](${u('/estimate/')})`,
    `- [Contact](${u('/contact/')})`,
    `- [Careers](${u('/careers/')})`,
    `- [Privacy policy](${u('/privacy/')})`,
    `- [Terms of use](${u('/terms/')})`,
  );
  if (!full) L.push('', `Full version with every FAQ: ${u('/llms-full.txt')}`);
  return L.join('\n') + '\n';
}
