/**
 * Reads the raw HTML the way most AI crawlers see it: without running JavaScript (S11 AI visibility checker).
 * Regex-based on purpose (no dependency, bounded input of at most 1.5 MB); good enough for the signals we score.
 */

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', copy: '©' };
export function decode(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}
const safeChar = (n) => (n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '');
const squash = (s) => decode(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([^\s=/>"']+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g)) {
    const k = m[1].toLowerCase();
    if (k.startsWith('<')) continue;
    out[k] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return out;
}

const words = (s) => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;

function collectTypes(node, out) {
  if (Array.isArray(node)) return node.forEach((n) => collectTypes(n, out));
  if (!node || typeof node !== 'object') return;
  const t = node['@type'];
  if (t) (Array.isArray(t) ? t : [t]).forEach((x) => typeof x === 'string' && out.types.add(x));
  if (node.sameAs) (Array.isArray(node.sameAs) ? node.sameAs : [node.sameAs]).forEach((x) => typeof x === 'string' && out.sameAs.add(x));
  for (const k of ['dateModified', 'datePublished', 'uploadDate']) if (typeof node[k] === 'string') out.dates.push(node[k]);
  if (node.author) out.author = true;
  if (node.address || node.telephone || node.email) out.contact = true;
  for (const [k, v] of Object.entries(node)) if (k !== 'sameAs' && v && typeof v === 'object') collectTypes(v, out);
}

/** @param {string} html @param {string} pageUrl */
export function analyse(html, pageUrl) {
  const src = String(html).replace(/<!--[\s\S]*?-->/g, '');
  const head = (src.match(/<head[\s>][\s\S]*?<\/head>/i) ?? [src.slice(0, 50_000)])[0];

  const htmlTag = src.match(/<html\b[^>]*>/i)?.[0] ?? '';
  const lang = attrs(htmlTag).lang ?? '';
  const title = squash(src.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');

  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const meta = (name) => metas.find((m) => (m.name ?? m.property ?? '').toLowerCase() === name)?.content ?? '';
  const robotsMeta = metas
    .filter((m) => /^(robots|googlebot|bingbot)$/i.test(m.name ?? ''))
    .map((m) => `${m.name.toLowerCase()}: ${(m.content ?? '').toLowerCase()}`);

  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const canonical = links.find((l) => (l.rel ?? '').toLowerCase().split(/\s+/).includes('canonical'))?.href ?? '';

  // JSON-LD
  const ld = { blocks: 0, errors: 0, types: new Set(), sameAs: new Set(), dates: [], author: false, contact: false };
  for (const m of src.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    ld.blocks++;
    try {
      collectTypes(JSON.parse(m[1].trim()), ld);
    } catch {
      ld.errors++;
    }
  }
  const microdata = /\bitemtype\s*=\s*["']https?:\/\/schema\.org\//i.test(src);

  // Body, as a crawler that does not run JavaScript sees it.
  const bodyRaw = (src.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? src).replace(/<(script|style|noscript|template|svg|iframe)\b[\s\S]*?<\/\1>/gi, ' ');
  const text = squash(bodyRaw);
  const wordCount = words(text);

  const heads = (lvl) => [...bodyRaw.matchAll(new RegExp(`<h${lvl}\\b[^>]*>([\\s\\S]*?)<\\/h${lvl}>`, 'gi'))].map((m) => squash(m[1])).filter(Boolean);
  const h1 = heads(1);
  const h2 = heads(2);
  const h3 = heads(3);
  const questionRe = /\?\s*$|^(how|what|why|when|where|who|which|can|do|does|is|are|should|will)\b/i;
  const questionHeadings = [...h2, ...h3].filter((h) => questionRe.test(h)).length;

  // First paragraph after the H1: an answer-first opening is what AI answers quote.
  const afterH1 = bodyRaw.split(/<\/h1>/i)[1] ?? '';
  const firstP = squash(afterH1.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '');

  const lists = (bodyRaw.match(/<(ul|ol)\b[^>]*>\s*<li\b/gi) ?? []).length;
  const tables = (bodyRaw.match(/<table\b/gi) ?? []).length;
  const imgs = [...bodyRaw.matchAll(/<img\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const imgNoAlt = imgs.filter((i) => !('alt' in i)).length;

  const anchors = [...bodyRaw.matchAll(/<a\b[^>]*href\s*=\s*["']?([^"'\s>]+)/gi)].map((m) => decode(m[1]));
  let origin = '';
  try {
    origin = new URL(pageUrl).origin;
  } catch {}
  const internal = anchors.filter((h) => h.startsWith('/') || (origin && h.startsWith(origin)));
  const hasAbout = anchors.some((h) => /\/(about|about-us|company|team|who-we-are)(\/|\.html?|$)/i.test(h));
  const hasContact = anchors.some((h) => /\/(contact|contact-us|get-in-touch)(\/|\.html?|$)/i.test(h));
  const mailto = anchors.some((h) => /^mailto:/i.test(h));
  const tel = anchors.some((h) => /^tel:/i.test(h));

  const timeTags = (bodyRaw.match(/<time\b[^>]*datetime=/gi) ?? []).length;
  const updatedText = /\b(updated|last reviewed|last modified)\b[^.]{0,40}\b(20\d\d|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text);
  const metaDates = ['article:modified_time', 'article:published_time', 'og:updated_time'].map(meta).filter(Boolean);

  // A client-rendered app shell: an empty mount point and little text in the HTML.
  const appShell = /<div\b[^>]*id\s*=\s*["'](root|app|__next|__nuxt|svelte|___gatsby)["'][^>]*>\s*<\/div>/i.test(src) || /<app-root\b[^>]*>\s*<\/app-root>/i.test(src);

  return {
    lang,
    title,
    description: meta('description'),
    robotsMeta,
    canonical,
    og: { title: meta('og:title'), description: meta('og:description'), image: meta('og:image') },
    author: meta('author'),
    ld: { blocks: ld.blocks, errors: ld.errors, types: [...ld.types], sameAs: [...ld.sameAs], dates: ld.dates, author: ld.author, contact: ld.contact },
    microdata,
    wordCount,
    h1,
    h2,
    h3,
    questionHeadings,
    firstP,
    firstPWords: words(firstP),
    lists,
    tables,
    images: imgs.length,
    imgNoAlt,
    internalLinks: internal.length,
    hasAbout,
    hasContact,
    mailto,
    tel,
    timeTags,
    updatedText,
    metaDates,
    appShell,
  };
}
