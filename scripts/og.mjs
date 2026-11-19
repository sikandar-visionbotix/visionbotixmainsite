// Per-page Open Graph images (S5). Runs after `astro build`: for every page in dist/ whose og:image points at
// /og/<path>.png (the Seo component's default), render a 1200×630 PNG from that page's own og:title and
// description, in the brand style. One source of truth (the page's meta), no per-page wiring.
// Usage: node scripts/og.mjs   (part of `npm run build`)
import { readFileSync, writeFileSync, mkdirSync, globSync } from 'node:fs';
import { dirname, join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const font = (w) => readFileSync(join(root, `node_modules/@fontsource/geist/files/geist-latin-${w}-normal.woff`));
const fonts = [
  { name: 'Geist', data: font(400), weight: 400, style: 'normal' },
  { name: 'Geist', data: font(600), weight: 600, style: 'normal' },
  { name: 'Geist', data: font(700), weight: 700, style: 'normal' },
];
const logo = `data:image/png;base64,${readFileSync(join(root, 'public/images/brand/visionbotix-logo.png')).toString('base64')}`;

const sections = {
  'ai-agents': 'AI Agents',
  services: 'Services',
  products: 'Products',
  work: 'Case study',
  pricing: 'Pricing',
  about: 'About',
  process: 'How we work',
  contact: 'Contact',
  careers: 'Careers',
  privacy: 'Legal',
  terms: 'Legal',
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, prop) => {
  const m = html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`));
  return m ? decode(m[1]) : '';
};
const h = (type, style, children) => ({ type, props: { style, children } });

function card({ eyebrow, title, description }) {
  const size = title.length > 60 ? 54 : title.length > 40 ? 62 : 72;
  return h(
    'div',
    {
      // satori sizes content-box: 1056 + 2×72 = 1200, 502 + 2×64 = 630
      width: 1056,
      height: 502,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      backgroundColor: '#0b0d12',
      backgroundImage:
        'radial-gradient(circle at 92% 8%, rgba(240,84,45,0.55), transparent 42%), radial-gradient(circle at 78% 100%, rgba(236,30,89,0.45), transparent 45%), radial-gradient(circle at 0% 100%, rgba(99,102,241,0.30), transparent 40%)',
      color: '#f5f6f8',
      fontFamily: 'Geist',
    },
    [
      h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
        { type: 'img', props: { src: logo, width: 246, height: 70 } },
        eyebrow
          ? h(
              'div',
              { display: 'flex', padding: '10px 22px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.22)', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: 24, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#ffb48a' },
              eyebrow,
            )
          : h('div', {}, ''),
      ]),
      h('div', { display: 'flex', flexDirection: 'column', gap: 22 }, [
        h('div', { fontSize: size, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2, maxWidth: 1000 }, title),
        description ? h('div', { fontSize: 27, lineHeight: 1.4, color: 'rgba(245,246,248,0.72)', maxWidth: 980 }, description) : h('div', {}, ''),
      ]),
      h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 24, color: 'rgba(245,246,248,0.7)' }, [
        h('div', { display: 'flex' }, 'visionbotix.com'),
        h('div', { display: 'flex', width: 360, height: 8, borderRadius: 8, backgroundImage: 'linear-gradient(90deg, #F7941D, #F0542D, #EC1E59)' }, ''),
      ]),
    ],
  );
}

const clip = (s, n) => (s.length > n ? s.slice(0, s.lastIndexOf(' ', n)).replace(/[,;:.]$/, '') + '…' : s);
const pages = globSync('**/*.html', { cwd: dist }).filter((p) => !p.startsWith('truhairandskin/'));
let made = 0;
const missing = [];
for (const page of pages) {
  const html = readFileSync(join(dist, page), 'utf8');
  const img = meta(html, 'og:image');
  const m = img.match(/^https:\/\/visionbotix\.com\/(og\/.+\.png)$/);
  if (!m) continue;
  const path = '/' + page.replace(/index\.html$/, '');
  const seg = path.split('/').filter(Boolean)[0] ?? '';
  const title = meta(html, 'og:title').replace(/ \| Visionbotix$/, '');
  const description = clip(meta(html, 'og:description'), 150);
  if (!title) missing.push(page);
  const svg = await satori(card({ eyebrow: sections[seg] ?? (seg ? '' : 'AI agents · Software · Security'), title, description }), { width: 1200, height: 630, fonts });
  const out = join(dist, m[1]);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer());
  made++;
}
if (missing.length) {
  console.error(`[og] pages without og:title: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`[og] ${made} Open Graph images written to dist/og/`);
