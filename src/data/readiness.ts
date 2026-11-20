/**
 * AI readiness score (S12, D78): the model behind /tools/ai-readiness-score/. Pure data and functions, shared by the
 * page (static explanation tables), its client script (the live quiz) and scripts/check-readiness.mjs (tests).
 *
 * - Nine scored questions in five dimensions; each answer is worth 0–3 points. A dimension's score is its share of
 *   the possible points; the total is the weighted sum (weights add up to 100).
 * - Four context questions (sector, team size, where time leaks, sensitive data) are not scored: they choose the
 *   recommended agents, a bundle when one fits, and the notes.
 * - Everything runs in the browser. Answers travel only in the share link (?r=…) unless the visitor presses Send.
 * Prices are never typed here: the page reads them from pricing.ts.
 */

export type Dim = 'process' | 'knowledge' | 'systems' | 'payoff' | 'people';

export const dims: Record<Dim, { label: string; weight: number; what: string; fix: string; strong: string }> = {
  process: {
    label: 'Clear processes',
    weight: 25,
    what: 'An agent follows rules. Tasks that are done the same way every time, with known exceptions, are the ones it can take over.',
    fix: 'Pick the one task you most want to hand over and write it as a checklist: the steps, the rules, and the moments a person must step in. It takes an afternoon, and it becomes the agent’s instructions.',
    strong: 'Your tasks are written down, so an agent can follow the same rules your team does.',
  },
  knowledge: {
    label: 'Knowledge and records',
    weight: 20,
    what: 'An agent answers from your facts and works on your records. If answers live in people’s heads, it has nothing to read.',
    fix: 'Write down the 30 questions customers ask most, with the answers, and check that the prices and policies on your website are current. That document becomes what the agent answers from.',
    strong: 'Your answers and records are in one place the agent can read, so it can answer from your facts.',
  },
  systems: {
    label: 'Connected tools',
    weight: 20,
    what: 'An agent is only useful if it can act: book in your calendar, update the CRM, check an order. That needs tools it can connect to.',
    fix: 'List the tools the task touches (calendar, CRM, inbox, store, practice system) and check whether each has an API or a Zapier or Make integration. If one does not, ask us: email or a shared sheet can often bridge the gap.',
    strong: 'Your tools can talk to other software, so an agent can act in them, not just talk.',
  },
  payoff: {
    label: 'Volume and value',
    weight: 20,
    what: 'AI pays off where there is volume (many calls, messages or documents) or value (each customer is worth a lot).',
    fix: 'At low volume an agent pays off in hours saved and enquiries no longer missed, not in headcount. Start with the cheapest win, such as after-hours calls or review replies, and measure it for a month.',
    strong: 'There is enough volume or value at stake for an agent to pay for itself quickly.',
  },
  people: {
    label: 'Ownership and comfort',
    weight: 15,
    what: 'Agents improve fastest when someone reviews them each week, and they need clear lines on what they may do alone.',
    fix: 'Name one person to review the agent’s conversations for an hour a week in the first month, and decide which actions need a person’s approval (refunds, discounts, anything sensitive).',
    strong: 'Someone owns it and you have clear lines on what AI may do alone: the two things that make agents work in practice.',
  },
};

export interface Option {
  label: string;
}
export interface ScoredQuestion {
  id: string;
  kind: 'scored';
  dim: Dim;
  q: string;
  hint?: string;
  /** Four options worth 0, 1, 2 and 3 points, in that order. */
  options: [Option, Option, Option, Option];
}
export interface ChoiceQuestion {
  id: string;
  kind: 'choice';
  q: string;
  hint?: string;
  options: Option[];
}
export interface MultiQuestion {
  id: string;
  kind: 'multi';
  q: string;
  hint?: string;
  max: number;
  options: (Option & { key: Need })[];
}
export type Question = ScoredQuestion | ChoiceQuestion | MultiQuestion;

