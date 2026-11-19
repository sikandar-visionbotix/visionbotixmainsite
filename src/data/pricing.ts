/**
 * "From" prices (USD). Set by Claude on the owner's instruction (2026-11-19, decision D23: "decide yourself, competitive").
 * Positioning: an offshore studio priced clearly below US/UK agencies (typically $3–10k setup + $500–2k/mo per agent)
 * and close to self-serve AI tools once you count the setup work those tools leave to you.
 * Agent pages (S3), /pricing/ (S6) and the homepage read from here, so change a price in one place only.
 *
 * Monthly fees include hosting, monitoring, weekly tuning and a fair-use volume; model and telephony usage above that
 * is passed through at cost with no markup (stated on /pricing/).
 */
export type Currency = 'USD';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const money = (n: number) => usd.format(n);

export interface AgentPrice {
  /** One-off setup, from. */
  setup: number;
  /** Managed monthly fee, from. null = one-off engagement. */
  monthly: number | null;
  note?: string;
}

export const agentPrices: Record<string, AgentPrice> = {
  // Answer
  'ai-receptionist': { setup: 1500, monthly: 349 },
  'ai-customer-support-agent': { setup: 2500, monthly: 449 },
  'whatsapp-ai-agent': { setup: 1500, monthly: 299 },
  // Sell
  'ai-booking-agent': { setup: 1500, monthly: 299 },
  'ai-sdr-agent': { setup: 2500, monthly: 499 },
  // Market
  'ai-social-media-agent': { setup: 1000, monthly: 399 },
  'ai-seo-agent': { setup: 1500, monthly: 499 },
  'ai-ads-agent': { setup: 1500, monthly: 449 },
  'ai-reputation-agent': { setup: 750, monthly: 199 },
  // Operate
  'ai-knowledge-assistant': { setup: 3500, monthly: 399 },
  'ai-document-processing-agent': { setup: 3000, monthly: 399 },
  'ai-workflow-automation-agent': { setup: 2000, monthly: 299 },
  'ai-data-analyst-agent': { setup: 3000, monthly: 399 },
  // Secure and Build (project-priced)
  'mcp-server-development': { setup: 2500, monthly: null, note: 'Optional maintenance from $199/mo' },
  'ai-security-audit': { setup: 2500, monthly: null, note: 'Fixed-price audit with a written report' },
  'ai-mvp-development': { setup: 12000, monthly: null, note: 'Fixed price, 6–8 weeks' },
};

/** Vertical bundles: roughly 15–20% below the agents bought separately. */
export const bundles = [
  { slug: 'clinic-front-desk', name: 'Clinic Front Desk', agents: ['ai-receptionist', 'ai-booking-agent', 'ai-reputation-agent'], setup: 3000, monthly: 699 },
  { slug: 'real-estate-lead-desk', name: 'Real Estate Lead Desk', agents: ['ai-booking-agent', 'ai-sdr-agent', 'whatsapp-ai-agent'], setup: 4500, monthly: 899 },
  { slug: 'ecommerce-support-desk', name: 'E-commerce Support Desk', agents: ['ai-customer-support-agent', 'whatsapp-ai-agent', 'ai-reputation-agent'], setup: 3900, monthly: 799 },
  { slug: 'growth-desk', name: 'Growth Desk', agents: ['ai-social-media-agent', 'ai-seo-agent', 'ai-ads-agent', 'ai-reputation-agent'], setup: 3900, monthly: 1290 },
];

/** Entry offer and the main lead magnet: credited in full against a build within 60 days. */
export const audit = { name: 'AI Opportunity Audit', price: 490, duration: '1 week', note: 'Credited in full if you go ahead with a build within 60 days' };

/** Custom work, fixed price after scoping ("from" values, D23). Service pages and /pricing/ read these. */
export const projectFrom = {
  customAgent: 8000,
  genAi: 6000,
  customChatbot: 4000,
  customVoice: 4000,
  webApp: 3000,
  customSoftware: 5000,
  mobileApp: 8000,
  saasMvp: 12000,
  visionIot: 10000,
  designSprint: 1500,
  cloudSetup: 1500,
};

export const projects = [
  { name: 'Custom AI agent or agentic system', from: projectFrom.customAgent },
  { name: 'Website or web app', from: projectFrom.webApp },
  { name: 'Mobile app (iOS and Android)', from: projectFrom.mobileApp },
  { name: 'SaaS MVP', from: projectFrom.saasMvp },
  { name: 'Computer vision or IoT prototype', from: projectFrom.visionIot },
];

