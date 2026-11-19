/**
 * The offer catalogue (PLAN.md §3 and §5). Navigation, the footer and hub grids read from here until the
 * content collections are filled (S3/S4); after that, pages come from `src/content/*` and this file only drives menus.
 */
import type { IconName } from '@/lib/icons';

export type AgentGroup = 'answer' | 'sell' | 'market' | 'operate' | 'secure-build';

export const agentGroups: Record<AgentGroup, { label: string; blurb: string }> = {
  answer: { label: 'Answer', blurb: 'Every call, chat and message, handled.' },
  sell: { label: 'Sell', blurb: 'Speed-to-lead and booked meetings.' },
  market: { label: 'Market', blurb: 'Content, search, ads and reviews.' },
  operate: { label: 'Operate', blurb: 'Documents, data and back-office work.' },
  'secure-build': { label: 'Secure and Build', blurb: 'Connect, harden and ship AI products.' },
};

export interface AgentItem {
  slug: string;
  name: string;
  line: string;
  group: AgentGroup;
  icon: IconName;
}

export const agents: AgentItem[] = [
  { slug: 'ai-receptionist', name: 'Receptionist Agent', line: 'Answers every call 24/7 and books into your calendar.', group: 'answer', icon: 'headset' },
  { slug: 'ai-customer-support-agent', name: 'Support Agent', line: 'Resolves tier-1 tickets across chat, email and WhatsApp.', group: 'answer', icon: 'message-circle' },
  { slug: 'whatsapp-ai-agent', name: 'WhatsApp Agent', line: 'Instant replies, order status and cart recovery.', group: 'answer', icon: 'whatsapp' },
  { slug: 'ai-booking-agent', name: 'Booking Agent', line: 'Contacts every new lead within 60 seconds and books them.', group: 'sell', icon: 'calendar-check' },
  { slug: 'ai-sdr-agent', name: 'SDR Agent', line: 'Researches accounts and books meetings into your CRM.', group: 'sell', icon: 'target' },
  { slug: 'ai-social-media-agent', name: 'Social Media Agent', line: 'Plans, writes and schedules posts; replies in your voice.', group: 'market', icon: 'megaphone' },
  { slug: 'ai-seo-agent', name: 'SEO & GEO Agent', line: 'Finds ranking gaps and tracks citations in AI search.', group: 'market', icon: 'search' },
  { slug: 'ai-ads-agent', name: 'Ads Agent', line: 'Watches Meta and Google spend daily, behind approval gates.', group: 'market', icon: 'chart-line' },
  { slug: 'ai-reputation-agent', name: 'Reputation Agent', line: 'Monitors reviews and drafts on-brand replies.', group: 'market', icon: 'star' },
  { slug: 'ai-knowledge-assistant', name: 'Knowledge Agent', line: 'A private company brain over your docs, with citations.', group: 'operate', icon: 'brain' },
  { slug: 'ai-document-processing-agent', name: 'Document Agent', line: 'Invoices, contracts and KYC documents into validated data.', group: 'operate', icon: 'file-text' },
  { slug: 'ai-workflow-automation-agent', name: 'Ops Agent', line: 'Automates repetitive work across email, CRM and ERP.', group: 'operate', icon: 'workflow' },
  { slug: 'ai-data-analyst-agent', name: 'Data Analyst Agent', line: 'Ask your database questions in plain English.', group: 'operate', icon: 'database' },
  { slug: 'mcp-server-development', name: 'MCP Connector', line: 'Connects your systems to Claude, ChatGPT and Copilot, securely.', group: 'secure-build', icon: 'plug' },
  { slug: 'ai-security-audit', name: 'Guardrail & Eval Audit', line: 'Red-teams your LLM app for injection and leakage.', group: 'secure-build', icon: 'shield-check' },
  { slug: 'ai-mvp-development', name: 'AI MVP Sprint', line: 'Idea to a working AI product in 6–8 weeks, fixed price.', group: 'secure-build', icon: 'rocket' },
];

export type Pillar = 'ai' | 'software' | 'deeptech';

export const pillars: Record<Pillar, { label: string; blurb: string }> = {
  ai: { label: 'AI Agents & Automation', blurb: 'Agents and automations that do real work.' },
  software: { label: 'Software, Web & Mobile', blurb: 'SaaS, platforms and apps your customers love.' },
  deeptech: { label: 'Deep Tech & Security', blurb: 'Vision, embedded and hardware-grade security.' },
};

export interface ServiceItem {
  slug: string;
  name: string;
  pillar: Pillar;
  icon: IconName;
}

