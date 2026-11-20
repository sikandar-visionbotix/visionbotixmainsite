// Monthly Google Search Console ranking report (S11). No dependencies: signs a service-account JWT with node:crypto,
// calls the Search Console API (read-only scope) and writes a Markdown report.
//
// One-time setup (owner, ~10 minutes; the key never goes in the repo or in chat):
//   1. console.cloud.google.com → new project → APIs & Services → enable "Google Search Console API".
//   2. IAM & Admin → Service accounts → create one (no roles) → Keys → Add key → JSON → save it OUTSIDE the repo,
//      e.g. ~/.config/visionbotix/gsc-key.json.
//   3. search.google.com/search-console → visionbotix.com property → Settings → Users and permissions → Add user →
//      the service account's email, permission "Restricted" (read-only).
// Run (from visionbotixmainsite/):
//   GSC_KEY_FILE=~/.config/visionbotix/gsc-key.json node scripts/gsc-report.mjs [--days 28] [--out ../overhaul/reporting]
// Env: GSC_SITE (default "sc-domain:visionbotix.com"; use "https://visionbotix.com/" for a URL-prefix property).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? [...a, [v.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']] : a), []));
const DAYS = Number(args.days) || 28;
const OUT = resolve(args.out || '../overhaul/reporting');
const SITE = process.env.GSC_SITE || 'sc-domain:visionbotix.com';
const ORIGIN = 'https://visionbotix.com';
const keyFile = (process.env.GSC_KEY_FILE || '').replace(/^~(?=\/)/, homedir());
if (!keyFile) {
  console.error('Set GSC_KEY_FILE to the service-account JSON key (see the setup steps at the top of this file).');
  process.exit(1);
}
const key = JSON.parse(readFileSync(keyFile, 'utf8'));

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const body = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(body).sign(key.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${body}.${sig}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`Token request failed: ${JSON.stringify(j)}`);
  return j.access_token;
}

const day = (offset) => new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);
// Search Console data lags by 2–3 days.
const cur = { start: day(DAYS + 2), end: day(3) };
const prev = { start: day(2 * DAYS + 2), end: day(DAYS + 3) };

let bearer;
async function query(range, dimensions, rowLimit = 1000) {
  const r = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: range.start, endDate: range.end, dimensions, rowLimit, dataState: 'final' }),
  });
  const j = await r.json();
  if (j.error) throw new Error(`Search Console API: ${j.error.message}`);
  return j.rows ?? [];
}

const n = (x) => Math.round(x).toLocaleString('en-US');
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const pos = (x) => (x ? x.toFixed(1) : '–');
const delta = (a, b, f = n) => (b ? `${a >= b ? '+' : ''}${f(a - b)}` : 'new');
const short = (u) => u.replace(ORIGIN, '') || '/';
const sum = (rows) => {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const position = impressions ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / impressions : 0;
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position };
};

/** Primary keywords per page from TRACKER.md's keyword map. */
function keywordMap() {
  try {
    const t = readFileSync(resolve('../overhaul/TRACKER.md'), 'utf8');
    const block = t.split('## Keyword map')[1]?.split('\n## ')[0] ?? '';
    return block
      .split('\n')
      .map((l) => l.match(/^\|\s*(\/[^|]*?)\s*\|\s*([^|]+?)\s*\|/))
      .filter(Boolean)
      .map((m) => ({ page: m[1], keyword: m[2].toLowerCase() }));
  } catch {
    return [];
  }
}

