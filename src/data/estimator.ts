/**
 * Project cost estimator (S6, D46). Pure functions, no DOM: /estimate/ runs them in the browser, /estimate/ and
 * /pricing/ run them at build time for the "typical costs" table, and scripts/check-estimator.mjs tests them.
 * Every number comes from src/data/pricing.ts (projectFrom, agentPrices, bundles, teamRates, estimatorRates).
 * The result is an indicative range, never a quote: the fixed quote after a call is the binding price.
 */
import { agentPrices, bundles, estimatorRates as R, money, projectFrom, teamRates } from './pricing';
import { agents } from './catalogue';

// ---------------------------------------------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------------------------------------------

export type BuildType = 'ai' | 'web' | 'mobile' | 'saas' | 'software' | 'vision-iot';
export type ProjectType = BuildType | 'agents' | 'team';
export type AiKind = 'chatbot' | 'voice' | 'rag' | 'agent';
export type Feature = 'accounts' | 'payments' | 'admin' | 'realtime' | 'files' | 'reporting' | 'languages' | 'offline' | 'migration';
export type Integrations = keyof typeof R.integrations;
export type AiFeature = 'none' | 'rag' | 'agent';
export type Platform = 'web' | 'ios' | 'android' | 'desktop';
export type Channel = 'webchat' | 'whatsapp' | 'phone' | 'workspace' | 'email';
export type Stage = keyof typeof R.stage;
export type Timeline = 'flexible' | 'standard' | 'rush';
export type Design = 'us' | 'own';

interface TypeOption {
  value: ProjectType;
  label: string;
  line: string;
  icon: string;
  /** "from" price shown on the option card (null = computed differently). */
  from: number | null;
  fromSuffix?: string;
}

const monthlyAgentSlugs = Object.entries(agentPrices)
  .filter(([, p]) => p.monthly)
  .map(([slug]) => slug);
const minAgentSetup = Math.min(...monthlyAgentSlugs.map((s) => agentPrices[s]!.setup));
const minTeam = Math.min(...teamRates.map((r) => r.monthly));

export const typeOptions: TypeOption[] = [
  { value: 'agents', label: 'Ready-made AI agents', line: 'Receptionist, support, WhatsApp, booking and more, set up for you.', icon: 'bot', from: minAgentSetup, fromSuffix: ' + monthly' },
  { value: 'ai', label: 'Custom AI agent or chatbot', line: 'A chatbot, voice agent, document AI or an agent that uses your tools.', icon: 'sparkles', from: projectFrom.customChatbot },
  { value: 'web', label: 'Website or web app', line: 'Customer portals, booking sites, dashboards and internal tools.', icon: 'globe', from: projectFrom.webApp },
  { value: 'mobile', label: 'Mobile app', line: 'iOS and Android from one codebase, through to the app stores.', icon: 'smartphone', from: projectFrom.mobileApp },
  { value: 'saas', label: 'SaaS product (MVP)', line: 'A subscription product with accounts, billing and an admin side.', icon: 'rocket', from: projectFrom.saasMvp },
  { value: 'software', label: 'Custom business software', line: 'Replace spreadsheets or a legacy system with software that fits.', icon: 'layers', from: projectFrom.customSoftware },
  { value: 'vision-iot', label: 'Computer vision or IoT', line: 'Cameras, sensors and devices: a prototype or a pilot.', icon: 'scan-eye', from: projectFrom.visionIot },
  { value: 'team', label: 'Dedicated engineers', line: 'Full-time engineers and designers who join your team.', icon: 'users', from: minTeam, fromSuffix: '/mo' },
];

export const aiKinds: { value: AiKind; label: string; line: string; from: number }[] = [
  { value: 'chatbot', label: 'A chatbot', line: 'Answers questions on your site, WhatsApp or app.', from: projectFrom.customChatbot },
  { value: 'voice', label: 'A voice agent', line: 'Answers and makes phone calls.', from: projectFrom.customVoice },
  { value: 'rag', label: 'AI over your documents', line: 'Search, chat and drafting from your own content, with citations.', from: projectFrom.genAi },
  { value: 'agent', label: 'An agent that takes actions', line: 'Uses your systems: updates records, books, sends, files.', from: projectFrom.customAgent },
];

