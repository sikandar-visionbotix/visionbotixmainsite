// Internal link checker over dist/: every href/src that points inside the site must resolve to a file.
// Usage: node scripts/check-links.mjs [--summary]   (exit 1 on broken links)
import { readFileSync, existsSync, statSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const redirects = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url))).redirects.map((r) => r.source);
// /truhairandskin/ is a legacy page served unchanged (its root /assets/ were already missing on the old site).
const pages = globSync('**/*.html', { cwd: dist }).filter((p) => !p.startsWith('truhairandskin/'));
const missing = new Map();
const ids = new Map();

const resolves = (p) => {
  if (redirects.includes(p)) return true;
  const f = join(dist, decodeURIComponent(p));
  if (existsSync(f) && statSync(f).isFile()) return true;
  return existsSync(join(f, 'index.html'));
};

for (const page of pages) {
  const html = readFileSync(join(dist, page), 'utf8');
  const from = '/' + page.replace(/index\.html$/, '');
  ids.set(from, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  for (const [, url] of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|javascript:|#)/.test(url) && !url.startsWith('https://visionbotix.com')) continue;
    const u = new URL(url, 'https://visionbotix.com' + from);
    if (u.host !== 'visionbotix.com') continue;
    if (!resolves(u.pathname)) {
      if (!missing.has(u.pathname)) missing.set(u.pathname, new Set());
      missing.get(u.pathname).add(from);
    }
  }
}
// Same-site fragment links: the target id must exist on the target page.
const badFrag = [];
for (const page of pages) {
  const html = readFileSync(join(dist, page), 'utf8');
  const from = '/' + page.replace(/index\.html$/, '');
  for (const [, url] of html.matchAll(/\shref="([^"]*#[^"]+)"/g)) {
    if (/^https?:/.test(url)) continue;
    const u = new URL(url, 'https://visionbotix.com' + from);
    const set = ids.get(u.pathname);
    const id = decodeURIComponent(u.hash.slice(1));
    if (set && !set.has(id)) badFrag.push(`${from} → ${u.pathname}${u.hash}`);
  }
}
const summary = process.argv.includes('--summary');
for (const [p, froms] of [...missing].sort()) console.log(`MISSING ${p}  (${froms.size} pages${summary ? '' : ': ' + [...froms].slice(0, 3).join(', ')})`);
for (const f of [...new Set(badFrag)]) console.log(`BAD FRAGMENT ${f}`);
console.log(`${pages.length} pages checked · ${missing.size} missing targets · ${new Set(badFrag).size} bad fragments`);
process.exit(missing.size || badFrag.length ? 1 : 0);
