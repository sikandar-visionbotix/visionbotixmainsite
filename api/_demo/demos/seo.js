/**
 * SEO & GEO demo (S7b): Atlas Bike Repair, a fictional workshop in Bristol. The agent audits a sample page (checks run
 * in code), looks at keyword gaps and a sample snapshot of AI-search answers (who gets cited), drafts fixes that the
 * tool validates (title/meta length, FAQ count), and publishes only with approval. Goal: audit + validated fixes approved.
 */
import { str } from './util.js';

const PAGES = {
  '/': {
    title: 'Atlas Bike Repair | Bristol Bicycle Repair, Servicing, E-Bike Repair & Wheel Building Experts Since 2012',
    meta: '',
    h1: ['Welcome to Atlas', 'Our services'],
    words: 310,
    images: 14,
    imagesNoAlt: 9,
    schema: [],
    lcp: 4.2,
    faq: 0,
    nap: 'Address only in an image in the footer',
  },
  '/e-bike-repair/': { title: 'E-bike repair', meta: 'We fix e-bikes.', h1: ['E-bike repair'], words: 140, images: 3, imagesNoAlt: 3, schema: [], lcp: 2.1, faq: 0, nap: 'none' },
};
const KEYWORDS = [
  ['bike repair bristol', 2400, 14],
  ['e-bike repair bristol', 880, 'not ranking'],
  ['bike service near me', 6600, 'not ranking'],
  ['wheel building bristol', 170, 3],
  ['how much is a bike service uk', 1300, 'not ranking'],
];
const AI = [
  { query: 'best bike repair shop in Bristol', engine: 'ChatGPT', cited: ['Two competitors', 'A Reddit thread'], atlas: false },
  { query: 'best bike repair shop in Bristol', engine: 'Perplexity', cited: ['Google Maps reviews of 3 shops', 'Yelp'], atlas: false },
  { query: 'e-bike battery repair Bristol', engine: 'AI Overviews', cited: ['A national chain'], atlas: false },
  { query: 'wheel building Bristol', engine: 'ChatGPT', cited: ['Atlas Bike Repair'], atlas: true },
];

function audit(p) {
  const out = [];
  const t = p.title.length;
  out.push(['Title', `${t} characters`, t > 60 ? 'bad' : t < 30 ? 'warn' : 'ok']);
  out.push(['Meta description', p.meta ? `${p.meta.length} characters` : 'missing', !p.meta ? 'bad' : p.meta.length < 120 ? 'warn' : 'ok']);
  out.push(['H1', `${p.h1.length} on the page`, p.h1.length === 1 ? 'ok' : 'bad']);
  out.push(['Content', `${p.words} words`, p.words < 400 ? 'warn' : 'ok']);
  out.push(['Image alt text', `${p.imagesNoAlt} of ${p.images} missing`, p.imagesNoAlt ? 'warn' : 'ok']);
  out.push(['Schema', p.schema.length ? p.schema.join(', ') : 'none (no LocalBusiness)', p.schema.length ? 'ok' : 'bad']);
  out.push(['LCP (mobile)', `${p.lcp} s`, p.lcp > 2.5 ? 'bad' : 'ok']);
  out.push(['FAQ for AI answers', p.faq ? `${p.faq} questions` : 'none', p.faq ? 'ok' : 'warn']);
  out.push(['Name, address, phone', p.nap, /image|none/.test(p.nap) ? 'warn' : 'ok']);
  return out;
}