/** Dedicated team members, full time, per month. */
export const teamRates = [
  { role: 'AI / ML engineer', monthly: 3900 },
  { role: 'Full-stack engineer', monthly: 3200 },
  { role: 'Mobile engineer', monthly: 3200 },
  { role: 'UI/UX designer', monthly: 2600 },
  { role: 'QA engineer', monthly: 2200 },
];
export const hourlyFrom = 25;

/**
 * Service "from" prices (S4, D32). Keyed by the service slug (src/content/services/<slug>.md); content files carry no
 * prices (D27). Each value comes from the numbers above, so a service can never disagree with an agent or a project.
 *  - `per: 'month'` = a monthly rate (dedicated teams); otherwise a one-off, fixed price.
 *  - `basis` says what the "from" buys, shown next to the price and in the generated FAQ.
 *  - `question` overrides the generated "How much does <service> cost?" wording.
 */
export interface ServicePrice {
  from: number;
  per?: 'month';
  basis: string;
  question?: string;
}
const ap = (slug: string) => agentPrices[slug]!;
const minTeam = Math.min(...teamRates.map((r) => r.monthly));

export const servicePrices: Record<string, ServicePrice> = {
  // AI Agents & Automation
  'ai-agent-development': { from: projectFrom.customAgent, basis: 'custom agent, fixed price after scoping' },
  'generative-ai-development': { from: projectFrom.genAi, basis: 'LLM or RAG application, fixed price after scoping' },
  'ai-automation': { from: ap('ai-workflow-automation-agent').setup, basis: `first automated workflow, plus ${money(ap('ai-workflow-automation-agent').monthly!)}/mo if we run it for you` },
  'ai-chatbot-development': { from: ap('whatsapp-ai-agent').setup, basis: `packaged chat agent setup; custom chatbots from ${money(projectFrom.customChatbot)}` },
  'ai-voice-agents': { from: ap('ai-receptionist').setup, basis: `packaged voice receptionist setup; custom voice agents from ${money(projectFrom.customVoice)}`, question: 'How much does an AI voice agent cost?' },
  'ai-consulting': { from: audit.price, basis: `${audit.name}, ${audit.duration}, credited in full against a build`, question: 'How much does AI consulting cost?' },
  // Software, Web & Mobile
  'custom-software-development': { from: projectFrom.customSoftware, basis: 'first release, fixed price per milestone' },
  'web-app-development': { from: projectFrom.webApp, basis: 'website or web app, fixed price after scoping' },
  'mobile-app-development': { from: projectFrom.mobileApp, basis: 'iOS and Android app, fixed price after scoping' },
  'saas-mvp-development': { from: projectFrom.saasMvp, basis: 'SaaS MVP, fixed price after scoping', question: 'How much does it cost to build a SaaS MVP?' },
  'ui-ux-design': { from: projectFrom.designSprint, basis: 'design sprint for one product flow' },
  'cloud-devops': { from: projectFrom.cloudSetup, basis: 'cloud setup or CI/CD pipeline, fixed price', question: 'How much do cloud and DevOps services cost?' },
  'dedicated-teams': { from: minTeam, per: 'month', basis: `per full-time engineer; hourly from ${money(hourlyFrom)}`, question: 'How much does a dedicated developer cost?' },
  // Deep Tech & Security
  'computer-vision': { from: projectFrom.visionIot, basis: 'prototype or proof of concept, fixed price', question: 'How much does computer vision development cost?' },
  'iot-embedded': { from: projectFrom.visionIot, basis: 'prototype or proof of concept, fixed price', question: 'How much does IoT and embedded development cost?' },
  cybersecurity: { from: ap('ai-security-audit').setup, basis: 'AI and LLM security audit; our security products are quoted per deployment', question: 'How much does an AI security audit cost?' },
};


/** "From $1,500 + $349/mo" or "From $2,500". */
export function priceLabel(slug: string): string | null {
  const p = agentPrices[slug];
  if (!p) return null;
  return p.monthly ? `From ${money(p.setup)} + ${money(p.monthly)}/mo` : `From ${money(p.setup)}`;
}

