// Quick pre-build check for posts (S10). Mirrors src/content.config.ts → posts and the truth rules in CLAUDE.md, so a
// post can be checked on its own before the full `npm run build`.
// Usage: node scripts/check-posts.mjs [slug …]   (no args = every post in src/content/posts/)
//
// The key rule: our own prices are tokens ({{price:…}}, src/lib/tokens.ts). Any other money amount or percentage is a
// market figure, so the paragraph, list item or table row that holds it must link its source, and that source must be
// listed in `sources`. Front matter (summary, excerpt, FAQ, terms) may hold tokens but no market figures.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const dir = 'src/content/posts';
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_')).map((f) => f.slice(0, -3));
const resources = readFileSync('src/data/resources.ts', 'utf8');
const tagList = [...resources.matchAll(/\{ slug: '([a-z-]+)', name: '[^']+', blurb/g)].map((m) => m[1]);
const authorList = [...resources.matchAll(/^\s+slug: '([a-z-]+)',$/gm)].map((m) => m[1]);
const tokenKinds = ['price', 'setup', 'monthly', 'bundle', 'bundle-agents', 'project', 'service', 'team', 'audit', 'hourly', 'agents-setup-range', 'agents-monthly-range', 'table'];
const staticPages = ['/', '/pricing/', '/estimate/', '/contact/', '/about/', '/process/', '/work/', '/careers/', '/demos/', '/ai-agents/', '/services/', '/industries/', '/locations/', '/products/', '/resources/', '/privacy/', '/terms/', '/tools/', '/tools/ai-visibility-checker/', '/tools/ai-readiness-score/'];
const collections = { 'ai-agents': 'agents', services: 'services', industries: 'industries', locations: 'locations', products: 'products', work: 'work', resources: 'posts', demos: null };

const common = [
  [/—/, 'em-dash'],
  [/bahrain|switch \(hss\)|\bHSS\b|\bSPD\b|air force|hezbollah|pager|defen[cs]e site/i, 'confidential term (CLAUDE.md)'],
  [/\b(DoD|Department of Defense|Ministry of Defen[cs]e|NATO|army|navy|marines|pentagon|MoD)\b/, 'named defense body (keep sector wording generic)'],
  [/testimonial|\breviews? from (our )?clients|rated \d|\d(\.\d)? stars? (on|from)|award[- ]winning|trusted by|clients include/i, 'proof claim (no testimonials, ratings, awards or client lists)'],
  [/\b(we are|we're|fully|100%) (HIPAA|GDPR|UK GDPR|SOC ?2|PCI[- ]DSS|PDPL|PIPEDA|ISO ?27001)[- ](compliant|certified)/i, 'compliance or certification claim'],
  [/\b(we are|we're) (an? )?(certified|official|premier|authori[sz]ed) (partner|reseller)/i, 'partnership claim'],
  [/icasta|khadbazar|ric nexus|genpk|tru hair/i, 'client or project name'],
  [/\bin our experience\b|\bour clients (see|report|saw|told)\b|\bproven\b|\bwe(?:'ve| have) (helped|saved) \d/i, 'experience or outcome claim (capabilities, process and sourced facts only)'],
  [/\bour (\w+ )?(office|branch|team) in (?!Rawalpindi|Pakistan)/i, 'implies an office or team abroad (we work from Rawalpindi only)'],
  [/TODO|lorem ipsum|\[citation needed\]/i, 'placeholder left in'],
];
// US spelling is the site default (D29).
const ukForms = [
  /\b(optimis|organis|recognis|personalis|prioritis|minimis|maximis|customis|standardis|digitis|authoris|summaris|categoris|utilis|realis|specialis)(e|es|ed|ing|ation|ations)\b/i,
  /\banalys(e|es|ed|ing)\b/i,
  /\b(colour|behaviour|favour|centre|licence|catalogue|enrolment|fulfil|labour)\b/i,
];
const MONEY = /[$£€]\s?\d|\b(USD|EUR|GBP|AED|SAR|PKR|AUD|CAD|INR|Rs\.?)\s?\d|\d\s?(USD|EUR|GBP)\b|\b\d+(\.\d+)?\s?(k|K)\b|\b\d+\s?(lakh|crore)\b/;
const PCT = /\b\d+(\.\d+)?\s?%|\b\d+ percent\b/;

let failed = 0;
for (const slug of slugs) {
  const file = `${dir}/${slug}.md`;
  const errs = [];
  const warns = [];
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
  const body = m[2];
  const len = (v, min, max, name) => {
    if (typeof v !== 'string') return errs.push(`${name} missing`);
    if (v.length < min || v.length > max) errs.push(`${name} is ${v.length} chars (want ${min}–${max}): "${v.slice(0, 80)}"`);
  };
  const count = (a, min, max, name) => {
    if (!Array.isArray(a)) return errs.push(`${name} missing`);
    if (a.length < min || a.length > max) errs.push(`${name} has ${a.length} items (want ${min}–${max})`);
  };

  /* ---- front matter ---- */
  len(d.title, 20, 90, 'title');
  len(d.seo?.title, 10, 46, 'seo.title');
  len(d.seo?.description, 70, 155, 'seo.description');
  if (/\{\{/.test(`${d.seo?.title}${d.seo?.description}${d.title}`)) errs.push('no tokens in title or seo (they are not filled there)');
  if (d.seo?.title && d.keywords?.primary && !d.seo.title.toLowerCase().includes(d.keywords.primary.toLowerCase()))
    errs.push(`seo.title "${d.seo.title}" does not contain keywords.primary "${d.keywords.primary}"`);
  count(d.keywords?.secondary, 2, 8, 'keywords.secondary');
  len(d.excerpt, 60, 170, 'excerpt');
  len(d.summary?.trim(), 120, 480, 'summary');
  const wc = d.summary?.trim().split(/\s+/).length ?? 0;
  if (wc < 35 || wc > 65) errs.push(`summary is ${wc} words (want 40–60, answer-first)`);
  if (!['guide', 'cost-guide', 'comparison', 'explainer', 'glossary'].includes(d.format)) errs.push(`format "${d.format}" unknown`);
  if (!authorList.includes(d.author)) errs.push(`author "${d.author}" not in src/data/resources.ts`);
  count(d.tags, 1, 3, 'tags');
  (d.tags ?? []).forEach((t) => !tagList.includes(t) && errs.push(`tag "${t}" not in src/data/resources.ts (${tagList.join(', ')})`));
  for (const k of ['pubDate', 'updated']) if (!(d[k] instanceof Date) && !/^\d{4}-\d\d-\d\d$/.test(String(d[k]))) errs.push(`${k} must be a date`);
  count(d.faq, 3, 7, 'faq');
  (d.faq ?? []).forEach((f) => (!f.q || !f.a || f.a.length < 20) && errs.push(`bad faq item: ${JSON.stringify(f).slice(0, 80)}`));
  const rel = d.related ?? {};
  const relPaths = [];
  for (const [k, folder, base] of [['agents', 'agents', 'ai-agents'], ['services', 'services', 'services'], ['industries', 'industries', 'industries'], ['locations', 'locations', 'locations']]) {
    for (const id of rel[k] ?? []) {
      if (!existsSync(`src/content/${folder}/${id}.md`)) errs.push(`related.${k}: no page "${id}"`);
      relPaths.push(`/${base}/${id}/`);
    }
  }
  if (relPaths.length < 2) errs.push('related must name at least 2 money pages');
  for (const p of relPaths) if (!body.includes(`](${p}`)) errs.push(`related page ${p} is not linked in the body`);
  const sources = d.sources ?? [];
  sources.forEach((s) => {
    if (!s.title || !s.publisher || !/^https?:\/\//.test(s.url ?? '')) errs.push(`bad source: ${JSON.stringify(s).slice(0, 100)}`);
  });
  if (d.format === 'glossary') {
    count(d.terms, 20, 80, 'terms');
    (d.terms ?? []).forEach((t) => {
      if (!t.term || t.term.length > 48) errs.push(`term missing or > 48 chars: "${t.term}"`);
      if (!t.definition || t.definition.length < 60 || t.definition.length > 420) errs.push(`definition of "${t.term}" must be 60–420 chars (${t.definition?.length})`);
      if (t.link && !staticPages.includes(t.link) && !resolves(t.link)) errs.push(`term "${t.term}": link ${t.link} does not resolve`);
    });
  } else if (d.terms?.length) errs.push('only glossary posts have terms');
  const fmText = [d.summary, d.excerpt, ...(d.faq ?? []).flatMap((f) => [f.q, f.a]), ...(d.terms ?? []).map((t) => t.definition)].join('\n').replace(/\{\{[^}]+\}\}/g, '');
  const fmFig = fmText.match(MONEY) || fmText.match(PCT);
  if (fmFig) errs.push(`market figure in front matter (no link possible there; move it to the body with its source): "${fmFig[0]}"`);

  /* ---- body ---- */
  const words = body.replace(/\{\{[^}]+\}\}/g, 'x').split(/\s+/).filter(Boolean).length;
  const minWords = d.format === 'glossary' ? 300 : 1100;
  if (words < minWords) errs.push(`body is ${words} words (want ${minWords}+)`);
  if (words > 3200) warns.push(`body is ${words} words (long; check it stays scannable)`);
  const h2 = body.match(/^## .+/gm) ?? [];
  if (h2.length < 4) errs.push(`only ${h2.length} H2 sections (want 4+, phrased as the questions people ask)`);
  if (/^# /m.test(body)) errs.push('no H1 in the body (the template renders the title)');
  const first = body.trim().split(/\n\s*\n/)[0] ?? '';
  if (first.startsWith('#')) errs.push('open with an answer-first paragraph, not a heading');
  else if (first.split(/\s+/).length > 110) errs.push(`first paragraph is ${first.split(/\s+/).length} words (answer-first: keep it under 110)`);

  for (const t of raw.matchAll(/\{\{\s*([a-z-]+)(?::([A-Za-z0-9-]+))?\s*\}\}/g)) if (!tokenKinds.includes(t[1])) errs.push(`unknown token {{${t[1]}…}}`);

  // Links.
  const links = [...body.matchAll(/\]\(([^)\s]+)\)/g)].map((x) => x[1]);
  const internal = links.filter((l) => l.startsWith('/'));
  const external = links.filter((l) => /^https?:/.test(l) && !/visionbotix\.com/.test(l));
  const money = internal.filter((l) => /^\/(ai-agents|services|industries|locations|pricing|estimate|demos)\//.test(l));
  if (new Set(money).size < 4) errs.push(`only ${new Set(money).size} distinct links to money pages (want 4+)`);
  for (const l of internal) if (!staticPages.includes(l.split('#')[0]) && !resolves(l)) errs.push(`internal link ${l} does not resolve`);
  for (const l of internal) if (!/\/(#.*)?$/.test(l)) errs.push(`internal link ${l} needs a trailing slash`);
  const norm = (u) => u.replace(/[#?].*$/, '').replace(/\/$/, '');
  const srcUrls = sources.map((s) => norm(s.url));
  for (const l of external) if (!srcUrls.includes(norm(l))) errs.push(`external link not listed in sources: ${l}`);
  for (const s of sources) if (!external.some((l) => norm(l) === norm(s.url))) errs.push(`source not cited in the body: ${s.url}`);

  // Market figures must sit next to their source.
  const blocks = body.split(/\n\s*\n|\n(?=\s*[-*] |\s*\d+\. |\|)/);
  for (const b of blocks) {
    const text = b.replace(/\{\{[^}]+\}\}/g, '');
    const fig = text.match(MONEY) || text.match(PCT);
    if (fig && !/\]\(https?:\/\/(?!visionbotix)/.test(b)) errs.push(`figure without a source link in the same paragraph/row: "${fig[0]}" in "${b.trim().slice(0, 70)}…"`);
  }

  for (const [re, what] of common) {
    const hit = raw.match(re);
    if (hit) errs.push(`${what}: "${hit[0]}"`);
  }
  for (const re of ukForms) {
    const hit = raw.match(re);
    if (hit) errs.push(`UK spelling (the site uses US spelling, D29): "${hit[0]}"`);
  }
  if (d.draft) errs.push('draft: true (remove it to publish)');
  if (errs.length) {
    failed++;
    console.log(`✗ ${slug}\n   - ${errs.join('\n   - ')}`);
  } else console.log(`✓ ${slug} (${words} words, ${h2.length} sections, ${sources.length} sources, ${new Set(money).size} money links)`);
  if (warns.length) console.log(`   ! ${warns.join('\n   ! ')}`);
}
process.exit(failed ? 1 : 0);

function resolves(link) {
  const p = link.split('#')[0];
  const parts = p.split('/').filter(Boolean);
  if (parts.length === 2 && parts[0] in collections) {
    if (parts[0] === 'demos') return existsSync('src/data/demos.ts') && readFileSync('src/data/demos.ts', 'utf8').includes(`'${parts[1]}'`);
    return existsSync(`src/content/${collections[parts[0]]}/${parts[1]}.md`);
  }
  return false;
}