async function sitemapUrls() {
  try {
    const idx = await (await fetch(`${ORIGIN}/sitemap-index.xml`)).text();
    const maps = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const urls = [];
    for (const m of maps) urls.push(...[...(await (await fetch(m)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]));
    return urls;
  } catch {
    return [];
  }
}

bearer = await token();
const [qNow, qPrev, pNow, pPrev, cNow, dNow, urls] = await Promise.all([
  query(cur, ['query'], 5000),
  query(prev, ['query'], 5000),
  query(cur, ['page'], 1000),
  query(prev, ['page'], 1000),
  query(cur, ['country'], 50),
  query(cur, ['device'], 5),
  sitemapUrls(),
]);
const tNow = sum(pNow);
const tPrev = sum(pPrev);
const prevQ = new Map(qPrev.map((r) => [r.keys[0], r]));
const prevP = new Map(pPrev.map((r) => [r.keys[0], r]));
const seen = new Set(pNow.map((r) => r.keys[0]));

const L = [];
L.push(`# Search Console report, ${cur.end}`, '');
L.push(`Property \`${SITE}\` · last ${DAYS} days (${cur.start} to ${cur.end}) vs the ${DAYS} days before. Generated by \`scripts/gsc-report.mjs\`.`, '');
L.push('## Totals', '', '| Metric | Now | Before | Change |', '|---|---|---|---|');
L.push(`| Clicks | ${n(tNow.clicks)} | ${n(tPrev.clicks)} | ${delta(tNow.clicks, tPrev.clicks)} |`);
L.push(`| Impressions | ${n(tNow.impressions)} | ${n(tPrev.impressions)} | ${delta(tNow.impressions, tPrev.impressions)} |`);
L.push(`| CTR | ${pct(tNow.ctr)} | ${pct(tPrev.ctr)} | |`);
L.push(`| Average position | ${pos(tNow.position)} | ${pos(tPrev.position)} | |`);
L.push(`| Pages with impressions | ${seen.size} of ${urls.length || '?'} in the sitemap | ${pPrev.length} | |`, '');

const kw = keywordMap();
if (kw.length) {
  L.push('## Keyword map: primary keyword per page', '', '| Page | Primary keyword | Position | Impressions | Clicks |', '|---|---|---|---|---|');
  for (const k of kw) {
    const hit = qNow.find((r) => r.keys[0].toLowerCase() === k.keyword) ?? qNow.find((r) => r.keys[0].toLowerCase().includes(k.keyword));
    L.push(`| ${k.page} | ${k.keyword} | ${hit ? pos(hit.position) : 'not yet'} | ${hit ? n(hit.impressions) : 0} | ${hit ? n(hit.clicks) : 0} |`);
  }
  L.push('');
}

L.push('## Top queries', '', '| Query | Clicks | Impressions | CTR | Position | Position change |', '|---|---|---|---|---|---|');
for (const r of [...qNow].sort((a, b) => b.impressions - a.impressions).slice(0, 30)) {
  const p = prevQ.get(r.keys[0]);
  L.push(`| ${r.keys[0].replace(/\|/g, '/')} | ${n(r.clicks)} | ${n(r.impressions)} | ${pct(r.ctr)} | ${pos(r.position)} | ${p ? (p.position - r.position >= 0 ? '▲ ' : '▼ ') + Math.abs(p.position - r.position).toFixed(1) : 'new'} |`);
}
L.push('');

const near = qNow.filter((r) => r.position > 10 && r.position <= 20 && r.impressions >= 10).sort((a, b) => b.impressions - a.impressions).slice(0, 15);
if (near.length) {
  L.push('## Page two (positions 11–20): the quickest wins', '', '| Query | Position | Impressions |', '|---|---|---|');
  for (const r of near) L.push(`| ${r.keys[0].replace(/\|/g, '/')} | ${pos(r.position)} | ${n(r.impressions)} |`);
  L.push('');
}

L.push('## Top pages', '', '| Page | Clicks | Impressions | Position | Clicks change |', '|---|---|---|---|---|');
for (const r of [...pNow].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 30)) {
  const p = prevP.get(r.keys[0]);
  L.push(`| ${short(r.keys[0])} | ${n(r.clicks)} | ${n(r.impressions)} | ${pos(r.position)} | ${delta(r.clicks, p?.clicks ?? 0)} |`);
}
L.push('');

L.push('## Countries', '', '| Country | Clicks | Impressions | Position |', '|---|---|---|---|');
for (const r of cNow.slice(0, 12)) L.push(`| ${r.keys[0].toUpperCase()} | ${n(r.clicks)} | ${n(r.impressions)} | ${pos(r.position)} |`);
L.push('', '## Devices', '', dNow.map((r) => `${r.keys[0]}: ${n(r.clicks)} clicks, ${n(r.impressions)} impressions`).join(' · '), '');

if (urls.length) {
  const missing = urls.filter((u) => !seen.has(u));
  L.push(`## Sitemap pages with no impressions yet (${missing.length})`, '', 'Check these in URL Inspection; resubmit or strengthen internal links if they stay at zero.', '');
  for (const u of missing.slice(0, 60)) L.push(`- ${short(u)}`);
  if (missing.length > 60) L.push(`- … and ${missing.length - 60} more`);
}

mkdirSync(OUT, { recursive: true });
const file = `${OUT}/gsc-${cur.end}.md`;
writeFileSync(file, `${L.join('\n')}\n`);
console.log(`Wrote ${file}`);
