// Quick pre-build check for service × country pages (S11, D75): src/content/local/<location>/<agent>.md.
// Mirrors the limits in src/content.config.ts → local and the content rules (CLAUDE.md, check-locations.mjs).
// Usage: node scripts/check-local.mjs [location/agent …]   (no args = every file)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { parse } from 'yaml';

const dir = 'src/content/local';
const siteTs = readFileSync('src/data/site.ts', 'utf8');
const delivered = siteTs.match(/deliveredInCodes: \[([^\]]+)\]/)[1].match(/[A-Z]{2}/g);
const all = existsSync(dir)
  ? readdirSync(dir).filter((d) => statSync(`${dir}/${d}`).isDirectory()).flatMap((loc) => readdirSync(`${dir}/${loc}`).filter((f) => f.endsWith('.md') && !f.startsWith('_')).map((f) => `${loc}/${f.slice(0, -3)}`))
  : [];
const ids = process.argv.slice(2).length ? process.argv.slice(2) : all;

const common = [
  [/—/, 'em-dash'],
  [/[$£€]\s?\d|\b(USD|EUR|GBP|AED|SAR|PKR|AUD|CAD|Rs\.?)\s?\d|\d+\s?(k|K)\b/, 'price or money amount (prices are computed from pricing.ts)'],
  [/\b(?!100%)\d+(\.\d+)?\s?%/, 'percentage (only with a source in the same item; prefer none)'],
  [/bahrain|switch \(hss\)|\bHSS\b|\bSPD\b|air force|hezbollah|pager|defen[cs]e site/i, 'confidential term (CLAUDE.md)'],
  [/\b(DoD|Department of Defense|Ministry of Defen[cs]e|NATO|army|navy|marines|pentagon|MoD)\b/, 'named defense body'],
  [/testimonial|\breviews? from (our )?clients|rated \d|\d(\.\d)? stars?|award[- ]winning|\bawards?\b|trusted by|clients include/i, 'proof claim'],
  [/\b(ISO ?27001|SOC ?2|HIPAA|GDPR|PCI|PDPL|PIPEDA)[- ]?(certified|compliant company|accredited)/i, 'certification claim'],
  [/\bcertified\b|\bofficial partner\b|\bpartner of\b|\bpremier partner\b|\bauthori[sz]ed (reseller|partner)\b|\bMeta (Business )?Partner\b|\bBSP\b/i, 'certification or partnership claim'],
  [/icasta|khadbazar|ric nexus|genpk|tru hair/i, 'client or project name'],
  [/\bin our experience\b|\bour clients (see|report|saw)\b|\bproven\b/i, 'experience or outcome claim'],
  [/\bour (\w+ )?(office|branch|team) in (?!Rawalpindi|Pakistan)/i, 'implies an office or team abroad'],
];
const ukForms = [/\b(optimis|organis|recognis|personalis|prioritis|minimis|maximis|customis|standardis|digitis|authoris|summaris|categoris|utilis|realis|specialis|analys(e|ing|ed))\w*/i, /\b(colour|behaviour|favour|centre|licence|catalogue|enrolment|fulfil)\b/i];
const usForms = [
  /\b(?!(size|seize|prize|capsize|resize|downsize|oversize|citizen|maize|baize)\w*\b)\w*(iz(e|es|ed|ing|ation|ations)|yz(e|es|ed|ing))\b/i,
  /\b(color|behavior|favor|favorite|center|centered|catalog|enrollment|fulfill|fulfillment|canceled|canceling|labeled|labeling|modeling|traveled|traveling)\b/i,
];

