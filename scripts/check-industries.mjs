// Quick pre-build check for industry content files (S8). Mirrors the hard limits in src/content.config.ts → industries
// and the content rules in CLAUDE.md, so files can be checked one by one before the full `npm run build`.
// Usage: node scripts/check-industries.mjs [slug …]   (no args = every file in src/content/industries/)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const dir = 'src/content/industries';
const catalogue = readFileSync('src/data/catalogue.ts', 'utf8');
const pricing = readFileSync('src/data/pricing.ts', 'utf8');
const icons = readFileSync('src/lib/icons.ts', 'utf8');
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_')).map((f) => f.slice(0, -3));

const bundles = Object.fromEntries([...pricing.matchAll(/slug: '([\w-]+)', name: '[^']+', agents: \[([^\]]+)\]/g)].map((m) => [m[1], m[2].match(/[\w-]+/g)]));

const banned = [
  [/—/, 'em-dash'],
  [/\$\s?\d|\b(USD|EUR|GBP|AED|SAR|PKR)\b|\d+\s?(k|K)\b/, 'price or money amount (prices come from pricing.ts)'],
  [/\b(?!100%)\d+(\.\d+)?\s?%/, 'percentage (no statistics)'],
  [/bahrain|switch \(hss\)|\bHSS\b|\bSPD\b|air force|hezbollah|pager|defen[cs]e site/i, 'confidential term (CLAUDE.md)'],
  [/\b(DoD|Department of Defense|Ministry of|NATO|army|navy|marines|pentagon|MoD)\b/, 'named defense body (keep sector wording generic)'],
  [/testimonial|\breviews? from (our )?clients|rated \d|\d(\.\d)? stars?|award[- ]winning|\bawards?\b|trusted by|clients include/i, 'proof claim (no testimonials, ratings, awards or client lists)'],
  [/\b(ISO ?27001|SOC ?2|HIPAA|GDPR|PCI)[- ]?(certified|compliant company|accredited)/i, 'certification claim'],
  [/\b(we are|we're|is|are|fully|100%) (HIPAA|GDPR|SOC ?2|PCI[- ]DSS|FERPA|FedRAMP)[- ]compliant/i, 'compliance claim (say what we put in place instead)'],
  [/\bcertified\b|\bofficial partner\b|\bpartner of\b|\bpremier partner\b|\bFedRAMP[- ]authori[sz]ed\b/i, 'certification or partnership claim'],
  [/\b(optimis|organis|recognis|personalis|analys(e|ing)|colour|behaviour|favour|centre|licence)\w*/i, 'UK spelling (site is US English, D29)'],
  [/icasta|khadbazar|ric nexus|genpk|tru hair/i, 'client or project name'],
  [/\bin our experience\b|\bour clients (see|report|saw)\b|\bproven\b/i, 'experience or outcome claim (capabilities and process only)'],
];

let failed = 0;
for (const slug of slugs) {
  const file = `${dir}/${slug}.md`;
  const errs = [];
  if (!existsSync(file)) {
    console.log(`✗ ${slug}: file missing`);
    failed++;
    continue;
  }
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) {
    console.log(`✗ ${slug}: no front matter`);
    failed++;
    continue;
  }
  let d;
  try {
    d = parse(m[1]);
  } catch (e) {
    console.log(`✗ ${slug}: YAML error: ${e.message}`);
    failed++;
    continue;
  }
  const len = (v, min, max, name) => {
    if (typeof v !== 'string') return errs.push(`${name} missing`);
    if (v.length < min || v.length > max) errs.push(`${name} is ${v.length} chars (want ${min}–${max}): "${v}"`);
  };
  const count = (a, min, max, name) => {
    if (!Array.isArray(a)) return errs.push(`${name} missing`);
    if (a.length < min || a.length > max) errs.push(`${name} has ${a.length} items (want ${min}–${max})`);
  };
  const isAgent = (a) => existsSync(`src/content/agents/${a}.md`);
  const cat = catalogue.match(new RegExp(`slug: '${slug}', name: '([^']+)', icon: '([\\w-]+)'`));
  if (!cat) errs.push('slug not in catalogue.ts industries');
  else {
    if (d.name !== cat[1]) errs.push(`name "${d.name}" ≠ catalogue "${cat[1]}"`);
    if (d.icon !== cat[2]) errs.push(`icon "${d.icon}" ≠ catalogue "${cat[2]}"`);
  }
  len(d.who, 4, 40, 'who');
  if (d.who && !/^[a-z]/.test(d.who)) errs.push(`who must start lower-case (used mid-sentence): "${d.who}"`);
  len(d.seo?.title, 10, 46, 'seo.title');
  len(d.seo?.description, 70, 155, 'seo.description');
  if (d.seo?.title && d.keywords?.primary && !d.seo.title.toLowerCase().includes(d.keywords.primary.toLowerCase()))
    errs.push(`seo.title "${d.seo.title}" does not contain keywords.primary "${d.keywords.primary}"`);
  len(d.summary?.trim(), 120, 480, 'summary');
  const words = d.summary?.trim().split(/\s+/).length ?? 0;
  if (words < 40 || words > 65) errs.push(`summary is ${words} words (want 45–60)`);
  len(d.tagline, 30, 90, 'tagline');
  len(d.h1, 20, 80, 'h1');
  count(d.bestFor, 3, 6, 'bestFor');
  (d.bestFor ?? []).forEach((b) => b.length > 40 && errs.push(`bestFor chip > 40 chars: "${b}"`));
  count(d.problem, 3, 4, 'problem');
  (d.problem ?? []).forEach((p) => p.length < 30 && errs.push(`problem line < 30 chars: "${p}"`));
  count(d.agents, 2, 4, 'agents');
  (d.agents ?? []).forEach((a) => !isAgent(a) && errs.push(`agents: no agent "${a}"`));
  if (new Set(d.agents ?? []).size !== (d.agents ?? []).length) errs.push('agents has duplicates');
  if (d.bundle) {
    if (!bundles[d.bundle]) errs.push(`bundle "${d.bundle}" not in pricing.ts (${Object.keys(bundles).join(', ')})`);
    else bundles[d.bundle].forEach((a) => !(d.agents ?? []).includes(a) && errs.push(`bundle agent "${a}" missing from agents`));
  }
  const inTeam = (a, where) => a && !(d.agents ?? []).includes(a) && errs.push(`${where}.agent "${a}" is not one of agents`);
  count(d.useCases, 4, 6, 'useCases');
  (d.useCases ?? []).forEach((u) => {
    if (!u.title || !u.body) errs.push(`useCase missing title/body: ${JSON.stringify(u).slice(0, 60)}`);
    inTeam(u.agent, 'useCases');
  });
  count(d.dayInLife, 4, 7, 'dayInLife');
  (d.dayInLife ?? []).forEach((s) => {
    if (String(s.time ?? '').length > 14) errs.push(`dayInLife time > 14 chars: "${s.time}"`);
    if (!s.step || s.step.length < 30 || s.step.length > 220) errs.push(`dayInLife step must be 30–220 chars: "${s.step}"`);
    inTeam(s.agent, 'dayInLife');
  });
  count(d.compliance, 2, 5, 'compliance');
  (d.compliance ?? []).forEach((c) => {
    if (!c.name || c.name.length > 36) errs.push(`compliance name missing or > 36 chars: "${c.name}"`);
    if (!c.region || c.region.length > 24) errs.push(`compliance region missing or > 24 chars: "${c.region}"`);
    if (!c.body || c.body.length < 40 || c.body.length > 280) errs.push(`compliance body must be 40–280 chars (${c.body?.length}): "${c.name}"`);
  });
  count(d.controls, 3, 5, 'controls');
  (d.controls ?? []).forEach((c) => (c.length < 20 || c.length > 200) && errs.push(`control must be 20–200 chars: "${c}"`));
  count(d.systems, 4, 14, 'systems');
  count(d.services, 1, 4, 'services');
  (d.services ?? []).forEach((s) => !existsSync(`src/content/services/${s}.md`) && errs.push(`services: unknown service "${s}"`));
  (d.products ?? []).forEach((s) => !existsSync(`src/content/products/${s}.md`) && errs.push(`products: unknown product "${s}"`));
  if ((d.products ?? []).length > 3) errs.push('products > 3');
  (d.relatedIndustries ?? []).forEach((s) => {
    if (s === slug) errs.push('relatedIndustries links to itself');
    if (!catalogue.match(new RegExp(`slug: '${s}', name:`))) errs.push(`relatedIndustries: unknown industry "${s}"`);
  });
  if ((d.relatedIndustries ?? []).length > 4) errs.push('relatedIndustries > 4');
  count(d.faq, 5, 8, 'faq');
  (d.faq ?? []).forEach((f) => (!f.q || !f.a || f.a.length < 20) && errs.push(`bad faq item: ${JSON.stringify(f).slice(0, 80)}`));
  (d.faq ?? []).forEach((f) => /how much|cost|price/i.test(f.q ?? '') && errs.push(`faq "${f.q}": the price question is generated from pricing.ts, remove it`));
  if (!(d.updated instanceof Date) && !/^\d{4}-\d\d-\d\d$/.test(String(d.updated))) errs.push('updated must be a date');
  if (!icons.includes(`'${d.icon}'`)) errs.push(`icon "${d.icon}" not in src/lib/icons.ts`);
  for (const [re, what] of banned) {
    const hit = raw.match(re);
    if (hit) errs.push(`${what}: "${hit[0]}"`);
  }
  if (d.draft) errs.push('draft: true (remove it to publish)');
  if (errs.length) {
    failed++;
    console.log(`✗ ${slug}\n   - ${errs.join('\n   - ')}`);
  } else console.log(`✓ ${slug}`);
}
process.exit(failed ? 1 : 0);