/** Which project types each feature applies to. */
export const featureOptions: { value: Feature; label: string; types: BuildType[] }[] = [
  { value: 'accounts', label: 'User accounts, login and roles', types: ['web', 'mobile', 'saas', 'software'] },
  { value: 'payments', label: 'Payments or subscriptions', types: ['web', 'mobile', 'saas', 'software'] },
  { value: 'admin', label: 'Admin dashboard', types: ['ai', 'web', 'mobile', 'saas', 'software', 'vision-iot'] },
  { value: 'realtime', label: 'Real-time chat, notifications or live updates', types: ['web', 'mobile', 'saas', 'software', 'vision-iot'] },
  { value: 'files', label: 'File uploads and document handling', types: ['ai', 'web', 'mobile', 'saas', 'software'] },
  { value: 'reporting', label: 'Reports and analytics', types: ['ai', 'web', 'mobile', 'saas', 'software', 'vision-iot'] },
  { value: 'languages', label: 'Several languages or right-to-left text', types: ['ai', 'web', 'mobile', 'saas', 'software'] },
  { value: 'offline', label: 'Works offline', types: ['mobile', 'vision-iot'] },
  { value: 'migration', label: 'Move data from an old system', types: ['web', 'saas', 'software'] },
];

export const integrationOptions: { value: Integrations; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'few', label: '1 to 2' },
  { value: 'some', label: '3 to 5' },
  { value: 'many', label: '6 or more' },
];

export const aiFeatureOptions: { value: AiFeature; label: string }[] = [
  { value: 'none', label: 'No AI' },
  { value: 'rag', label: 'AI search or chat over your content' },
  { value: 'agent', label: 'An AI agent that takes actions' },
];
/** Types that offer "AI inside the product" (the AI type is AI already). */
export const aiFeatureTypes: BuildType[] = ['web', 'mobile', 'saas', 'software'];

export const platformOptions: { value: Platform; label: string }[] = [
  { value: 'web', label: 'Web app (browser)' },
  { value: 'ios', label: 'iOS app' },
  { value: 'android', label: 'Android app' },
  { value: 'desktop', label: 'Desktop app (Windows or macOS)' },
];
export const platformTypes: BuildType[] = ['web', 'mobile', 'saas', 'software'];
export const defaultPlatforms: Record<string, Platform[]> = { web: ['web'], saas: ['web'], software: ['web'], mobile: ['ios', 'android'] };