export type Sector = 'clinic' | 'home' | 'retail' | 'realestate' | 'professional' | 'b2b' | 'other';
export const sectors: { key: Sector; label: string }[] = [
  { key: 'clinic', label: 'Clinic, dental or healthcare' },
  { key: 'home', label: 'Home services or trades' },
  { key: 'retail', label: 'Online store or retail' },
  { key: 'realestate', label: 'Real estate' },
  { key: 'professional', label: 'Professional services (legal, accounting, agency)' },
  { key: 'b2b', label: 'B2B software or technology' },
  { key: 'other', label: 'Something else' },
];

/** Where time or money leaks today, each mapped to the agent built for it. */
export type Need = 'calls' | 'leads' | 'support' | 'messages' | 'prospecting' | 'content' | 'search' | 'ads' | 'reviews' | 'knowhow' | 'documents' | 'copypaste' | 'reports' | 'product';
export const needAgent: Record<Need, string> = {
  calls: 'ai-receptionist',
  leads: 'ai-booking-agent',
  support: 'ai-customer-support-agent',
  messages: 'whatsapp-ai-agent',
  prospecting: 'ai-sdr-agent',
  content: 'ai-social-media-agent',
  search: 'ai-seo-agent',
  ads: 'ai-ads-agent',
  reviews: 'ai-reputation-agent',
  knowhow: 'ai-knowledge-assistant',
  documents: 'ai-document-processing-agent',
  copypaste: 'ai-workflow-automation-agent',
  reports: 'ai-data-analyst-agent',
  product: 'ai-mvp-development',
};