/** "From $8,000" or "From $2,200/mo". */
export function serviceLabel(slug: string): string | null {
  const p = servicePrices[slug];
  if (!p) return null;
  return `From ${money(p.from)}${p.per === 'month' ? '/mo' : ''}`;
}

/**
 * Estimator cost drivers (S6, D46). Set by Claude under the owner's pricing mandate (D23). /estimate/ and the
 * "What drives the price" section on /pricing/ read these; the logic is in src/data/estimator.ts.
 * - Feature amounts are added to the project type's "from" price (projectFrom).
 * - Shares are fractions of the running subtotal (0.5 = +50%).
 * The result is indicative: the signed fixed quote is the binding price.
 */
export const estimatorRates = {
  features: {
    accounts: 1500,
    payments: 2000,
    admin: 2500,
    realtime: 2500,
    files: 1000,
    reporting: 2000,
    languages: 1500,
    offline: 3000,
    migration: 2500,
    aiRag: 4000,
    aiAgent: 7000,
  },
  integrations: { none: 0, few: 1500, some: 4000, many: 8000 },
  /** Each extra surface (web, mobile, desktop) beyond the first, as a share of the subtotal. */
  extraSurface: 0.5,
  /** Mobile app for only one of iOS or Android (the "from" price covers both from one codebase). */
  singleMobile: -0.15,
  /** AI projects: each extra channel beyond the first, and a phone line for a non-voice agent. */
  extraChannel: 1000,
  phoneChannel: 2500,
  /** "Design it for us": a share of the subtotal, never less than one design sprint. */
  designShare: 0.12,
  designMin: projectFrom.designSprint,
  sensitive: 0.15,
  stage: { prototype: -0.25, mvp: 0, production: 0.4 },
  rush: 0.25,
  /** Top of the range = bottom × spread (builds), × agentSpread (packaged agents, integrations vary), × teamSpread (seniority). */
  spread: 1.5,
  agentSpread: 1.3,
  teamSpread: 1.25,
} as const;

/**
 * Local-currency figures for the country pages (S9, D66). Prices are SET in USD (above); these are approximate
 * conversions for orientation only, rounded, and labelled "≈" with the rate and month wherever they appear. The
 * signed quote states the binding amount and currency. Update the rates (and `fxAsOf`) every few months.
 * Sources, November 2026: HMRC monthly rate for GBP; market mid-rates (rounded) for EUR, AUD, CAD and PKR;
 * AED and SAR are pegged to the US dollar.
 */
export const localCurrencies = ['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'AED', 'SAR', 'PKR'] as const;
export type LocalCurrency = (typeof localCurrencies)[number];
export const fxAsOf = 'November 2026';
/** Plural names for headings: "What it costs, in pounds." */
export const currencyNames: Record<LocalCurrency, string> = { USD: 'US dollars', GBP: 'pounds sterling', EUR: 'euros', AUD: 'Australian dollars', CAD: 'Canadian dollars', AED: 'UAE dirhams', SAR: 'Saudi riyals', PKR: 'Pakistani rupees' };
/** Units of the currency per US$1. */
export const fx: Record<LocalCurrency, number> = { USD: 1, GBP: 0.75, EUR: 0.91, AUD: 1.5, CAD: 1.4, AED: 3.6725, SAR: 3.75, PKR: 280 };

/** Round to a "nice" figure: 2 significant digits, then halves (1,125 → 1,150; 262 → 260; 55,720 → 55,500). */
export function niceRound(n: number): number {
  if (n < 20) return Math.round(n);
  const step = 10 ** (Math.floor(Math.log10(n)) - 1) / 2;
  return Math.round(n / step) * step;
}
const fmt = Object.fromEntries(
  localCurrencies.map((c) => [c, new Intl.NumberFormat('en-US', { style: 'currency', currency: c, currencyDisplay: 'symbol', maximumFractionDigits: 0 })]),
) as Record<LocalCurrency, Intl.NumberFormat>;
/** A USD amount in a local currency, rounded: "£1,150", "€1,350", "A$2,250", "CA$2,100", "AED 5,500", "PKR 420,000". */
export function localMoney(usdAmount: number, c: LocalCurrency): string {
  return fmt[c].format(c === 'USD' ? usdAmount : niceRound(usdAmount * fx[c])).replace(/^([A-Z]{3})\s?/, '$1 ');
}
/** "US$1,500" (unambiguous next to A$, CA$ …). */
export const usMoney = (n: number) => `US${money(n)}`;