export const channelOptions: { value: Channel; label: string }[] = [
  { value: 'webchat', label: 'Website chat' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone calls' },
  { value: 'workspace', label: 'Slack or Microsoft Teams' },
  { value: 'email', label: 'Email' },
];

export const stageOptions: { value: Stage; label: string; line: string }[] = [
  { value: 'prototype', label: 'Prototype', line: 'Prove the idea or test with a few users.' },
  { value: 'mvp', label: 'First launch (MVP)', line: 'Real users, the core features done well.' },
  { value: 'production', label: 'Built to scale', line: 'High traffic, audits or many teams from day one.' },
];

export const timelineOptions: { value: Timeline; label: string; line: string }[] = [
  { value: 'flexible', label: 'Flexible', line: 'No fixed date.' },
  { value: 'standard', label: 'Normal pace', line: 'A target date a few months out.' },
  { value: 'rush', label: 'As soon as possible', line: 'A larger team works in parallel.' },
];

export const designOptions: { value: Design; label: string }[] = [
  { value: 'us', label: 'Design it for us' },
  { value: 'own', label: 'We already have designs' },
];

export const roleKeys = teamRates.map((r) => r.role.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
export const monthOptions = [1, 3, 6, 12] as const;
export const agentChoices = agents.filter((a) => monthlyAgentSlugs.includes(a.slug));

// ---------------------------------------------------------------------------------------------------------------
// Input and result
// ---------------------------------------------------------------------------------------------------------------

export interface EstimateInput {
  type: ProjectType;
  aiKind?: AiKind;
  features?: Feature[];
  integrations?: Integrations;
  aiFeature?: AiFeature;
  platforms?: Platform[];
  channels?: Channel[];
  design?: Design;
  sensitive?: boolean;
  stage?: Stage;
  timeline?: Timeline;
  agents?: string[];
  /** Team: number of people per role, in teamRates order. */
  team?: number[];
  months?: number;
}

export interface Driver {
  label: string;
  /** One-off amount in USD (negative = saving). */
  amount: number;
  /** Monthly amount, for agents and teams. */
  monthly?: number;
}

export interface Estimate {
  kind: 'build' | 'agents' | 'team';
  title: string;
  low: number;
  high: number;
  monthlyLow?: number;
  monthlyHigh?: number;
  months?: number;
  weeks: readonly [number, number];
  weeksLabel: string;
  drivers: Driver[];
  notes: string[];
}

const r100 = (n: number) => Math.round(n / 100) * 100;
const r500 = (n: number) => Math.round(n / 500) * 500;
const pct = (n: number) => `${n > 0 ? '+' : ''}${Math.round(n * 100)}%`;
const uniq = <T,>(a: T[] | undefined) => [...new Set(a ?? [])];

export const isBuild = (t: ProjectType): t is BuildType => t !== 'agents' && t !== 'team';
export const typeLabel = (t: ProjectType) => typeOptions.find((o) => o.value === t)?.label ?? t;

export function estimate(input: EstimateInput): Estimate {
  if (input.type === 'agents') return estimateAgents(input);
  if (input.type === 'team') return estimateTeam(input);
  return estimateBuild(input as EstimateInput & { type: BuildType });
}

function estimateBuild(input: EstimateInput & { type: BuildType }): Estimate {
  const t = input.type;
  const opt = typeOptions.find((o) => o.value === t)!;
  const kind = t === 'ai' ? aiKinds.find((k) => k.value === input.aiKind) ?? aiKinds[0]! : null;
  const base = kind ? kind.from : opt.from!;
  const drivers: Driver[] = [{ label: kind ? `${opt.label}: ${kind.label.toLowerCase()}` : opt.label, amount: base }];
  let sub = base;
  const add = (label: string, amount: number) => {
    const a = r100(amount);
    if (!a) return;
    drivers.push({ label, amount: a });
    sub += a;
  };

  // Features that apply to this type.
  const features = uniq(input.features).filter((f) => featureOptions.find((o) => o.value === f)?.types.includes(t));
  for (const f of features) add(featureOptions.find((o) => o.value === f)!.label, R.features[f]);
  const integ = input.integrations ?? 'none';
  if (R.integrations[integ]) add(`Connects to ${integrationOptions.find((o) => o.value === integ)!.label.toLowerCase()} other systems`, R.integrations[integ]);
  if (aiFeatureTypes.includes(t) && input.aiFeature && input.aiFeature !== 'none') {
    add(aiFeatureOptions.find((o) => o.value === input.aiFeature)!.label, input.aiFeature === 'rag' ? R.features.aiRag : R.features.aiAgent);
  }

  // Platforms (apps) or channels (AI).
  if (platformTypes.includes(t)) {
    const p = uniq(input.platforms).length ? uniq(input.platforms) : defaultPlatforms[t]!;
    const mobile = p.includes('ios') || p.includes('android');
    const surfaces = (p.includes('web') ? 1 : 0) + (mobile ? 1 : 0) + (p.includes('desktop') ? 1 : 0);
    const extra = Math.max(0, surfaces - 1);
    const s0 = sub;
    if (extra) add(`${extra === 1 ? 'A second platform' : `${extra} more platforms`} (${pct(R.extraSurface * extra)})`, s0 * R.extraSurface * extra);
    if (t === 'mobile' && p.includes('ios') !== p.includes('android')) add(`Only ${p.includes('ios') ? 'iOS' : 'Android'} (${pct(R.singleMobile)})`, s0 * R.singleMobile);
  }
  if (t === 'ai') {
    const ch = uniq(input.channels).length ? uniq(input.channels) : [kind?.value === 'voice' ? 'phone' : 'webchat'];
    const extra = ch.length - 1;
    if (extra > 0) add(`${extra} more channel${extra > 1 ? 's' : ''}`, extra * R.extraChannel);
    if (ch.includes('phone') && kind?.value !== 'voice') add('Phone line and voice for the agent', R.phoneChannel);
  }

  // Design, sensitive data, stage, timeline.
  if (platformTypes.includes(t) && (input.design ?? 'us') === 'us') add('UI/UX design', Math.max(R.designMin, sub * R.designShare));
  if (input.sensitive) add(`Sensitive data: security and compliance work (${pct(R.sensitive)})`, sub * R.sensitive);
  const stage = input.stage ?? 'mvp';
  if (stage !== 'mvp') {
    const delta = stage === 'prototype' ? Math.max(sub * R.stage.prototype, base - sub) : sub * R.stage[stage];
    add(`${stageOptions.find((o) => o.value === stage)!.label} (${pct(R.stage[stage])})`, delta);
  }
  const timeline = input.timeline ?? 'standard';
  if (timeline === 'rush') add(`As soon as possible: a larger team (${pct(R.rush)})`, sub * R.rush);

  const low = Math.max(base, sub);
  const high = r500(low * R.spread);
  // Calendar time grows with effort, but not linearly (bigger projects get more people in parallel). Calibrated so
  // typical projects land on the service page timelines (S4): mobile ≈ 7–12 weeks, SaaS MVP ≈ 8–13, chatbot ≈ 4–6.
  const w = (1.6 * Math.sqrt(low / 1000) + 0.5) * (stage === 'prototype' ? 0.85 : 1) * (timeline === 'rush' ? 0.75 : 1);
  const w0 = Math.max(2, Math.round(w));
  const weeks = [w0, Math.max(w0 + 1, Math.round(w * 1.6))] as const;

  const notes = [
    'Hosting, app store fees and third-party services are billed at cost, separately.',
    'You own 100% of the code and IP, and you pay by milestone, after each one works.',
  ];
  if (t === 'ai') notes.unshift(`Optional: we host, monitor and tune it for you from ${money(Math.min(...monthlyAgentSlugs.map((s) => agentPrices[s]!.monthly!)))}/mo. Model usage is billed at cost.`);
  return { kind: 'build', title: opt.label, low, high, weeks, weeksLabel: `${weeks[0]}–${weeks[1]} weeks`, drivers, notes };
}

function estimateAgents(input: EstimateInput): Estimate {
  const picked = uniq(input.agents).filter((s) => monthlyAgentSlugs.includes(s));
  const drivers: Driver[] = picked.map((s) => ({
    label: agents.find((a) => a.slug === s)!.name,
    amount: agentPrices[s]!.setup,
    monthly: agentPrices[s]!.monthly!,
  }));
  // Apply the best non-overlapping bundles (largest first-year saving first).
  let left = new Set(picked);
  const offers = bundles
    .map((b) => {
      const setupSep = b.agents.reduce((n, s) => n + agentPrices[s]!.setup, 0);
      const monthlySep = b.agents.reduce((n, s) => n + (agentPrices[s]!.monthly ?? 0), 0);
      return { b, setupSave: setupSep - b.setup, monthlySave: monthlySep - b.monthly, year: setupSep - b.setup + 12 * (monthlySep - b.monthly) };
    })
    .sort((a, b) => b.year - a.year);
  for (const o of offers) {
    if (o.b.agents.every((s) => left.has(s))) {
      drivers.push({ label: `${o.b.name} bundle saving`, amount: -o.setupSave, monthly: -o.monthlySave });
      left = new Set([...left].filter((s) => !o.b.agents.includes(s)));
    }
  }
  const low = drivers.reduce((n, d) => n + d.amount, 0);
  const monthly = drivers.reduce((n, d) => n + (d.monthly ?? 0), 0);
  const ops = picked.some((s) => agents.find((a) => a.slug === s)?.group === 'operate');
  const n = Math.max(1, picked.length);
  const weeks = [2 + (ops ? 1 : 0), 2 + n + (ops ? 1 : 0)] as const;
  return {
    kind: 'agents',
    title: picked.length === 1 ? drivers[0]!.label : `${picked.length} AI agents`,
    low,
    high: r500(low * R.agentSpread),
    monthlyLow: monthly,
    monthlyHigh: monthly,
    weeks,
    weeksLabel: `live in ${weeks[0]}–${weeks[1]} weeks`,
    drivers,
    notes: [
      'The monthly fee covers hosting, monitoring, weekly tuning and a fair-use volume. Usage above it is billed at cost, no markup.',
      'Setup varies with how many of your tools the agents connect to.',
    ],
  };
}

function estimateTeam(input: EstimateInput): Estimate {
  const counts = teamRates.map((_, i) => Math.max(0, Math.min(20, Math.round(input.team?.[i] ?? 0))));
  const months = monthOptions.includes(input.months as (typeof monthOptions)[number]) ? input.months! : 6;
  const drivers: Driver[] = teamRates.flatMap((r, i) => (counts[i] ? [{ label: `${counts[i]} × ${r.role}`, amount: 0, monthly: counts[i]! * r.monthly }] : []));
  const monthlyLow = drivers.reduce((n, d) => n + (d.monthly ?? 0), 0);
  const monthlyHigh = r100(monthlyLow * R.teamSpread);
  return {
    kind: 'team',
    title: 'Dedicated team',
    low: monthlyLow * months,
    high: monthlyHigh * months,
    monthlyLow,
    monthlyHigh,
    months,
    weeks: [1, 3],
    weeksLabel: 'starts in 1–3 weeks',
    drivers,
    notes: ['Rates are per full-time person per month. Senior and lead engineers sit at the top of the range.', 'A named lead, overlap hours with your time zone, and a notice period agreed in the contract.'],
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Text and URL helpers
// ---------------------------------------------------------------------------------------------------------------

export function rangeLabel(e: Estimate): string {
  if (e.kind === 'team') return `${money(e.monthlyLow!)}–${money(e.monthlyHigh!)}/mo`;
  const one = `${money(e.low)}–${money(e.high)}`;
  return e.kind === 'agents' ? `${one} setup + ${money(e.monthlyLow!)}/mo` : one;
}

/** Plain-text breakdown for the quote form and the lead email. */
export function summaryText(e: Estimate, link?: string): string {
  const lines = [`Estimate (indicative): ${rangeLabel(e)}${e.kind === 'team' ? ` (${money(e.low)}–${money(e.high)} for ${e.months} months)` : ''}, ${e.weeksLabel}.`, `Project: ${e.title}`];
  for (const d of e.drivers) {
    const parts = [d.amount ? money(d.amount) : '', d.monthly ? `${money(d.monthly)}/mo` : ''].filter(Boolean).join(' + ');
    lines.push(`- ${d.label}: ${parts}`);
  }
  if (link) lines.push(`Answers: ${link}`);
  return lines.join('\n');
}

const csv = (a?: readonly string[]) => (a && a.length ? a.join(',') : undefined);

/** Short query string so a result can be shared, prefilled and opened from the typical-costs table. */
export function toQuery(i: EstimateInput): string {
  const q: Record<string, string | undefined> = {
    t: i.type,
    k: i.type === 'ai' ? i.aiKind : undefined,
    f: csv(i.features),
    i: i.integrations && i.integrations !== 'none' ? i.integrations : undefined,
    x: i.aiFeature && i.aiFeature !== 'none' ? i.aiFeature : undefined,
    p: csv(i.platforms),
    c: csv(i.channels),
    d: i.design === 'own' ? 'own' : undefined,
    z: i.sensitive ? '1' : undefined,
    s: i.stage && i.stage !== 'mvp' ? i.stage : undefined,
    r: i.timeline && i.timeline !== 'standard' ? i.timeline : undefined,
    a: csv(i.agents),
    tm: i.team && i.team.some(Boolean) ? i.team.join('.') : undefined,
    m: i.type === 'team' && i.months ? String(i.months) : undefined,
  };
  return new URLSearchParams(Object.entries(q).filter((e): e is [string, string] => !!e[1])).toString();
}

export function fromQuery(search: string): EstimateInput | null {
  const q = new URLSearchParams(search);
  const type = q.get('t') as ProjectType | null;
  if (!type || !typeOptions.some((o) => o.value === type)) return null;
  const list = <T extends string>(k: string, allowed: readonly T[]) => (q.get(k) ?? '').split(',').filter((v): v is T => (allowed as readonly string[]).includes(v));
  const one = <T extends string>(k: string, allowed: readonly T[]) => {
    const v = q.get(k);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
  };
  const input: EstimateInput = { type };
  const aiKind = one('k', aiKinds.map((o) => o.value));
  if (aiKind) input.aiKind = aiKind;
  input.features = list('f', featureOptions.map((o) => o.value));
  input.integrations = one('i', integrationOptions.map((o) => o.value)) ?? 'none';
  input.aiFeature = one('x', aiFeatureOptions.map((o) => o.value)) ?? 'none';
  input.platforms = list('p', platformOptions.map((o) => o.value));
  input.channels = list('c', channelOptions.map((o) => o.value));
  input.design = q.get('d') === 'own' ? 'own' : 'us';
  input.sensitive = q.get('z') === '1';
  input.stage = one('s', stageOptions.map((o) => o.value)) ?? 'mvp';
  input.timeline = one('r', timelineOptions.map((o) => o.value)) ?? 'standard';
  input.agents = list('a', agentChoices.map((a) => a.slug));
  const tm = (q.get('tm') ?? '').split('.').map((n) => Number(n) || 0);
  if (tm.some(Boolean)) input.team = teamRates.map((_, i) => tm[i] ?? 0);
  const m = Number(q.get('m'));
  if (monthOptions.includes(m as (typeof monthOptions)[number])) input.months = m;
  return input;
}

/** Typical projects for the static table on /estimate/ and /pricing/ (visible facts for search and AI answers). */
export const typicalProjects: { name: string; input: EstimateInput }[] = [
  { name: 'Business website or simple web app', input: { type: 'web' } },
  { name: 'Web app with accounts, payments and an admin', input: { type: 'web', features: ['accounts', 'payments', 'admin'], integrations: 'few' } },
  { name: 'Mobile app for iOS and Android', input: { type: 'mobile', features: ['accounts', 'realtime', 'admin'], integrations: 'few' } },
  { name: 'SaaS MVP with subscriptions', input: { type: 'saas', features: ['accounts', 'payments', 'admin', 'reporting'], integrations: 'few' } },
  { name: 'AI chatbot over your documents', input: { type: 'ai', aiKind: 'rag', channels: ['webchat'], integrations: 'few' } },
  { name: 'Custom AI agent that uses your systems', input: { type: 'ai', aiKind: 'agent', features: ['admin'], integrations: 'some' } },
  { name: 'Computer vision or IoT prototype', input: { type: 'vision-iot', stage: 'prototype', features: ['admin'] } },
  { name: 'Clinic front desk (3 AI agents)', input: { type: 'agents', agents: ['ai-receptionist', 'ai-booking-agent', 'ai-reputation-agent'] } },
];