export const questions: Question[] = [
  {
    id: 'sector',
    kind: 'choice',
    q: 'What kind of business are you?',
    hint: 'Used to suggest the agents businesses like yours start with.',
    options: sectors.map((s) => ({ label: s.label })),
  },
  {
    id: 'size',
    kind: 'choice',
    q: 'How many people work in the business?',
    options: [{ label: '1 to 10' }, { label: '11 to 50' }, { label: '51 to 200' }, { label: 'More than 200' }],
  },
  {
    id: 'needs',
    kind: 'multi',
    q: 'Where do you lose the most time or money today?',
    hint: 'Pick up to three.',
    max: 3,
    options: [
      { key: 'calls', label: 'Calls go to voicemail after hours or when we are busy' },
      { key: 'leads', label: 'New leads wait hours for a reply' },
      { key: 'support', label: 'The same customer questions, every day' },
      { key: 'messages', label: 'WhatsApp and social messages pile up' },
      { key: 'prospecting', label: 'We need more meetings with new accounts' },
      { key: 'content', label: 'Social posts and content fall behind' },
      { key: 'search', label: 'We do not show up on Google or in AI answers' },
      { key: 'ads', label: 'Ad spend is hard to keep an eye on' },
      { key: 'reviews', label: 'Too few reviews, or replies take too long' },
      { key: 'knowhow', label: 'Staff keep asking where things are or how things are done' },
      { key: 'documents', label: 'Typing data out of invoices, forms or contracts' },
      { key: 'copypaste', label: 'Copying data between email, CRM, sheets and other tools' },
      { key: 'reports', label: 'Waiting for someone to pull numbers and reports' },
      { key: 'product', label: 'We want to build AI into our own product' },
    ],
  },
  {
    id: 'p1',
    kind: 'scored',
    dim: 'process',
    q: 'How are everyday tasks done, such as answering enquiries, booking or processing orders?',
    options: [{ label: 'Everyone does it their own way' }, { label: 'Roughly the same way, but it lives in people’s heads' }, { label: 'Written down for the main tasks' }, { label: 'Written down and measured (scripts, checklists, response times)' }],
  },
  {
    id: 'p2',
    kind: 'scored',
    dim: 'process',
    q: 'For the task you most want to hand to AI, could you write down the rules?',
    hint: 'For example: when to book, when to refund, when to pass it to a person.',
    options: [{ label: 'No, it is a judgment call every time' }, { label: 'Some of them' }, { label: 'Most of them, and we know the exceptions' }, { label: 'Yes, including who approves the exceptions' }],
  },
  {
    id: 'k1',
    kind: 'scored',
    dim: 'knowledge',
    q: 'Where do the answers to customer questions live (prices, policies, services)?',
    options: [{ label: 'In a few people’s heads' }, { label: 'Scattered across documents and old emails' }, { label: 'On our website, mostly up to date' }, { label: 'In a help center or document we keep up to date' }],
  },
  {
    id: 'k2',
    kind: 'scored',
    dim: 'knowledge',
    q: 'Where are customer, order or job records kept?',
    options: [{ label: 'On paper, or in each person’s own notes' }, { label: 'In shared spreadsheets' }, { label: 'In a CRM, booking or practice system, most of the time' }, { label: 'In one system everyone uses, kept clean' }],
  },
  {
    id: 's1',
    kind: 'scored',
    dim: 'systems',
    q: 'Can your main tools connect to other software?',
    hint: 'Your calendar, CRM, inbox, online store or practice system.',
    options: [{ label: 'Not sure' }, { label: 'A few have integrations' }, { label: 'Most do (APIs, Zapier, Make or webhooks)' }, { label: 'Yes, and we already automate between them' }],
  },
  {
    id: 'v1',
    kind: 'scored',
    dim: 'payoff',
    q: 'How many calls, messages, leads or documents does the team handle in a week?',
    options: [{ label: 'Fewer than 20' }, { label: '20 to 100' }, { label: '100 to 500' }, { label: 'More than 500' }],
  },
  {
    id: 'v2',
    kind: 'scored',
    dim: 'payoff',
    q: 'What is a new customer worth to you in their first year?',
    options: [{ label: 'Under $200' }, { label: '$200 to $1,000' }, { label: '$1,000 to $10,000' }, { label: 'More than $10,000' }],
  },
  {
    id: 'o1',
    kind: 'scored',
    dim: 'people',
    q: 'Who would look after an AI agent day to day?',
    options: [{ label: 'Nobody has the time' }, { label: 'The owner, when there is time' }, { label: 'A named manager' }, { label: 'A named person with an hour or two each week to review it' }],
  },
  {
    id: 'o2',
    kind: 'scored',
    dim: 'people',
    q: 'How comfortable are you with AI talking to your customers?',
    options: [{ label: 'Not comfortable yet' }, { label: 'Only for work behind the scenes' }, { label: 'Fine for routine questions, with a hand-off to a person' }, { label: 'Fine, with a person approving anything about money or sensitive cases' }],
  },
  {
    id: 'data',
    kind: 'choice',
    q: 'Does the work involve sensitive data?',
    options: [{ label: 'No, mostly public or business information' }, { label: 'Some personal data, such as names and phone numbers' }, { label: 'Yes: health, financial or identity data' }],
  },
];

export const scored = questions.filter((q): q is ScoredQuestion => q.kind === 'scored');

/** One answer per question: an option index, or for the multi question a list of indexes. */
export type Answers = Record<string, number | number[]>;

export const bands = [
  { min: 0, key: 'groundwork', label: 'Groundwork first', line: 'AI can help, but a little preparation will make the first agent work far better. Start with one process, not a platform.' },
  { min: 40, key: 'first', label: 'Ready for a first agent', line: 'You have what a first agent needs. Put it on the task where you lose the most, and measure it for a month.' },
  { min: 70, key: 'scale', label: 'Ready to scale', line: 'Your processes, records and tools are in good shape. You can run several agents together, or connect AI to your own systems.' },
] as const;
export type Band = (typeof bands)[number];

export function bandFor(score: number): Band {
  return [...bands].reverse().find((b) => score >= b.min)!;
}

