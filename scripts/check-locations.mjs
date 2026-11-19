// Quick pre-build check for country pages (S9). Mirrors the hard limits in src/content.config.ts → locations and the
// content rules in CLAUDE.md, so files can be checked one by one before the full `npm run build`.
// Usage: node scripts/check-locations.mjs [slug …]   (no args = every file in src/content/locations/)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const dir = 'src/content/locations';
const catalogue = readFileSync('src/data/catalogue.ts', 'utf8');
const siteTs = readFileSync('src/data/site.ts', 'utf8');
const delivered = siteTs.match(/deliveredInCodes: \[([^\]]+)\]/)[1].match(/[A-Z]{2}/g);
const PKT = 5;
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_')).map((f) => f.slice(0, -3));

const common = [
  [/—/, 'em-dash'],
  [/[$£€]\s?\d|\b(USD|EUR|GBP|AED|SAR|PKR|AUD|CAD|Rs\.?)\s?\d|\d+\s?(k|K)\b/, 'price or money amount (prices are computed from pricing.ts)'],
  [/\b(?!100%)\d+(\.\d+)?\s?%/, 'percentage (no statistics)'],
  [/bahrain|switch \(hss\)|\bHSS\b|\bSPD\b|air force|hezbollah|pager|defen[cs]e site/i, 'confidential term (CLAUDE.md)'],
  [/\b(DoD|Department of Defense|Ministry of Defen[cs]e|NATO|army|navy|marines|pentagon|MoD)\b/, 'named defense body (keep sector wording generic)'],
  [/testimonial|\breviews? from (our )?clients|rated \d|\d(\.\d)? stars?|award[- ]winning|\bawards?\b|trusted by|clients include/i, 'proof claim (no testimonials, ratings, awards or client lists)'],
  [/\b(ISO ?27001|SOC ?2|HIPAA|GDPR|PCI|PDPL|PIPEDA)[- ]?(certified|compliant company|accredited)/i, 'certification claim'],
  [/\b(we are|we're|is|are|fully|100%) (HIPAA|GDPR|UK GDPR|SOC ?2|PCI[- ]DSS|PDPL|PIPEDA|APP)[- ]compliant/i, 'compliance claim (say what we put in place instead)'],
  [/\bcertified\b|\bofficial partner\b|\bpartner of\b|\bpremier partner\b|\bauthori[sz]ed (reseller|partner)\b/i, 'certification or partnership claim'],
  [/icasta|khadbazar|ric nexus|genpk|tru hair/i, 'client or project name'],
  [/\bin our experience\b|\bour clients (see|report|saw)\b|\bproven\b/i, 'experience or outcome claim (capabilities and process only)'],
  [/\bour (\w+ )?(office|branch|team) in (?!Rawalpindi|Pakistan)/i, 'implies an office or team abroad (we work from Rawalpindi only)'],
];
const ukForms = [/\b(optimis|organis|recognis|personalis|prioritis|minimis|maximis|customis|standardis|digitis|authoris|summaris|categoris|utilis|realis|specialis|analys(e|ing|ed))\w*/i, /\b(colour|behaviour|favour|centre|licence|catalogue|enrolment|fulfil)\b/i];
const usForms = [
  /\b(?!(size|seize|prize|capsize|resize|downsize|oversize|citizen|maize|baize)\w*\b)\w*(iz(e|es|ed|ing|ation|ations)|yz(e|es|ed|ing))\b/i,
  /\b(color|behavior|favor|favorite|center|centered|catalog|enrollment|fulfill|fulfillment|canceled|canceling|labeled|labeling|modeling|traveled|traveling)\b/i,
];

const mod = (h) => ((h % 24) + 24) % 24;
function overlapHours(zone, shift, workday = [9, 17]) {
  const start = mod(shift[0] + zone.offset - PKT);
  const len = mod(shift[1] - shift[0]) || 24;
  const parts = start + len <= 24 ? [[start, start + len]] : [[start, 24], [0, start + len - 24]];
  return Math.max(0, ...parts.map(([a, b]) => Math.min(b, workday[1]) - Math.max(a, workday[0])));
}
const words = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };

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
  const cat = catalogue.match(new RegExp(`slug: '${slug}', name: '([^']+)', code: '([A-Z]{2})'`));
  if (!cat) errs.push('slug not in catalogue.ts locations');
  else {
    if (d.name !== cat[1]) errs.push(`name "${d.name}" ≠ catalogue "${cat[1]}"`);
    if (d.code !== cat[2]) errs.push(`code "${d.code}" ≠ catalogue "${cat[2]}"`);
  }
  if (!['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'AED', 'SAR', 'PKR'].includes(d.currency)) errs.push(`currency "${d.currency}" not supported`);
  len(d.country, 2, 40, 'country');
  len(d.inName, 2, 24, 'inName');
  len(d.who, 6, 32, 'who');
  len(d.seo?.title, 10, 46, 'seo.title');
  len(d.seo?.description, 70, 155, 'seo.description');
  if (d.seo?.title && d.keywords?.primary && !d.seo.title.toLowerCase().includes(d.keywords.primary.toLowerCase()))
    errs.push(`seo.title "${d.seo.title}" does not contain keywords.primary "${d.keywords.primary}"`);
  len(d.summary?.trim(), 120, 480, 'summary');
  const wc = d.summary?.trim().split(/\s+/).length ?? 0;
  if (wc < 40 || wc > 65) errs.push(`summary is ${wc} words (want 45–60)`);
  len(d.tagline, 30, 90, 'tagline');
  len(d.h1, 20, 80, 'h1');
  len(d.overlapNote, 30, 240, 'overlapNote');
  count(d.zones, 1, 3, 'zones');
  (d.zones ?? []).forEach((z) => {
    if (!z.city || z.city.length > 20 || !z.abbr || z.abbr.length > 6 || typeof z.offset !== 'number') errs.push(`bad zone: ${JSON.stringify(z)}`);
  });
  if (!Array.isArray(d.shift) || d.shift.length !== 2) errs.push('shift must be [start, end] in PKT hours');
  else if (d.zones?.[0]) {
    const h = overlapHours(d.zones[0], d.shift, d.workday);
    if (h < 4) errs.push(`only ${h} h live overlap with ${d.zones[0].city} (min 4)`);
    // Any "N hours of (live) overlap" claim must match a computed value for one of the zones.
    const computed = d.zones.map((z) => overlapHours(z, d.shift, d.workday));
    for (const hit of raw.matchAll(/\b(\d|two|three|four|five|six|seven|eight|nine) hours of (live )?overlap/gi)) {
      const n = Number(hit[1]) || words[hit[1].toLowerCase()];
      if (!computed.includes(n)) errs.push(`"${hit[0]}" does not match the computed overlap (${computed.join(', ')} h)`);
    }
  }
  count(d.why, 3, 4, 'why');
  (d.why ?? []).forEach((w) => {
    if (!w.title || w.title.length > 60) errs.push(`why title missing or > 60: "${w.title}"`);
    if (!w.body || w.body.length < 60 || w.body.length > 260) errs.push(`why body must be 60–260 chars (${w.body?.length}): "${w.title}"`);
  });
  count(d.popular, 3, 4, 'popular');
  (d.popular ?? []).forEach((p) => {
    if (!existsSync(`src/content/agents/${p.agent}.md`)) errs.push(`popular: no agent "${p.agent}"`);
    if (!p.body || p.body.length < 60 || p.body.length > 240) errs.push(`popular body must be 60–240 chars (${p.body?.length}): "${p.agent}"`);
  });
  count(d.compliance, 3, 5, 'compliance');
  (d.compliance ?? []).forEach((c) => {
    if (!c.name || c.name.length > 40) errs.push(`compliance name missing or > 40 chars: "${c.name}"`);
    if (!c.scope || c.scope.length > 24) errs.push(`compliance scope missing or > 24 chars: "${c.scope}"`);
    if (!c.body || c.body.length < 40 || c.body.length > 280) errs.push(`compliance body must be 40–280 chars (${c.body?.length}): "${c.name}"`);
  });
  count(d.contracts, 3, 5, 'contracts');
  (d.contracts ?? []).forEach((c) => {
    if (!c.title || c.title.length > 48) errs.push(`contracts title missing or > 48 chars: "${c.title}"`);
    if (!c.body || c.body.length < 40 || c.body.length > 280) errs.push(`contracts body must be 40–280 chars (${c.body?.length}): "${c.title}"`);
  });
  count(d.industries, 3, 4, 'industries');
  (d.industries ?? []).forEach((i) => {
    if (!existsSync(`src/content/industries/${i.industry}.md`)) errs.push(`industries: unknown industry "${i.industry}"`);
    if (!i.body || i.body.length < 60 || i.body.length > 240) errs.push(`industries body must be 60–240 chars (${i.body?.length}): "${i.industry}"`);
  });
  count(d.services, 2, 4, 'services');
  (d.services ?? []).forEach((s) => !existsSync(`src/content/services/${s}.md`) && errs.push(`services: unknown service "${s}"`));
  count(d.faq, 5, 8, 'faq');
  (d.faq ?? []).forEach((f) => (!f.q || !f.a || f.a.length < 20) && errs.push(`bad faq item: ${JSON.stringify(f).slice(0, 80)}`));
  (d.faq ?? []).forEach((f) => /how much|cost|price/i.test(f.q ?? '') && errs.push(`faq "${f.q}": the price question is generated from pricing.ts, remove it`));
  if (!(d.updated instanceof Date) && !/^\d{4}-\d\d-\d\d$/.test(String(d.updated))) errs.push('updated must be a date');
  // "Delivered for clients in X" only for owner-confirmed countries.
  if (!delivered.includes(d.code) && new RegExp(`(clients|customers|projects) in ${d.inName}`, 'i').test(raw)) errs.push(`mentions past clients/projects in ${d.inName} (not owner-confirmed)`);
  // "GDPR compliant" etc. is fine as a search keyword, never in page copy.
  const copy = raw.replace(/^keywords:[\s\S]*?(?=^summary:)/m, '');
  const comp = copy.match(/\b(GDPR|UK GDPR|HIPAA|SOC ?2|PCI|PDPL|PIPEDA|APP|CASL|PECA)[- ]compliant\b/i);
  if (comp) errs.push(`compliance claim in copy: "${comp[0]}"`);
  for (const [re, what] of common) {
    const hit = raw.match(re);
    if (hit) errs.push(`${what}: "${hit[0]}"`);
  }
  const spelling = d.spelling ?? 'us';
  for (const re of spelling === 'uk' ? usForms : ukForms) {
    const hit = raw.match(re);
    if (hit) errs.push(`${spelling === 'uk' ? 'US' : 'UK'} spelling on a ${spelling.toUpperCase()}-spelling page: "${hit[0]}"`);
  }
  if (d.draft) errs.push('draft: true (remove it to publish)');
  if (errs.length) {
    failed++;
    console.log(`✗ ${slug}\n   - ${errs.join('\n   - ')}`);
  } else console.log(`✓ ${slug} (overlap ${d.zones.map((z) => `${z.city} ${overlapHours(z, d.shift, d.workday)} h`).join(', ')})`);
}
process.exit(failed ? 1 : 0);