export const services: ServiceItem[] = [
  { slug: 'ai-agent-development', name: 'AI agent development', pillar: 'ai', icon: 'bot' },
  { slug: 'generative-ai-development', name: 'Generative AI development', pillar: 'ai', icon: 'sparkles' },
  { slug: 'ai-automation', name: 'AI automation', pillar: 'ai', icon: 'workflow' },
  { slug: 'ai-chatbot-development', name: 'AI chatbot development', pillar: 'ai', icon: 'message-circle' },
  { slug: 'ai-voice-agents', name: 'AI voice agents', pillar: 'ai', icon: 'headset' },
  { slug: 'ai-consulting', name: 'AI consulting', pillar: 'ai', icon: 'brain' },
  { slug: 'custom-software-development', name: 'Custom software development', pillar: 'software', icon: 'code' },
  { slug: 'web-app-development', name: 'Web app development', pillar: 'software', icon: 'globe' },
  { slug: 'mobile-app-development', name: 'Mobile app development', pillar: 'software', icon: 'smartphone' },
  { slug: 'saas-mvp-development', name: 'SaaS and MVP development', pillar: 'software', icon: 'rocket' },
  { slug: 'ui-ux-design', name: 'UI/UX design', pillar: 'software', icon: 'palette' },
  { slug: 'cloud-devops', name: 'Cloud and DevOps', pillar: 'software', icon: 'cloud' },
  { slug: 'dedicated-teams', name: 'Dedicated teams', pillar: 'software', icon: 'users' },
  { slug: 'computer-vision', name: 'Computer vision', pillar: 'deeptech', icon: 'scan-eye' },
  { slug: 'iot-embedded', name: 'IoT and embedded', pillar: 'deeptech', icon: 'cpu' },
  { slug: 'cybersecurity', name: 'Cybersecurity', pillar: 'deeptech', icon: 'shield-check' },
];

/** Ways to work with us (service pages, /services/ hub, /pricing/). Copy in src/data/services-hub.ts. */
export const engagements = ['fixed-scope', 'monthly-retainer', 'dedicated-team', 'audit'] as const;
export type Engagement = (typeof engagements)[number];

/** Own products with a page on this site (/products/<slug>/). `group` drives the /products/ hub sections. */
export const products = [
  { slug: 'wakeel', name: 'Wakeel', line: 'AI lawyer matching for Pakistan, in Urdu, English or Roman Urdu.', icon: 'scale' as IconName, group: 'platform' as const },
  { slug: 'vx-1-ip-encryptor', name: 'VX-1 IP Encryptor', line: 'FPGA-based, plug-and-play AES-256 IP encryptor.', icon: 'lock' as IconName, group: 'security' as const },
  { slug: 'threatiq', name: 'ThreatIQ', line: 'Internal defense layer for air-gapped networks.', icon: 'shield-check' as IconName, group: 'security' as const },
  { slug: 'cyber-range', name: 'Cyber Range', line: 'Red/blue team training and device testing.', icon: 'server' as IconName, group: 'security' as const },
];
export const securityProducts = products.filter((p) => p.group === 'security');

/**
 * Industry pages (S8): /industries/ and one page per entry below (content in src/content/industries/, read through
 * getIndustries(), which fails the build if this list and the content drift). Set to false to render industry names
 * as plain text again (D44).
 */
export const industriesLive = true;

export const industries = [
  { slug: 'healthcare', name: 'Healthcare', icon: 'heart-pulse' as IconName },
  { slug: 'dental-clinics', name: 'Dental clinics', icon: 'stethoscope' as IconName },
  { slug: 'real-estate', name: 'Real estate', icon: 'house' as IconName },
  { slug: 'ecommerce', name: 'E-commerce', icon: 'shopping-cart' as IconName },
  { slug: 'legal', name: 'Legal', icon: 'scale' as IconName },
  { slug: 'finance', name: 'Finance', icon: 'landmark' as IconName },
  { slug: 'logistics', name: 'Logistics', icon: 'truck' as IconName },
  { slug: 'education', name: 'Education', icon: 'graduation-cap' as IconName },
  { slug: 'hospitality', name: 'Hospitality', icon: 'hotel' as IconName },
  { slug: 'agriculture', name: 'Agriculture', icon: 'sprout' as IconName },
  { slug: 'saas-startups', name: 'SaaS startups', icon: 'rocket' as IconName },
  { slug: 'government-defense', name: 'Government and defense', icon: 'building-2' as IconName },
];

export const company = [
  { href: '/about/', name: 'About' },
  { href: '/process/', name: 'How we work' },
  { href: '/work/', name: 'Our work' },
  { href: '/careers/', name: 'Careers' },
  { href: '/contact/', name: 'Contact' },
];

export const agentsByGroup = (Object.keys(agentGroups) as AgentGroup[]).map((g) => ({
  key: g,
  ...agentGroups[g],
  items: agents.filter((a) => a.group === g),
}));

export const servicesByPillar = (Object.keys(pillars) as Pillar[]).map((p) => ({
  key: p,
  ...pillars[p],
  items: services.filter((s) => s.pillar === p),
}));