/** Each dimension as a share from 0 to 1 (only answered questions count; unanswered = 0 points). */
export function dimScores(a: Answers): Record<Dim, number> {
  const out = {} as Record<Dim, number>;
  for (const d of Object.keys(dims) as Dim[]) {
    const qs = scored.filter((q) => q.dim === d);
    const pts = qs.reduce((s, q) => s + (typeof a[q.id] === 'number' ? (a[q.id] as number) : 0), 0);
    out[d] = pts / (qs.length * 3);
  }
  return out;
}

export function totalScore(a: Answers): number {
  const ds = dimScores(a);
  return Math.round((Object.keys(dims) as Dim[]).reduce((s, d) => s + dims[d].weight * ds[d], 0));
}

/** The agents businesses in each sector most often start with (used to fill the list when few needs are picked). */
export const sectorAgents: Record<Sector, string[]> = {
  clinic: ['ai-receptionist', 'ai-booking-agent', 'ai-reputation-agent'],
  home: ['ai-receptionist', 'ai-booking-agent', 'ai-reputation-agent'],
  retail: ['ai-customer-support-agent', 'whatsapp-ai-agent', 'ai-reputation-agent'],
  realestate: ['ai-booking-agent', 'whatsapp-ai-agent', 'ai-sdr-agent'],
  professional: ['ai-receptionist', 'ai-knowledge-assistant', 'ai-document-processing-agent'],
  b2b: ['ai-sdr-agent', 'ai-seo-agent', 'ai-knowledge-assistant'],
  other: ['ai-customer-support-agent', 'ai-workflow-automation-agent', 'ai-knowledge-assistant'],
};

/** Sector → the bundle built for it (pricing.ts `bundles` slug). */
export const sectorBundle: Partial<Record<Sector, string>> = {
  clinic: 'clinic-front-desk',
  retail: 'ecommerce-support-desk',
  realestate: 'real-estate-lead-desk',
};

/**
 * What each agent leans on most. When that dimension is under half, the result says what setup covers and what to
 * prepare. Agents not listed work from a short brief (receptionist, reputation, social …).
 */
export const agentNeeds: Record<string, { dim: Dim; note: string }> = {
  'ai-receptionist': { dim: 'knowledge', note: 'Setup includes writing up your services, prices and booking rules with you: bring your price list and calendar access.' },
  'ai-customer-support-agent': { dim: 'knowledge', note: 'It answers from your help content. If that is thin, setup starts by writing the top questions and answers with you.' },
  'whatsapp-ai-agent': { dim: 'knowledge', note: 'It answers from your product and policy facts. Have your catalogue and delivery and return rules ready.' },
  'ai-booking-agent': { dim: 'systems', note: 'It books into your calendar or CRM. A shared calendar is enough to start.' },
  'ai-sdr-agent': { dim: 'knowledge', note: 'It needs a clear picture of your ideal customer and a CRM to log into. Setup includes writing that profile with you.' },
  'ai-knowledge-assistant': { dim: 'knowledge', note: 'It answers from your documents, so it is only as good as they are. Start with the documents your team uses most.' },
  'ai-document-processing-agent': { dim: 'process', note: 'It needs the rules for each document type (what to extract, what to check). Setup starts from 20 to 50 sample documents.' },
  'ai-workflow-automation-agent': { dim: 'systems', note: 'It moves data between your tools, so each one needs an API or an integration. We check that before we quote.' },
  'ai-data-analyst-agent': { dim: 'knowledge', note: 'It queries your database or spreadsheets. Clean, consistent records matter more than volume.' },
  'ai-ads-agent': { dim: 'people', note: 'It changes spend only behind approval gates, so someone needs to approve its proposals each week.' },
};

export interface Recommendation {
  slug: string;
  /** Why it is on the list. */
  reason: 'need' | 'sector';
  /** Set when the dimension the agent leans on is under half. */
  prep?: string;
}

