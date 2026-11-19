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

/** Custom work, fixed price after scoping. */
export const projects = [
  { name: 'Custom AI agent or agentic system', from: 8000 },
  { name: 'Website or web app', from: 3000 },
  { name: 'Mobile app (iOS and Android)', from: 8000 },
  { name: 'SaaS MVP', from: 12000 },
  { name: 'Computer vision or IoT prototype', from: 10000 },
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

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const money = (n: number) => usd.format(n);

/** "From $1,500 + $349/mo" or "From $2,500". */
export function priceLabel(slug: string): string | null {
  const p = agentPrices[slug];
  if (!p) return null;
  return p.monthly ? `From ${money(p.setup)} + ${money(p.monthly)}/mo` : `From ${money(p.setup)}`;
}