export default {
  id: 'seo',
  maxTokens: 700,
  rules: `You are the AI SEO & GEO agent for Atlas Bike Repair, an independent bike workshop in Bristol, UK (services: servicing from £65, e-bike repair, wheel building, same-week repairs; 4.8 stars from 210 Google reviews). The user is the owner.
- Use audit_page, keyword_gaps and ai_visibility for facts; never invent rankings, volumes or AI answers. The AI-visibility data is a sample snapshot: say so.
- Prioritise: what moves rankings and AI citations most for a local business first.
- draft_fix proposes a change (kind: title, meta, faq, schema, alt_text); the tool validates it (title max 60 characters with "Bristol", meta 120–160, FAQ 3–6 questions). Fix and retry if rejected.
- publish_fixes needs the owner's approval. Never claim changes are live before that.
- Short chat replies; let the cards show the detail.`,
  facts(state) {
    return `Pages you can audit: ${Object.keys(PAGES).join(', ')}. Fixes drafted: ${state.fixes.map((f) => f.kind).join(', ') || 'none'}. Published: ${state.published ? 'yes' : 'no'}.`;
  },
  tools: [
    {
      name: 'audit_page',
      description: 'Technical and on-page audit of one page (checks run in code).',
      parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
      run(a, s) {
        const path = str(a.path, 60).replace(/^https?:\/\/[^/]+/, '') || '/';
        const p = PAGES[path.endsWith('/') ? path : `${path}/`] ?? PAGES[path];
        if (!p) return { result: { error: `Pages: ${Object.keys(PAGES).join(', ')}` }, error: true, label: 'Audit', detail: 'Unknown page' };
        const rows = audit(p);
        if (!s.audited.includes(path)) s.audited.push(path);
        return { result: { page: path, title: p.title, checks: rows.map(([k, v, st]) => `${k}: ${v} (${st})`) }, label: 'Page audited', detail: `${path} · ${rows.filter((r) => r[2] === 'bad').length} errors, ${rows.filter((r) => r[2] === 'warn').length} warnings`, cards: [{ type: 'kv', title: `Audit ${path}`, rows }] };
      },
    },
    {
      name: 'keyword_gaps',
      description: 'Target keywords with monthly UK searches and the current Google position.',
      parameters: { type: 'object', properties: {} },
      run(_, s) {
        s.keywords = true;
        return { result: KEYWORDS.map(([k, v, pos]) => ({ keyword: k, monthly_searches: v, position: pos })), label: 'Keyword gaps', detail: '3 of 5 targets not ranking', cards: [{ type: 'table', title: 'Keywords (sample data)', columns: ['Keyword', 'Searches/mo', 'Position'], rows: KEYWORDS }] };
      },
    },
    {
      name: 'ai_visibility',
      description: 'Sample snapshot: is Atlas cited when people ask AI assistants about bike repair in Bristol?',
      parameters: { type: 'object', properties: {} },
      run(_, s) {
        s.ai = true;
        return { result: { note: 'sample snapshot, not live', answers: AI }, label: 'AI citations checked', detail: `Cited in ${AI.filter((x) => x.atlas).length} of ${AI.length} AI answers`, cards: [{ type: 'table', title: 'AI answers (sample snapshot)', columns: ['Question', 'Engine', 'Atlas cited?'], rows: AI.map((x) => [x.query, x.engine, x.atlas ? 'yes' : 'no']) }] };
      },
    },
    {
      name: 'draft_fix',
      description: 'Drafts one change for a page; validated before it is saved.',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string' }, kind: { type: 'string', enum: ['title', 'meta', 'faq', 'schema', 'alt_text'] }, content: { type: 'string', description: 'For faq: one "Q: … A: …" per line' } },
        required: ['path', 'kind', 'content'],
      },
      run(a, s) {
        const kind = a.kind;
        const c = str(a.content, 2500);
        const problems = [];
        if (kind === 'title' && (c.length > 60 || !/bristol/i.test(c))) problems.push(`title must be ≤ 60 characters and include "Bristol" (got ${c.length})`);
        if (kind === 'meta' && (c.length < 120 || c.length > 160)) problems.push(`meta must be 120–160 characters (got ${c.length})`);
        if (kind === 'faq') {
          const n = (c.match(/(^|\n)\s*Q:/g) ?? []).length;
          if (n < 3 || n > 6) problems.push(`FAQ needs 3–6 questions (got ${n})`);
        }
        if (/guarantee|#1|best in (the )?uk|cheapest/i.test(c)) problems.push('unprovable claim');
        if (problems.length) return { result: { error: problems.join('; ') }, error: true, label: 'Fix rejected', detail: problems.join(' · ') };
        s.fixes = s.fixes.filter((f) => !(f.kind === kind && f.path === str(a.path, 60)));
        s.fixes.push({ path: str(a.path, 60) || '/', kind, content: c });
        return { result: { saved: true, chars: c.length }, label: `Fix drafted: ${kind}`, detail: `${str(a.path, 60) || '/'} · ${c.length} chars · checks passed`, cards: [{ type: 'draft', title: `${kind} · ${str(a.path, 60) || '/'}`, meta: [`${c.length} characters · checks passed`], body: c }] };
      },
    },
    {
      name: 'publish_fixes',
      description: 'Publishes the drafted fixes to the site. Needs the owner\u2019s approval.',
      parameters: { type: 'object', properties: {} },
      run(_, s) {
        if (!s.fixes.length) return { result: { error: 'Draft fixes first' }, error: true, label: 'Not published', detail: 'No fixes' };
        if (s.published) return { result: { already_published: true }, label: 'Already published', detail: `${s.fixes.length} fixes` };
        return { result: { status: 'waiting_for_owner_approval' }, gate: { title: `Publish ${s.fixes.length} SEO fixes`, detail: s.fixes.map((f) => `${f.path} ${f.kind}: ${f.content.slice(0, 80)}${f.content.length > 80 ? '…' : ''}`).join('\n') } };
      },
    },
  ],
  init: () => ({ audited: [], fixes: [], published: false, keywords: false, ai: false }),
  async approve(_, s) {
    s.published = true;
    return { note: 'The owner approved: the fixes are live and the pages were resubmitted for indexing. Confirm briefly and say re-checking AI citations in 2–4 weeks is next.', step: { label: 'Fixes published', detail: `${s.fixes.length} changes · pages resubmitted to Google and Bing` } };
  },
  decline() {
    return { note: 'The owner declined publishing for now. Ask what to change.' };
  },
  complete: (s) => s.published || (s.audited.length > 0 && s.fixes.length >= 2),
  doneText: (s) => (s.published ? `Audit done, ${s.fixes.length} validated fixes approved and published` : 'Page audited and validated fixes drafted'),
  board(s) {
    return [
      { title: 'Progress', items: [{ label: 'Pages audited', value: s.audited.join(', ') || 'none', status: s.audited.length ? 'ok' : 'info' }, { label: 'Keyword gaps', value: s.keywords ? 'checked' : 'not yet', status: s.keywords ? 'ok' : 'info' }, { label: 'AI citations', value: s.ai ? 'cited in 1 of 4 (sample)' : 'not yet', status: s.ai ? 'warn' : 'info' }] },
      { title: 'Fixes', items: s.fixes.length ? s.fixes.map((f) => ({ label: `${f.path} · ${f.kind}`, value: s.published ? 'live' : 'drafted', status: s.published ? 'ok' : 'info' })) : [{ label: 'None yet', value: '' }] },
    ];
  },
};
