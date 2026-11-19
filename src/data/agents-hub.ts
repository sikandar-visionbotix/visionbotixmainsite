/**
 * /ai-agents/ hub copy (S3). Agents themselves come from `src/content/agents/` via getAgents(); prices from pricing.ts.
 * Truth rules (CLAUDE.md): capability and process claims only; no statistics, clients or testimonials.
 */
import type { IconName } from '@/lib/icons';
import type { FaqItem } from '@/lib/schema';
import { agentPrices, audit, bundles, money, projects } from '@/data/pricing';

export const hubHero = {
  title: 'AI agents for business, ready to hire.',
  accent: 'ready to hire.',
  lead:
    'Visionbotix offers 16 packaged AI agents that answer calls and messages, follow up leads, run marketing and clear back-office work. Each one is set up, connected to your tools and managed for you, with guardrails, human approval gates and an audit log. Prices are public, and most agents go live in about two weeks.',
  points: ['Public "from" prices', 'Live in about 2 weeks', 'Human approval built in'],
};

/** Bundle blurbs, keyed by the bundle slug in pricing.ts. */
export const bundleCopy: Record<string, { blurb: string; icon: IconName; forWho: string }> = {
  'clinic-front-desk': {
    icon: 'stethoscope',
    blurb: 'Answer every call, fill the diary, cut no-shows with reminders and grow your reviews.',
    forWho: 'Dental, medical and aesthetic clinics',
  },
  'real-estate-lead-desk': {
    icon: 'house',
    blurb: 'Reply to every portal and ad lead within a minute, qualify buyers and book viewings by phone and WhatsApp.',
    forWho: 'Estate agents, brokers and developers',
  },
  'ecommerce-support-desk': {
    icon: 'shopping-cart',
    blurb: 'Resolve order questions on chat, email and WhatsApp, recover abandoned carts and reply to every review.',
    forWho: 'Online stores and D2C brands',
  },
  'growth-desk': {
    icon: 'megaphone',
    blurb: 'An always-on marketing desk: social posts and replies, SEO and AI-search visibility, ads monitoring and reviews.',
    forWho: 'Growing brands without a full marketing team',
  },
};

/** What every agent ships with (PLAN §5 trust messaging). */
export const shipsWith: { icon: IconName; title: string; text: string }[] = [
  { icon: 'gauge', title: 'A baseline metric', text: 'We agree the number to beat before we start, such as answered calls or reply time, and report on it every week.' },
  { icon: 'list-checks', title: 'An eval suite', text: 'Real scenarios from your business that the agent must pass before launch and after every change.' },
  { icon: 'shield-check', title: 'Guardrails', text: 'It works only from your approved facts and tools, and declines anything outside its job.' },
  { icon: 'user-check', title: 'Approval gates', text: 'Refunds, payments, publishing and anything irreversible wait for a person to approve.' },
  { icon: 'scroll-text', title: 'An audit log', text: 'Every message, decision and tool call is recorded, searchable and exportable.' },
  { icon: 'hand', title: 'Human handoff', text: 'Customers can reach a person at any time, and your team gets the conversation summary.' },
];

const monthlyAgents = Object.values(agentPrices).filter((p) => p.monthly);
const minSetup = Math.min(...monthlyAgents.map((p) => p.setup));
const maxSetup = Math.max(...monthlyAgents.map((p) => p.setup));
const minMonthly = Math.min(...monthlyAgents.map((p) => p.monthly!));
const maxMonthly = Math.max(...monthlyAgents.map((p) => p.monthly!));
const customFrom = projects[0]!.from;
const minBundle = Math.min(...bundles.map((b) => b.setup));

export const hubFaqs: FaqItem[] = [
  {
    q: 'What is an AI agent, and how is it different from a chatbot?',
    a: 'A chatbot answers questions. An AI agent also does the work: it checks your calendar, books the appointment, updates your CRM, files the document and asks a person for approval when your rules say so. Our agents work inside your own tools, with guardrails and an audit log.',
  },
  {
    q: 'How much does an AI agent cost?',
    a: `Our packaged agents start from ${money(minSetup)}–${money(maxSetup)} for setup plus ${money(minMonthly)}–${money(maxMonthly)} a month for hosting, monitoring and tuning. Bundles start from ${money(minBundle)} setup and cost less than the agents bought separately. Custom agentic systems start from ${money(customFrom)}, and the ${audit.name} costs ${money(audit.price)}. Every price is listed on the agent's page.`,
  },
  {
    q: 'How long does it take to set up an agent?',
    a: 'Most packaged agents go live in about two weeks. Knowledge, document and data agents take two to four weeks because we prepare and test your data first, and the AI MVP Sprint runs six to eight weeks.',
  },
  {
    q: 'Do I need technical staff to run one?',
    a: 'No. We set the agent up, host it, monitor it and tune it every week, and you get a short report. Your team only approves the actions you want to approve and picks up the conversations the agent hands over.',
  },
  {
    q: 'What happens if the agent makes a mistake?',
    a: 'The agent only uses facts and tools you have approved, risky actions wait at an approval gate, and every step is in the audit log so it can be traced and fixed. Before launch it must pass an eval suite built from your real scenarios, and we re-run it after every change.',
  },
  {
    q: 'Can I combine several agents?',
    a: 'Yes. Agents share your CRM and calendar, so a lead the Booking Agent qualifies can be followed up by the SDR Agent and confirmed on WhatsApp. Our bundles package common combinations for clinics, real estate, e-commerce and marketing at a lower price.',
  },
  {
    q: 'Where is my data stored, and who owns it?',
    a: 'Your data stays in the region you choose and is never used to train public models. You own your data, the configuration, the prompts and any code we write for you. For sensitive work, the Knowledge Agent can run on your own servers.',
  },
  {
    q: 'Which AI models do you use?',
    a: 'We are model-agnostic. We pick OpenAI, Anthropic Claude, Google Gemini or open models such as Llama for each task based on quality, cost and your data rules, and we can switch models later without rebuilding the agent.',
  },
];