/** Up to three agents: the needs picked (sector starters first, then list order), then the sector's usual starters. */
export function recommend(a: Answers): Recommendation[] {
  const needsQ = questions.find((q): q is MultiQuestion => q.kind === 'multi')!;
  const picked = (Array.isArray(a.needs) ? a.needs : []).map((i) => needsQ.options[i]?.key).filter((k): k is Need => !!k);
  const sector = sectors[typeof a.sector === 'number' ? a.sector : sectors.length - 1]?.key ?? 'other';
  const ds = dimScores(a);
  const out: Recommendation[] = [];
  const add = (slug: string, reason: Recommendation['reason']) => {
    if (out.length >= 3 || out.some((r) => r.slug === slug)) return;
    const need = agentNeeds[slug];
    out.push({ slug, reason, ...(need && ds[need.dim] < 0.5 ? { prep: need.note } : {}) });
  };
  // Needs that are a usual first agent in the sector lead ("Start here"); the rest keep the list order.
  const rank = (k: Need) => {
    const i = sectorAgents[sector].indexOf(needAgent[k]);
    return i < 0 ? 99 : i;
  };
  const order = (k: Need) => needsQ.options.findIndex((o) => o.key === k);
  [...picked].sort((x, y) => rank(x) - rank(y) || order(x) - order(y)).forEach((k) => add(needAgent[k], 'need'));
  if (out.length < 2) sectorAgents[sector].forEach((s) => add(s, 'sector'));
  return out;
}

/** The sector's bundle when at least two recommended agents are in it. */
export function bundleFor(a: Answers, bundles: { slug: string; agents: string[] }[]): string | null {
  const sector = sectors[typeof a.sector === 'number' ? a.sector : -1]?.key;
  const slug = sector ? sectorBundle[sector] : undefined;
  const b = bundles.find((x) => x.slug === slug);
  if (!b) return null;
  const recs = recommend(a).map((r) => r.slug);
  return b.agents.filter((s) => recs.includes(s)).length >= 2 ? b.slug : null;
}

/** The two weakest dimensions under 67% (what to work on first), weakest first; ties go to the heavier weight. */
export function weakest(a: Answers): Dim[] {
  const ds = dimScores(a);
  return (Object.keys(dims) as Dim[])
    .filter((d) => ds[d] < 0.67)
    .sort((x, y) => ds[x] - ds[y] || dims[y].weight - dims[x].weight)
    .slice(0, 2);
}

export const isComplete = (a: Answers) => questions.every((q) => (q.kind === 'multi' ? Array.isArray(a[q.id]) : typeof a[q.id] === 'number'));

/**
 * Share link code: one base-36 character per question in order ('-' = unanswered); the multi question is a bitmask
 * in base 36, wrapped in brackets. E.g. "2.[1c].1.2.3…" without the dots.
 */
export function encode(a: Answers): string {
  return questions
    .map((q) => {
      const v = a[q.id];
      if (q.kind === 'multi') return `[${Array.isArray(v) ? v.reduce((m, i) => m | (1 << i), 0).toString(36) : ''}]`;
      return typeof v === 'number' ? v.toString(36) : '-';
    })
    .join('');
}

export function decode(code: string): Answers | null {
  if (!/^[0-9a-z\-[\]]{1,40}$/.test(code)) return null;
  const a: Answers = {};
  let i = 0;
  for (const q of questions) {
    if (q.kind === 'multi') {
      const end = code.indexOf(']', i);
      if (code[i] !== '[' || end < 0) return null;
      const mask = parseInt(code.slice(i + 1, end) || '0', 36);
      if (Number.isNaN(mask)) return null;
      const picks = q.options.map((_, j) => j).filter((j) => mask & (1 << j));
      if (picks.length > q.max) return null;
      a[q.id] = picks;
      i = end + 1;
    } else {
      const c = code[i++];
      if (c === undefined) return null;
      if (c === '-') continue;
      const n = parseInt(c, 36);
      if (!(n >= 0 && n < q.options.length)) return null;
      a[q.id] = n;
    }
  }
  return i === code.length ? a : null;
}
