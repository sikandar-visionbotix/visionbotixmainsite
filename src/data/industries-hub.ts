/**
 * /industries/ hub copy (S8). Industries come from `src/content/industries/` via getIndustries(); every price comes
 * from pricing.ts (D23, D27). Truth rules (CLAUDE.md): capability and process claims only; no statistics, clients,
 * testimonials or certification claims.
 */
import type { FaqItem } from '@/lib/schema';
import { agentPrices, audit, bundles, money } from '@/data/pricing';
import { industries, agents } from '@/data/catalogue';

const minSetup = Math.min(...Object.values(agentPrices).filter((p) => p.monthly).map((p) => p.setup));
const minMonthly = Math.min(...Object.values(agentPrices).flatMap((p) => (p.monthly ? [p.monthly] : [])));
const minBundle = bundles.reduce((a, b) => (b.setup < a.setup ? b : a));

export const industriesHero = {
  title: 'AI agents that already know how your industry works.',
  accent: 'how your industry works.',
  lead:
    `Visionbotix sets up AI agents and builds software for ${industries.length} industries, from dental clinics and law firms to online stores, logistics and the public sector. Each sector gets a recommended AI team, the rules it works under built into the setup, and public prices. Most agents go live in about two weeks.`,
  points: ['Sector rules built into the setup', 'Approval gates on every agent', 'Public prices, monthly plans'],
};

export const industrySteps = [
  { title: 'Map your week', body: 'A free 30-minute call about the calls, messages and paperwork that take up most of your time, and the rules your sector works under.', meta: 'Day 0' },
  { title: 'Pick the team', body: 'We recommend the one agent that pays off first, or a bundle, and send a fixed quote within 24 hours.', meta: 'Day 1' },
  { title: 'Connect and test', body: 'We connect your systems, load your policies and test real scenarios with your team until the answers are right.', meta: 'Week 1–2' },
  { title: 'Go live and tune', body: 'The agents start on part of the work, such as after-hours only, and we tune them weekly from the transcripts.', meta: 'Week 2+' },
];

export const hubFaqs: FaqItem[] = [
  {
    q: 'Which industries does Visionbotix build AI agents for?',
    a: `${industries.map((i) => i.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}. Each has its own page with a recommended AI team, the regulations we design around, live demos and prices. We also build for sectors not on the list: the agents and the engineering are the same, only the rules and the systems change.`,
  },
  {
    q: 'How much do AI agents for my industry cost?',
    a: `Packaged agents start from ${money(minSetup)} setup plus ${money(minMonthly)} a month each. Sector bundles combine the agents that work best together for less, from ${money(minBundle.setup)} plus ${money(minBundle.monthly)} a month for the ${minBundle.name}. If you are not sure where to start, the ${audit.name} (${money(audit.price)}) maps where AI pays off first and is credited in full against a build.`,
  },
  {
    q: 'Do the agents follow the regulations in my sector?',
    a: 'We design each setup around the rules that apply to you, such as HIPAA for US healthcare, GDPR and UK GDPR, consent rules for texts and calls, or client confidentiality for law firms. That means the right data region, signed data agreements with providers, approvals for sensitive actions and an audit log. Compliance stays your responsibility, so your compliance lead signs off the setup before go-live.',
  },
  {
    q: 'Can an AI agent make decisions on its own?',
    a: 'Only inside the limits you set. Routine work such as answering questions, booking and logging runs on its own. Anything sensitive, such as refunds above a limit, clinical or legal questions, credit or admissions decisions, or a reply to an angry customer, waits for a person to approve it.',
  },
  {
    q: 'Can I try the agents before buying?',
    a: `Yes. All ${agents.length} agents run live on fictional businesses at <a href="/demos/">visionbotix.com/demos</a>, with no sign-up. You see every tool call, guardrail and approval the agent makes, and you can try to break it.`,
  },
  {
    q: 'My industry is not listed. Can you still help?',
    a: 'Very likely. The agents answer, book, follow up, read documents and automate back-office work, which every sector needs. Tell us how your team works on a free call and we will say honestly whether a packaged agent fits or a custom build makes more sense.',
  },
];
