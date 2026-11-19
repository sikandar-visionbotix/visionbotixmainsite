/**
 * Price tokens for posts (S10). Posts never type our own prices: they write a token and the build fills it from
 * `src/data/pricing.ts`, the single price source (D23, D27). An unknown token fails the build.
 *
 *   {{price:ai-receptionist}}   → "$1,500 setup + $349/month"   (one-off agents: "$2,500")
 *   {{setup:ai-receptionist}}   → "$1,500"
 *   {{monthly:ai-receptionist}} → "$349"
 *   {{bundle:clinic-front-desk}} → "$3,000 setup + $699/month"
 *   {{bundle-agents:clinic-front-desk}} → "Receptionist Agent, Booking Agent and Reputation Agent" (catalogue names)
 *   {{project:customAgent}}     → "$8,000"   (keys of projectFrom)
 *   {{service:dedicated-teams}} → "$2,200/month" (servicePrices)
 *   {{team:ai-ml-engineer}}     → "$3,900"   (monthly, role slug of teamRates)
 *   {{audit}} → "$490" · {{hourly}} → "$25"
 *   {{agents-setup-range}} → "$750–$3,500" · {{agents-monthly-range}} → "$199–$499" (managed agents only)
 *
 * Block tokens (a paragraph that is only the token) render a generated HTML table, always in step with the agent pages:
 *   {{table:agents}}   every managed agent: name (linked), setup, monthly, timeline (from src/content/agents/*.md)
 *   {{table:bundles}}  every bundle: name, agents, setup, monthly
 *   {{table:projects}} custom builds "from" prices
 *
 * Relative imports only: astro.config.mjs loads this file through the remark plugin.
 */
import { readFileSync } from 'node:fs';
import { agentPrices, bundles, projectFrom, projects, servicePrices, teamRates, audit, hourlyFrom, money } from '../data/pricing';
import { agents as agentCatalogue } from '../data/catalogue';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const managed = Object.values(agentPrices).filter((p) => p.monthly);
const range = (xs: number[]) => `${money(Math.min(...xs))}–${money(Math.max(...xs))}`;
const agentName = (s: string) => agentCatalogue.find((a) => a.slug === s)?.name ?? s;
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

function need<T>(v: T | undefined, token: string): T {
  if (v === undefined || v === null) throw new Error(`Unknown price token {{${token}}} (see src/lib/tokens.ts)`);
  return v;
}

export function token(name: string): string {
  const [kind, arg = ''] = name.split(':');
  switch (kind) {
    case 'price': {
      const p = need(agentPrices[arg], name);
      return p.monthly ? `${money(p.setup)} setup + ${money(p.monthly)}/month` : money(p.setup);
    }
    case 'setup':
      return money(need(agentPrices[arg], name).setup);
    case 'monthly':
      return money(need(need(agentPrices[arg], name).monthly ?? undefined, name));
    case 'bundle': {
      const b = need(bundles.find((x) => x.slug === arg), name);
      return `${money(b.setup)} setup + ${money(b.monthly)}/month`;
    }
    case 'bundle-agents':
      return list(need(bundles.find((x) => x.slug === arg), name).agents.map(agentName));
    case 'project':
      return money(need((projectFrom as Record<string, number>)[arg], name));
    case 'service': {
      const s = need(servicePrices[arg], name);
      return `${money(s.from)}${s.per === 'month' ? '/month' : ''}`;
    }
    case 'team':
      return money(need(teamRates.find((r) => slug(r.role) === arg), name).monthly);
    case 'audit':
      return money(audit.price);
    case 'hourly':
      return money(hourlyFrom);
    case 'agents-setup-range':
      return range(managed.map((p) => p.setup));
    case 'agents-monthly-range':
      return range(managed.map((p) => p.monthly!));
    default:
      return need<string>(undefined, name);
  }
}

export const TOKEN_RE = /\{\{\s*([a-z-]+(?::[A-Za-z0-9-]+)?)\s*\}\}/g;

/** Fill every token in a string (front matter: summary, FAQ answers, descriptions). */
export const fillTokens = (s: string) => s.replace(TOKEN_RE, (_, t: string) => token(t));

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function timeline(slug: string): string {
  try {
    return readFileSync(`src/content/agents/${slug}.md`, 'utf8').match(/^timeline:\s*['"]?(.+?)['"]?\s*$/m)?.[1] ?? 'Live in about 2 weeks';
  } catch {
    throw new Error(`{{table:agents}}: no content file for agent "${slug}"`);
  }
}
const table = (head: string[], rows: string[][]) =>
  `<table><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;

/** HTML for a block token, e.g. "table:agents". Unknown names fail the build. */
export function blockToken(name: string): string {
  switch (name) {
    case 'table:agents':
      return table(
        ['Agent', 'Setup, from', 'Monthly, from', 'Timeline'],
        agentCatalogue
          .filter((a) => agentPrices[a.slug]?.monthly)
          .map((a) => {
            const p = agentPrices[a.slug]!;
            return [`<a href="/ai-agents/${a.slug}/">${esc(a.name)}</a>`, money(p.setup), `${money(p.monthly!)}/month`, esc(timeline(a.slug))];
          }),
      );
    case 'table:bundles':
      return table(
        ['Bundle', 'Agents', 'Setup, from', 'Monthly, from'],
        bundles.map((b) => [esc(b.name), esc(list(b.agents.map(agentName))), money(b.setup), `${money(b.monthly)}/month`]),
      );
    case 'table:projects':
      return table(['Custom build', 'From'], projects.map((p) => [esc(p.name), money(p.from)]));
    default:
      throw new Error(`Unknown block token {{${name}}} (see src/lib/tokens.ts)`);
  }
}
export const BLOCK_RE = /^\{\{\s*(table:[a-z-]+)\s*\}\}$/;