let failed = 0;
for (const id of ids) {
  const file = `${dir}/${id}.md`;
  const errs = [];
  if (!existsSync(file)) {
    console.log(`✗ ${id}: file missing`);
    failed++;
    continue;
  }
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  let d;
  try {
    d = parse(m[1]);
  } catch (e) {
    console.log(`✗ ${id}: YAML error: ${e.message}`);
    failed++;
    continue;
  }
  const [locSlug, agentSlug] = id.split('/');
  const len = (v, min, max, name) => {
    if (typeof v !== 'string') return errs.push(`${name} missing`);
    if (v.length < min || v.length > max) errs.push(`${name} is ${v.length} chars (want ${min}–${max}): "${v.slice(0, 80)}"`);
  };
  const count = (a, min, max, name) => {
    if (!Array.isArray(a)) return errs.push(`${name} missing`);
    if (a.length < min || a.length > max) errs.push(`${name} has ${a.length} items (want ${min}–${max})`);
  };
  const isUrl = (u) => typeof u === 'string' && /^https:\/\/[^\s]+$/.test(u);
  if (d.location !== locSlug) errs.push(`location "${d.location}" ≠ folder "${locSlug}"`);
  if (d.agent !== agentSlug) errs.push(`agent "${d.agent}" ≠ file name "${agentSlug}"`);
  const locFile = `src/content/locations/${locSlug}.md`;
  if (!existsSync(locFile)) errs.push(`no location "${locSlug}"`);
  if (!existsSync(`src/content/agents/${agentSlug}.md`)) errs.push(`no agent "${agentSlug}"`);
  const loc = existsSync(locFile) ? parse(readFileSync(locFile, 'utf8').match(/^---\n([\s\S]*?)\n---/)[1]) : {};
  len(d.seo?.title, 10, 46, 'seo.title');
  len(d.seo?.description, 70, 155, 'seo.description');
  if (d.seo?.title && d.keywords?.primary && !d.seo.title.toLowerCase().includes(d.keywords.primary.toLowerCase())) errs.push(`seo.title does not contain keywords.primary "${d.keywords.primary}"`);
  len(d.summary?.trim(), 120, 480, 'summary');
  const wc = d.summary?.trim().split(/\s+/).length ?? 0;
  if (wc < 40 || wc > 65) errs.push(`summary is ${wc} words (want 45–60)`);
  len(d.h1, 20, 80, 'h1');
  len(d.tagline, 30, 110, 'tagline');
  count(d.local, 3, 4, 'local');
  (d.local ?? []).forEach((x) => (len(x.title, 3, 60, 'local.title'), len(x.body, 80, 320, `local.body "${x.title}"`)));
  count(d.scenarios, 3, 5, 'scenarios');
  (d.scenarios ?? []).forEach((x) => {
    len(x.who, 3, 48, 'scenarios.who');
    len(x.body, 80, 300, `scenarios.body "${x.who}"`);
    if (x.industry && !existsSync(`src/content/industries/${x.industry}.md`)) errs.push(`scenarios: unknown industry "${x.industry}"`);
  });
  count(d.rules, 3, 5, 'rules');
  (d.rules ?? []).forEach((x) => {
    len(x.name, 3, 60, 'rules.name');
    len(x.body, 80, 360, `rules.body "${x.name}"`);
    if (!isUrl(x.source)) errs.push(`rules "${x.name}": source must be an https URL`);
  });
  count(d.setup, 3, 5, 'setup');
  (d.setup ?? []).forEach((x) => (len(x.title, 3, 60, 'setup.title'), len(x.body, 60, 300, `setup.body "${x.title}"`)));
  count(d.systems, 2, 5, 'systems');
  (d.systems ?? []).forEach((x) => {
    len(x.kind, 3, 32, 'systems.kind');
    count(x.names, 1, 6, `systems.names "${x.kind}"`);
    (x.names ?? []).forEach((n) => len(n, 2, 32, 'systems name'));
  });
  count(d.sources, 3, 12, 'sources');
  (d.sources ?? []).forEach((x) => (len(x.title, 3, 120, 'sources.title'), !isUrl(x.url) && errs.push(`sources "${x.title}": bad url`)));
  const srcUrls = new Set((d.sources ?? []).map((x) => x.url));
  (d.rules ?? []).forEach((x) => isUrl(x.source) && !srcUrls.has(x.source) && errs.push(`rules "${x.name}": its source is not listed in sources`));
  count(d.faq, 5, 8, 'faq');
  (d.faq ?? []).forEach((f) => /how much|cost|price/i.test(f.q ?? '') && errs.push(`faq "${f.q}": the price question is generated, remove it`));
  if (!/^\d{4}-\d\d-\d\d$/.test(String(d.updated instanceof Date ? d.updated.toISOString().slice(0, 10) : d.updated))) errs.push('updated must be a date');
  if (loc.code && !delivered.includes(loc.code) && new RegExp(`(clients|customers|projects) in ${loc.inName}`, 'i').test(raw)) errs.push(`mentions past clients in ${loc.inName} (not owner-confirmed)`);
  const copy = raw.replace(/^keywords:[\s\S]*?(?=^summary:)/m, '');
  const comp = copy.match(/\b(GDPR|UK GDPR|HIPAA|SOC ?2|PCI|PDPL|PIPEDA|APP|CASL|PECA|TCPA)[- ]compliant\b/i);
  if (comp) errs.push(`compliance claim in copy: "${comp[0]}"`);
  // Market figures and money amounts would need a source next to them; keep the URLs out of the scan.
  const scan = raw.replace(/https?:\/\/\S+/g, '');
  for (const [re, what] of common) {
    const hit = scan.match(re);
    if (hit) errs.push(`${what}: "${hit[0]}"`);
  }
  const spelling = loc.spelling ?? 'us';
  for (const re of spelling === 'uk' ? usForms : ukForms) {
    const hit = scan.match(re);
    if (hit) errs.push(`${spelling === 'uk' ? 'US' : 'UK'} spelling on a ${spelling.toUpperCase()}-spelling page: "${hit[0]}"`);
  }
  if (d.draft) errs.push('draft: true');
  if (errs.length) {
    failed++;
    console.log(`✗ ${id}\n   - ${errs.join('\n   - ')}`);
  } else console.log(`✓ ${id}`);
}
if (!ids.length) console.log('no files');
process.exit(failed ? 1 : 0);
