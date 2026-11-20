/**
 * Builds the AI visibility report for one URL (S11). Fetches the page, then robots.txt, the sitemap and llms.txt on
 * the final origin, and scores three groups of checks. Every check returns what we saw, why it matters and the fix.
 * Status: pass = 1, warn = 0.5, fail = 0; "info" checks are shown but not scored.
 */
import { safeGet, FetchError } from './fetch.js';
import { parseRobots, rulesFor, isAllowed } from './robots.js';
import { analyse } from './html.js';
import { BOTS } from './bots.js';

const VAL = { pass: 1, warn: 0.5, fail: 0 };
const ENTITY_RE = /Organization|Business|Corporation|ProfessionalService|Store|Restaurant|Dentist|Physician|Clinic|Hospital|MedicalOrganization|LegalService|Attorney|Hotel|Agency|School|College|University|NGO|Person|Brand|Service$/;

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

async function optional(url, opts) {
  try {
    return await safeGet(url, opts);
  } catch (e) {
    return { error: e instanceof FetchError ? e.code : 'unreachable' };
  }
}

export async function buildReport(input) {
  const page = await safeGet(input);
  const ctype = String(page.headers['content-type'] || '');
  if ([401, 403, 429].includes(page.status) || (page.status === 503 && /cloudflare|captcha|challenge/i.test(page.body.slice(0, 5000)))) {
    throw new FetchError('refused', `The site refused our checker (HTTP ${page.status}). Its firewall or bot protection may refuse AI crawlers in the same way: check that your CDN or firewall lets AI search crawlers through.`);
  }
  if (page.status >= 400) throw new FetchError(`http_${page.status}`, `The page answered with HTTP ${page.status}.`);
  if (page.status !== 200) throw new FetchError('unreachable', `The page answered with HTTP ${page.status}.`);
  if (ctype && !/html|xml/i.test(ctype)) throw new FetchError('not_html', 'That address is not a web page (HTML).');

  const final = new URL(page.url);
  const origin = final.origin;
  const [robotsRes, llmsRes] = await Promise.all([
    optional(`${origin}/robots.txt`, { maxBytes: 300_000, accept: 'text/plain,*/*;q=0.5', timeout: 6000 }),
    optional(`${origin}/llms.txt`, { maxBytes: 60_000, accept: 'text/plain,text/markdown,*/*;q=0.5', timeout: 5000 }),
  ]);

  // ---------- robots.txt ----------
  let robots = { state: 'none', parsed: { groups: [], sitemaps: [] } };
  if (robotsRes.error) robots = { state: 'unreachable', parsed: { groups: [], sitemaps: [] } };
  else if (robotsRes.status >= 500) robots = { state: 'error', parsed: { groups: [], sitemaps: [] } };
  else if (robotsRes.status === 200 && !/<html[\s>]/i.test(robotsRes.body.slice(0, 2000))) robots = { state: 'ok', parsed: parseRobots(robotsRes.body) };

  const path = final.pathname + final.search;
  const bots = BOTS.map((b) => {
    if (robots.state === 'error' || robots.state === 'unreachable') return { ...b, allowed: null, rule: robots.state === 'error' ? 'robots.txt returned a server error' : 'robots.txt did not answer' };
    const { group, rules } = rulesFor(robots.parsed, b.token);
    const r = isAllowed(rules, path);
    return { ...b, allowed: r.allowed, group, rule: r.rule ?? (group ? `No rule blocks this page (group "${group}")` : 'No rules for this crawler') };
  });

  // ---------- sitemap ----------
  const sitemapUrl = robots.parsed.sitemaps[0] ?? `${origin}/sitemap.xml`;
  const smRes = await optional(sitemapUrl, { maxBytes: 200_000, accept: 'application/xml,text/xml,*/*;q=0.5', timeout: 5000 });
  const sitemapOk = !smRes.error && smRes.status === 200 && /<(urlset|sitemapindex)\b/i.test(smRes.body);

  const llmsOk = !llmsRes.error && llmsRes.status === 200 && !/<html[\s>]/i.test(llmsRes.body.slice(0, 2000)) && llmsRes.body.trim().length > 20;

  // ---------- page ----------
  const a = analyse(page.body, page.url);
  const xRobots = String(page.headers['x-robots-tag'] || '').toLowerCase();
  const directives = [...a.robotsMeta, xRobots && `x-robots-tag: ${xRobots}`].filter(Boolean).join(' · ');
  const noindex = /noindex|\bnone\b/.test(directives);
  const nosnippet = /nosnippet|max-snippet\s*:\s*0\b/.test(directives);

  const searchBots = bots.filter((b) => b.kind !== 'training');
  const blockedSearch = searchBots.filter((b) => b.allowed === false);
  const blockedTraining = bots.filter((b) => b.kind === 'training' && b.allowed === false);

  /** @type {{ id: string, group: string, label: string, status: 'pass'|'warn'|'fail'|'info', value: string, why: string, fix?: string, weight: number }[]} */
  const checks = [];
  const add = (c) => checks.push(c);

  // ===== Group 1: can AI crawlers reach the page? =====
  add({
    id: 'https', group: 'access', weight: 2, label: 'Served over HTTPS',
    status: final.protocol === 'https:' ? 'pass' : 'fail',
    value: final.protocol === 'https:' ? 'Yes' : 'No, the page is plain HTTP',
    why: 'Search engines and AI assistants prefer secure pages, and browsers warn visitors about HTTP.',
    fix: 'Serve the site over HTTPS and redirect HTTP to HTTPS.',
  });
  add({
    id: 'ai-search-bots', group: 'access', weight: 6, label: 'AI search crawlers allowed in robots.txt',
    status: robots.state === 'error' || robots.state === 'unreachable' ? 'warn' : blockedSearch.length === 0 ? 'pass' : blockedSearch.some((b) => b.core) ? 'fail' : 'warn',
    value:
      robots.state === 'error' ? 'robots.txt returned a server error, so careful crawlers treat the whole site as blocked'
      : robots.state === 'unreachable' ? 'robots.txt did not answer'
      : blockedSearch.length === 0 ? `All ${searchBots.length} search and assistant crawlers we check may read this page`
      : `Blocked: ${blockedSearch.map((b) => b.token).join(', ')}`,
    why: 'These crawlers fetch pages so ChatGPT, Claude, Perplexity, Google and Bing can quote and link them in answers. If they are blocked, you cannot be cited.',
    fix: blockedSearch.length ? `Remove the Disallow rules for ${blockedSearch.map((b) => b.token).join(', ')} in robots.txt (you can still block training crawlers separately).` : 'Make robots.txt answer quickly with HTTP 200 (or 404 if you have none).',
  });
  add({
    id: 'training-bots', group: 'access', weight: 0, label: 'AI training crawlers',
    status: 'info',
    value: blockedTraining.length ? `You block ${blockedTraining.map((b) => b.token).join(', ')}` : 'Not blocked',
    why: 'Blocking training crawlers (GPTBot, ClaudeBot, Google-Extended and others) is a business choice. OpenAI, Anthropic and Google document them separately from their search crawlers, so blocking them does not remove you from AI search answers.',
  });
  add({
    id: 'indexing', group: 'access', weight: 6, label: 'Page may be indexed and quoted',
    status: noindex ? 'fail' : nosnippet ? 'fail' : 'pass',
    value: noindex ? `noindex found (${directives})` : nosnippet ? `Snippets are switched off (${directives})` : directives ? `Directives: ${directives}` : 'No blocking directives',
    why: noindex ? 'A noindex page is dropped from Google and Bing, and AI answers built on them will not cite it.' : 'Google says nosnippet keeps a page out of AI Overviews and AI Mode as a direct input, and max-snippet limits how much of it they may use. Apple uses nosnippet as the opt-out from Siri’s AI answers.',
    fix: noindex ? 'Remove noindex from the robots meta tag or X-Robots-Tag header on pages you want found.' : 'Remove nosnippet / max-snippet:0, or use data-nosnippet only on the parts you want kept out of answers.',
  });
  // Bing / Copilot: NOARCHIVE keeps a page out of Bing's chat answers, NOCACHE limits them to URL, title and snippet
  // (Bing, Sept 2023). From 1 Feb 2027 Bing reads ai-grounding / ai-training preferences instead (Bing, 30 Oct 2026).
  const noarchive = /noarchive/.test(directives);
  const nocache = /nocache/.test(directives);
  const grounding = /ai-grounding\s*:\s*disallow/.test(directives);
  add({
    id: 'copilot', group: 'access', weight: 2, label: 'Bing and Copilot may use the page',
    status: noarchive || grounding ? 'fail' : nocache ? 'warn' : 'pass',
    value: noarchive ? 'noarchive found: Bing leaves the page out of its AI chat answers' : grounding ? 'ai-grounding:disallow found' : nocache ? 'nocache found: AI answers may show only the link, title and snippet' : 'No Bing AI restrictions',
    why: 'Microsoft Copilot answers draw on Bing. Bing reads noarchive and nocache as limits on AI answers today, and an ai-grounding preference from February 2027.',
    fix: 'Remove noarchive / nocache (or ai-grounding:disallow) from the robots meta tag or X-Robots-Tag header if you want to be cited in Bing and Copilot answers.',
  });
  add({
    id: 'speed', group: 'access', weight: 1, label: 'Server response time',
    status: page.ms <= 1500 ? 'pass' : page.ms <= 4000 ? 'warn' : 'fail',
    value: `${page.ms < 1000 ? `${page.ms} ms` : `${(page.ms / 1000).toFixed(1)} s`} to download the HTML${page.redirects.length ? ` (${plural(page.redirects.length, 'redirect')})` : ''}`,
    why: 'AI assistants that fetch pages while answering work under tight time limits; slow pages get skipped.',
    fix: 'Cache pages at the edge (a CDN), cut redirects, and serve static HTML where you can.',
  });
  add({
    id: 'sitemap', group: 'access', weight: 1, label: 'XML sitemap',
    status: sitemapOk ? 'pass' : 'warn',
    value: sitemapOk ? `Found at ${sitemapUrl.replace(origin, '') || sitemapUrl}` : robots.parsed.sitemaps.length ? 'Listed in robots.txt but could not be read' : 'Not found at /sitemap.xml or in robots.txt',
    why: 'A sitemap helps search engines (and the AI answers built on them) find every page and notice updates quickly.',
    fix: 'Publish /sitemap.xml, list it in robots.txt with a Sitemap: line, and submit it in Google Search Console and Bing Webmaster Tools.',
  });

  // ===== Group 2: can AI read and understand the content? =====
  const thin = a.wordCount < 100;
  add({
    id: 'html-text', group: 'content', weight: 5, label: 'Text in the HTML (without JavaScript)',
    status: a.wordCount >= 300 ? 'pass' : a.wordCount >= 100 ? 'warn' : 'fail',
    value: `${a.wordCount.toLocaleString('en-US')} words before any JavaScript runs${thin && a.appShell ? ', and the page looks like a JavaScript app shell' : ''}`,
    why: 'Vercel’s study of AI crawler traffic (December 2024) found that none of the major AI crawlers it measured run JavaScript; only Google and Apple render pages. Text that appears only after scripts run is invisible to the rest.',
    fix: thin && a.appShell ? 'Render pages on the server or pre-render them (SSR or static generation, e.g. Next.js, Astro, Nuxt) so the HTML contains the content.' : 'Put your key content (what you do, for whom, prices, location, answers to common questions) in the HTML as text.',
  });
  const tl = a.title.length;
  add({
    id: 'title', group: 'content', weight: 2, label: 'Page title',
    status: !tl ? 'fail' : tl < 15 || tl > 70 ? 'warn' : 'pass',
    value: tl ? `“${a.title.slice(0, 90)}${tl > 90 ? '…' : ''}” (${tl} characters)` : 'Missing',
    why: 'The title is the strongest single hint about what the page is about, for search engines and AI alike.',
    fix: 'Write a unique title of 30–60 characters: the main topic first, your brand last.',
  });
  const dl = a.description.length;
  add({
    id: 'description', group: 'content', weight: 1, label: 'Meta description',
    status: !dl ? 'warn' : dl < 50 || dl > 170 ? 'warn' : 'pass',
    value: dl ? `${dl} characters` : 'Missing',
    why: 'Search results and link previews use it as the summary of the page.',
    fix: 'Add a 120–160 character description that states what you offer and for whom.',
  });
  add({
    id: 'h1', group: 'content', weight: 2, label: 'One clear main heading (H1)',
    status: a.h1.length === 1 ? 'pass' : a.h1.length === 0 ? 'fail' : 'warn',
    value: a.h1.length ? `${plural(a.h1.length, 'H1')}: “${a.h1[0].slice(0, 80)}”` : 'No H1 in the HTML',
    why: 'One H1 that names the topic tells machines what the page answers.',
    fix: 'Use exactly one H1 that says what the page is about in plain words.',
  });
  add({
    id: 'structure', group: 'content', weight: 2, label: 'Sections and question headings',
    status: a.h2.length >= 2 && a.questionHeadings >= 1 ? 'pass' : a.h2.length >= 2 || a.questionHeadings >= 1 ? 'warn' : 'fail',
    value: `${plural(a.h2.length, 'H2 section')}, ${plural(a.questionHeadings, 'question heading')}`,
    why: 'AI answers are assembled from passages. Clear sections, with headings phrased as the questions people ask, are easy to find and quote.',
    fix: 'Break the page into H2 sections, and phrase some of them as real customer questions (“How much does … cost?”) with a direct answer below.',
  });
  add({
    id: 'answer-first', group: 'content', weight: 1, label: 'Answer-first opening',
    status: a.firstPWords >= 15 && a.firstPWords <= 90 ? 'pass' : 'warn',
    value: a.firstPWords ? `The first paragraph after the H1 has ${a.firstPWords} words` : 'No paragraph found after the H1',
    why: 'A short paragraph right under the heading that states the answer (what, who, price, where) is the passage AI assistants quote most easily.',
    fix: 'Open with a 40–60 word summary that answers the page’s main question directly.',
  });
  add({
    id: 'lists', group: 'content', weight: 1, label: 'Lists and tables',
    status: a.lists + a.tables > 0 ? 'pass' : 'warn',
    value: `${plural(a.lists, 'list')}, ${plural(a.tables, 'table')}`,
    why: 'Facts in lists and tables (features, prices, steps, comparisons) are easy for machines to extract.',
    fix: 'Present prices, features, steps and comparisons as HTML lists or tables, not only as images or prose.',
  });
  add({
    id: 'lang', group: 'content', weight: 1, label: 'Language declared',
    status: a.lang ? 'pass' : 'warn',
    value: a.lang ? `lang="${a.lang}"` : 'No lang attribute on <html>',
    why: 'Tells crawlers which language (and often which market) the page is for.',
    fix: 'Add lang="en" (or your language, e.g. en-GB or ar) to the <html> tag.',
  });
  if (a.images) {
    const share = a.imgNoAlt / a.images;
    add({
      id: 'alt', group: 'content', weight: 1, label: 'Image descriptions (alt text)',
      status: share === 0 ? 'pass' : share <= 0.25 ? 'warn' : 'fail',
      value: `${a.imgNoAlt} of ${plural(a.images, 'image')} without alt text`,
      why: 'Crawlers cannot see images; alt text tells them what an image shows (and helps screen-reader users).',
      fix: 'Add a short alt description to every meaningful image, and alt="" to purely decorative ones.',
    });
  }

  // ===== Group 3: does AI know who you are and trust the page? =====
  add({
    id: 'schema', group: 'trust', weight: 3, label: 'Structured data (schema.org)',
    status: a.ld.blocks && !a.ld.errors ? 'pass' : a.ld.blocks || a.microdata ? 'warn' : 'fail',
    value: a.ld.blocks ? `${plural(a.ld.blocks, 'JSON-LD block')}${a.ld.errors ? ` (${a.ld.errors} with JSON errors)` : ''}: ${a.ld.types.slice(0, 8).join(', ') || 'no types'}` : a.microdata ? 'Microdata only, no JSON-LD' : 'None found',
    why: 'Structured data states facts (who you are, what you sell, prices, FAQs) in a form machines read without guessing.',
    fix: a.ld.errors ? 'Fix the JSON syntax errors in your JSON-LD (test with validator.schema.org).' : 'Add JSON-LD: Organization (or LocalBusiness) on every page, plus Service, Product, FAQPage or Article where they fit.',
  });
  const entity = a.ld.types.some((t) => ENTITY_RE.test(t));
  add({
    id: 'entity', group: 'trust', weight: 2, label: 'Who is behind the site (Organization schema)',
    status: entity ? 'pass' : 'fail',
    value: entity ? `Found: ${a.ld.types.filter((t) => ENTITY_RE.test(t)).slice(0, 4).join(', ')}` : 'No Organization, LocalBusiness or Person entity',
    why: 'AI assistants recommend entities they can identify. Organization data ties your site to your name, logo, location and profiles.',
    fix: 'Add Organization (or a LocalBusiness subtype) JSON-LD with name, url, logo, address, contact and sameAs links.',
  });
  add({
    id: 'sameas', group: 'trust', weight: 1, label: 'Links to your profiles elsewhere (sameAs)',
    status: a.ld.sameAs.length >= 2 ? 'pass' : a.ld.sameAs.length === 1 ? 'warn' : 'fail',
    value: a.ld.sameAs.length ? plural(a.ld.sameAs.length, 'profile') + `: ${a.ld.sameAs.slice(0, 4).map((s) => s.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]).join(', ')}` : 'None',
    why: 'Most AI citations about a business come from third-party sites (directories, reviews, LinkedIn). sameAs links connect those profiles to you.',
    fix: 'List your LinkedIn, Google Business Profile, Crunchbase, Clutch, GitHub or other profiles in the Organization sameAs array.',
  });
  const contactOk = a.mailto || a.tel || a.hasContact || a.ld.contact;
  add({
    id: 'contact', group: 'trust', weight: 1, label: 'Contact and about pages linked',
    status: contactOk && a.hasAbout ? 'pass' : contactOk || a.hasAbout ? 'warn' : 'fail',
    value: [a.hasAbout ? 'About page linked' : 'No about page link', contactOk ? 'contact details or page linked' : 'no contact details or page'].join(', '),
    why: 'Real contact details and an about page are trust signals for people, search quality raters and AI systems.',
    fix: 'Link an About page and a Contact page (with address, email and phone) from every page, for example in the footer.',
  });
  const dated = a.ld.dates.length + a.metaDates.length + a.timeTags > 0 || a.updatedText;
  add({
    id: 'freshness', group: 'trust', weight: 1, label: 'Dates and freshness',
    status: dated ? 'pass' : 'warn',
    value: dated ? [a.ld.dates.length && 'dates in schema', a.metaDates.length && 'dates in meta tags', a.timeTags && '<time> tags', a.updatedText && '“Updated” text'].filter(Boolean).join(', ') : 'No published or updated date found',
    why: 'AI assistants favour current information. A visible “Updated” date and dateModified in schema show the page is maintained.',
    fix: 'Show an “Updated <date>” line on guides and key pages, and add datePublished / dateModified to their schema.',
  });
  let canonicalNote = 'Missing';
  let canonicalStatus = 'warn';
  if (a.canonical) {
    try {
      const c = new URL(a.canonical, page.url);
      canonicalNote = c.href === page.url ? 'Points to this page' : `Points to ${c.href.slice(0, 100)}`;
      canonicalStatus = c.origin === origin ? 'pass' : 'warn';
    } catch {
      canonicalNote = 'Invalid URL';
    }
  }
  add({
    id: 'canonical', group: 'trust', weight: 1, label: 'Canonical URL',
    status: canonicalStatus,
    value: canonicalNote,
    why: 'A canonical link tells search engines which address is the real one, so signals are not split between duplicates.',
    fix: 'Add <link rel="canonical" href="…"> with the page’s own preferred URL.',
  });
  const og = [a.og.title, a.og.description, a.og.image].filter(Boolean).length;
  add({
    id: 'og', group: 'trust', weight: 1, label: 'Link previews (Open Graph)',
    status: og === 3 ? 'pass' : og ? 'warn' : 'fail',
    value: og === 3 ? 'og:title, og:description and og:image set' : og ? `${og} of 3 set (title, description, image)` : 'None',
    why: 'When people share your page in chats, on LinkedIn or in AI tools, these tags control the preview card.',
    fix: 'Add og:title, og:description and an og:image (1200×630) to every page.',
  });
  add({
    id: 'llms', group: 'trust', weight: 0, label: 'llms.txt',
    status: 'info',
    value: llmsOk ? 'Found at /llms.txt' : 'Not found',
    why: 'A proposed file that summarises a site for language models. It is harmless, but no major AI provider says its crawlers read it (Google says no special AI files are needed), so it does not count towards the score.',
  });

  // ---------- score ----------
  const groups = [
    { id: 'access', title: 'Can AI crawlers reach the page?' },
    { id: 'content', title: 'Can AI read and understand it?' },
    { id: 'trust', title: 'Does AI know who you are?' },
  ].map((g) => {
    const cs = checks.filter((c) => c.group === g.id);
    const scored = cs.filter((c) => c.status !== 'info' && c.weight > 0);
    const w = scored.reduce((s, c) => s + c.weight, 0);
    const got = scored.reduce((s, c) => s + c.weight * VAL[c.status], 0);
    return { ...g, score: w ? Math.round((got / w) * 100) : 100, checks: cs };
  });
  const scored = checks.filter((c) => c.status !== 'info' && c.weight > 0);
  const total = scored.reduce((s, c) => s + c.weight, 0);
  let score = Math.round((scored.reduce((s, c) => s + c.weight * VAL[c.status], 0) / total) * 100);
  // Blockers cap the score: a page AI cannot reach or may not quote is not "good" whatever else it does.
  const blocker = checks.find((c) => (c.id === 'indexing' || c.id === 'ai-search-bots') && c.status === 'fail');
  if (blocker) score = Math.min(score, 39);
  const grade = score >= 85 ? 'Strong' : score >= 65 ? 'Good, with gaps' : score >= 40 ? 'Needs work' : 'Hard for AI to use';

  const fixes = scored
    .filter((c) => c.status !== 'pass' && c.fix)
    .sort((x, y) => y.weight * (1 - VAL[y.status]) - x.weight * (1 - VAL[x.status]))
    .slice(0, 5)
    .map((c) => ({ id: c.id, label: c.label, fix: c.fix, status: c.status }));

  return {
    url: page.url,
    host: final.host,
    checkedAt: new Date().toISOString(),
    score,
    grade,
    blocker: blocker ? blocker.label : null,
    groups,
    bots: bots.map(({ token, vendor, product, kind, allowed, rule }) => ({ token, vendor, product, kind, allowed, rule })),
    robots: robots.state,
    fixes,
    stats: { words: a.wordCount, ms: page.ms, truncated: page.truncated, title: a.title.slice(0, 120) },
  };
}
