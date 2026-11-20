// Quick pre-build check for service content files (S4). Mirrors the hard limits in src/content.config.ts → services
// and the content rules in CLAUDE.md, so files can be checked one by one before the full `npm run build`.
// Usage: node scripts/check-services.mjs [slug …]   (no args = every file in src/content/services/)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const dir = 'src/content/services';
const agentsDir = 'src/content/agents';
const catalogue = readFileSync('src/data/catalogue.ts', 'utf8');
const icons = readFileSync('src/lib/icons.ts', 'utf8');
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_')).map((f) => f.slice(0, -3));

const banned = [
  [/—/, 'em-dash'],
  [/\$\s?\d|\b(USD|EUR|GBP)\b|\d+\s?(k|K)\b/, 'price or money amount (prices come from pricing.ts)'],
  [/\b(?!100%)\d+(\.\d+)?\s?%/, 'percentage (no statistics; only the confirmed \"100% of the code\" is allowed)'],
  [/bahrain|switch \(hss\)|\bHSS\b|\bSPD\b|air force|hezbollah|pager|defen[cs]e site/i, 'confidential term (CLAUDE.md)'],
  [/testimonial|\breviews? from (our )?clients|rated \d|\d(\.\d)? stars?|award[- ]winning|\bawards?\b/i, 'proof claim (no testimonials, ratings or awards)'],
  [/\b(ISO ?27001|SOC ?2|HIPAA|GDPR|PCI)[- ]?(certified|compliant company|accredited)/i, 'certification claim'],
  [/\bcertified\b|\bofficial partner\b|\bpartner of\b|\bpremier partner\b/i, 'certification or partnership claim'],
  [/\b(optimis|organis|recognis|personalis|analys(e|ing)|colour|behaviour|favour|centre)\w*/i, 'UK spelling (site is US English, D29)'],
  [/icasta|khadbazar|ric nexus|genpk|tru hair/i, 'client or project name'],
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
  const cat = catalogue.match(new RegExp(`slug: '${slug}', name: '([^']+)', pillar: '(\\w+)', icon: '([\\w-]+)'`));
  if (!cat) errs.push('slug not in catalogue.ts services');
  else {
    if (d.name !== cat[1]) errs.push(`name "${d.name}" ≠ catalogue "${cat[1]}"`);
    if (d.pillar !== cat[2]) errs.push(`pillar "${d.pillar}" ≠ catalogue "${cat[2]}"`);
    if (d.icon !== cat[3]) errs.push(`icon "${d.icon}" ≠ catalogue "${cat[3]}"`);
  }
  len(d.seo?.title, 10, 46, 'seo.title');
  len(d.seo?.description, 70, 155, 'seo.description');
  if (d.seo?.title && d.keywords?.primary && !d.seo.title.toLowerCase().includes(d.keywords.primary.toLowerCase()))
    errs.push(`seo.title "${d.seo.title}" does not contain keywords.primary "${d.keywords.primary}"`);
  len(d.summary?.trim(), 120, 480, 'summary');
  const words = d.summary?.trim().split(/\s+/).length ?? 0;
  if (words < 40 || words > 65) errs.push(`summary is ${words} words (want 45–60)`);
  len(d.tagline, 30, 90, 'tagline');
  len(d.h1, 20, 80, 'h1');
  len(d.timeline, 8, 48, 'timeline');
  count(d.bestFor, 3, 6, 'bestFor');
  (d.bestFor ?? []).forEach((b) => b.length > 40 && errs.push(`bestFor chip > 40 chars: "${b}"`));
  count(d.problem, 3, 4, 'problem');
  (d.problem ?? []).forEach((p) => p.length < 30 && errs.push(`problem line < 30 chars: "${p}"`));
  count(d.offerings, 4, 8, 'offerings');
  count(d.process, 4, 4, 'process');
  (d.process ?? []).forEach((p) => p.meta && p.meta.length > 24 && errs.push(`process meta > 24 chars: "${p.meta}"`));
  count(d.stack, 4, 16, 'stack');
  count(d.quality, 3, 5, 'quality');
  count(d.engagement, 1, 4, 'engagement');
  (d.engagement ?? []).forEach((e) => !['fixed-scope', 'monthly-retainer', 'dedicated-team', 'audit'].includes(e) && errs.push(`bad engagement "${e}"`));
  count(d.includes, 4, 8, 'includes');
  count(d.faq, 5, 8, 'faq');
  (d.faq ?? []).forEach((f) => (!f.q || !f.a || f.a.length < 20) && errs.push(`bad faq item: ${JSON.stringify(f).slice(0, 80)}`));
  if (!(d.updated instanceof Date) && !/^\d{4}-\d\d-\d\d$/.test(String(d.updated))) errs.push('updated must be a date');
  const r = d.related ?? {};
  count(r.agents, 1, 4, 'related.agents');
  (r.agents ?? []).forEach((a) => !existsSync(`${agentsDir}/${a}.md`) && errs.push(`related.agents: no agent "${a}"`));
  (r.services ?? []).forEach((s) => {
    if (s === slug) errs.push('related.services links to itself');
    if (!catalogue.includes(`slug: '${s}', name:`)) errs.push(`related.services: unknown service "${s}"`);
  });
  if ((r.services ?? []).length > 3) errs.push('related.services > 3');
  (r.industries ?? []).forEach((s) => !catalogue.includes(`slug: '${s}', name:`) && errs.push(`related.industries: unknown industry "${s}"`));
  if ((r.industries ?? []).length > 4) errs.push('related.industries > 4');
  (r.products ?? []).forEach((s) => !existsSync(`src/content/products/${s}.md`) && errs.push(`related.products: unknown "${s}"`));
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
