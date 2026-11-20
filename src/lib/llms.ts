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
import { getIndustries, teamPricing } from '@/lib/industries';
import { getLocations, overlap, overlapLabel, locationFaq } from '@/lib/locations';
import { getLocalOffers, localPath, localPriceFaq } from '@/lib/local';
import { agentItem } from '@/lib/industries';
import { typicalProjects, estimate, rangeLabel } from '@/data/estimator';
import { liveDemos } from '@/data/demos';
import { getPosts, filled } from '@/lib/posts';
import { authorBySlug } from '@/data/resources';

const u = (p: string) => new URL(p, site.url).href;
const f = site.facts;

export async function llmsTxt(full: boolean): Promise<string> {
  const [agents, services, products, work, industries, locations, posts] = await Promise.all([getAgents(), getServices(), getProducts(), getWork(), getIndustries(), getLocations(), getPosts()]);
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
  L.push('', '## Live AI agent demos (try them in the browser, no sign-up)', '');
  for (const d of liveDemos) L.push(`- [${d.agentName} live demo](${u(`/demos/${d.id}/`)}): ${d.page.summary}`);
  L.push(`- [All live demos](${u('/demos/')}): ${liveDemos.length} agents live on fictional businesses, with every tool call, guardrail and approval shown. A site concierge on every page answers questions about Visionbotix.`);
  L.push('', '## Services', '');
  for (const s of services) {
    L.push(`- [${s.data.name}](${u(`/services/${s.id}/`)}): ${s.data.summary.replace(/\s+/g, ' ')} ${serviceLabel(s.id) ?? ''}`.trim());
    if (full && s.data.faq.length) L.push(faq(s.data.faq));
  }
  L.push('', '## Industries', '');
  for (const i of industries) {
    const t = teamPricing(i.data);
    L.push(
      `- [AI agents for ${i.data.who}](${u(`/industries/${i.id}/`)}): ${i.data.summary.replace(/\s+/g, ' ')} Rules we design around: ${i.data.compliance.map((c) => `${c.name} (${c.region})`).join(', ')}. ${t.headline.name} ${t.headline.label.replace(/^From/, 'from')}.`,
    );
    if (full && i.data.faq.length) L.push(faq(i.data.faq));
  }
  L.push('', '## Where we work (country pages)', '');
  for (const l of locations) {
    const z = overlap(l.data);
    const price = locationFaq(l.data);
    L.push(
      `- [AI agents and software for ${l.data.who}](${u(`/locations/${l.id}/`)}): ${l.data.summary.replace(/\s+/g, ' ')} Live overlap: ${z.map((x) => `${x.city} ${x.hours} h (${overlapLabel(x)})`).join(', ')}. Rules we design around: ${l.data.compliance.map((c) => c.name).join(', ')}.`,
    );
    if (full) L.push(faq([price, ...l.data.faq]));
  }
  const locals = await getLocalOffers();
  if (locals.length) {
    L.push('', '## AI agents set up for one country (local rules, systems and prices)', '');
    for (const e of locals) {
      const l = locations.find((x) => x.id === e.data.location.id)!;
      L.push(
        `- [${agentItem(e.data.agent.id).name} in ${l.data.inName}](${u(localPath(e))}): ${e.data.summary.replace(/\s+/g, ' ')} Local rules: ${e.data.rules.map((r) => r.name).join(', ')}. Systems: ${e.data.systems.flatMap((x) => x.names).join(', ')}.`,
      );
      if (full) L.push(faq([localPriceFaq(e.data.agent.id, l.data.currency, l.data.inName), ...e.data.faq]));
    }
  }
  L.push('', '## Free tools', '');
  L.push(
    `- [AI visibility checker](${u('/tools/ai-visibility-checker/')}): free check of whether ChatGPT, Claude, Perplexity, Google and Bing can crawl, read and identify a web page (robots.txt per AI crawler, noindex/nosnippet, text without JavaScript, structure, schema), with a score out of 100 and the top fixes. Includes a reference table of AI crawler user agents.`,
    `- [AI readiness score](${u('/tools/ai-readiness-score/')}): free 13-question AI readiness assessment: a score out of 100 across five weighted dimensions (processes 25%, knowledge and records 20%, connected tools 20%, volume and value 20%, ownership 15%), what to fix first, and which AI agents to start with, with prices. Runs in the browser.`,
    `- [Project cost estimator](${u('/estimate/')}): price range, timeline and cost drivers for apps, websites, SaaS MVPs and AI agents.`,
  );
  L.push('', '## Our own products', '');
  for (const p of products) {
    L.push(`- [${p.data.name}](${u(`/products/${p.id}/`)}): ${p.data.summary.replace(/\s+/g, ' ')}${p.data.externalUrl ? ` Live at ${p.data.externalUrl}` : ''}`);
    if (full && p.data.faq.length) L.push(faq(p.data.faq));
  }
  for (const s of site.properties) L.push(`- [${s.name}](${s.href})`);
  L.push('', '## Case studies (anonymous by policy: client names are never published)', '');
  for (const w of work) L.push(`- [${w.data.title}](${u(`/work/${w.id}/`)}): ${w.data.clientType}. ${full ? w.data.summary.replace(/\s+/g, ' ') : ''}`.trim());
  L.push('', '## Resources (guides, cost guides and comparisons)', '');
  for (const p of posts) {
    L.push(`- [${p.data.title}](${u(`/resources/${p.id}/`)}): ${filled(p.data.summary).replace(/\s+/g, ' ')} By ${authorBySlug(p.data.author).name}, updated ${p.data.updated.toISOString().slice(0, 10)}.`);
    if (full) L.push(faq(p.data.faq.map((x) => ({ q: x.q, a: filled(x.a) }))));
  }
  L.push('', '## Company', '');
  L.push(
    `- [About](${u('/about/')})`,
    `- [How we work](${u('/process/')})`,
    `- [Industries](${u('/industries/')})`,
    `- [Where we work](${u('/locations/')})`,
    `- [Resources](${u('/resources/')})`,
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
