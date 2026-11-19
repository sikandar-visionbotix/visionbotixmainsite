/**
 * Homepage copy (Sprint 2). Kept apart from the markup so it can be edited without touching layout.
 * Truth rules (CLAUDE.md): only real facts; no testimonials (D12); no client names (D18); numbers only from `site.facts`.
 * Promises the owner still has to confirm are marked TODO(owner) and listed in TRACKER "Needs from owner".
 */
import type { IconName } from '@/lib/icons';
import type { FaqItem } from '@/lib/schema';
import { site } from '@/data/site';
import { agentPrices, audit, money } from '@/data/pricing';

export const hero = {
  eyebrow: 'AI agents · Software · Security',
  title: 'AI agents and software that do the work.',
  accent: 'do the work.',
  lead:
    'We build AI agents that answer your calls, follow up every lead and clear the back-office queue, plus the web and mobile apps they run in. Engineered by a team that also builds hardware-grade security products.',
  // Promises confirmed by the owner 2026-11-19 (D22).
  points: ['Packaged agents live in ~2 weeks', 'NDA on request', 'You own the code'],
};

/** Real, checkable proof only. Each item is our own product or our own published app. */
export const proof: { icon: IconName; title: string; text: string; href?: string }[] = [
  { icon: 'scale', title: 'Wakeel', text: 'Our prompt-first AI platform that matches people with verified lawyers, live', href: '/products/wakeel/' },
  { icon: 'shield-check', title: '3 security products', text: 'VX-1, ThreatIQ and Cyber Range, designed and built in-house', href: '/products/' },
  { icon: 'smartphone', title: 'Apps on the App Store and Google Play', text: 'iOS and Android apps built by our team, live on both stores' },
  { icon: 'sprout', title: 'Smart Livestock', text: 'Our AI platform for dairy and livestock farms, live', href: 'https://livestock.visionbotix.com' },
  { icon: 'scan-eye', title: 'Vision AI cameras', text: 'Our computer-vision product line, live', href: 'https://cv.visionbotix.com' },
];

/** Where we have delivered (owner, 2026-11-19). */
export const reach = `Delivered for clients in ${site.facts.countriesServed} countries, including ${site.deliveredIn.slice(0, -1).join(', ')} and ${site.deliveredIn.at(-1)}.`;

/** The 8 agents shown on the homepage (full catalogue on /ai-agents/). Order follows the hub groups. */
export const featuredAgents = [
  'ai-receptionist',
  'ai-customer-support-agent',
  'whatsapp-ai-agent',
  'ai-booking-agent',
  'ai-sdr-agent',
  'ai-social-media-agent',
  'ai-seo-agent',
  'ai-knowledge-assistant',
];

export const pillarCopy: Record<'ai' | 'software' | 'deeptech', { icon: IconName; text: string; href: string; cta: string; tags: string[] }> = {
  ai: {
    icon: 'bot',
    text: 'Packaged agents for calls, chat, leads, content and documents, and custom agentic systems with tool use, MCP and evals.',
    href: '/ai-agents/',
    cta: 'Explore AI agents',
    tags: ['16 packaged agents', 'Custom agentic systems', 'Voice and chat', 'Workflow automation'],
  },
  software: {
    icon: 'layers',
    text: 'SaaS products and MVPs, web platforms, iOS and Android apps, designed by us and run in the cloud.',
    href: '/services/',
    cta: 'Explore software services',
    tags: ['SaaS and MVPs', 'Web platforms', 'iOS and Android', 'UI/UX design'],
  },
  deeptech: {
    icon: 'cpu',
    text: 'Computer vision, IoT and embedded systems, robotics and FPGA, and our own cybersecurity products.',
    href: '/services/computer-vision/',
    cta: 'Explore deep tech',
    tags: ['Computer vision', 'IoT and embedded', 'Robotics', 'Own security products'],
  },
};

export const steps = [
  { title: 'Free strategy call', body: 'Thirty minutes. We map where an agent saves you the most hours and which tools it needs to reach.', meta: 'Day 0' },
  { title: 'Scope and baseline', body: 'A fixed-price scope, the metric we will measure against and the guardrails the agent must respect.', meta: 'Days 1–3' },
  { title: 'Build and connect', body: 'We set up or build the agent, connect your calendar, CRM, inbox or ERP and test it on real scenarios.', meta: 'Days 3–10' },
  { title: 'Launch and improve', body: 'It goes live with approval gates and an audit log. We monitor it, report weekly and keep improving it.', meta: 'Day ~14 onward' },
];

/** Qualitative only: no invented percentages or time savings. */
export const beforeAfter: { area: string; icon: IconName; before: string; after: string }[] = [
  { area: 'Calls', icon: 'phone-missed', before: 'Calls after 6 pm go to voicemail, and most callers never leave one.', after: 'Every call is answered day and night, and booked straight into your calendar.' },
  { area: 'Leads', icon: 'timer', before: 'New leads wait hours for a reply, and the fastest competitor wins them.', after: 'Every new lead hears back within a minute, gets qualified and is offered a time.' },
  { area: 'Support', icon: 'inbox', before: 'Your team answers the same twenty questions by hand, all day.', after: 'Routine questions are resolved from your own docs; the rest reach a person with context.' },
  { area: 'Documents', icon: 'file-text', before: 'Staff retype invoices and forms into the ERP, and errors slip through.', after: 'Documents are read, validated and posted, and only the exceptions need a human.' },
  { area: 'Marketing', icon: 'megaphone', before: 'Posts and review replies stop whenever the team gets busy.', after: 'A steady content plan and on-brand replies, published after your approval.' },
];

export const securityPractices: { icon: IconName; title: string; text: string }[] = [
  { icon: 'server-cog', title: 'Your data stays yours', text: 'Private deployments in your cloud, on-premises or fully air-gapped with open models.' },
  { icon: 'key-round', title: 'Least privilege', text: 'Agents get only the tools and data a task needs, and every action is written to an audit log.' },
  { icon: 'user-check', title: 'Human approval gates', text: 'Refunds, spend and off-script replies wait for a person to approve them.' },
  { icon: 'radar', title: 'Tested before launch', text: 'Evaluation sets and red-teaming against prompt injection, data leakage and made-up answers.' },
];

/** Capability, not partnership: names are shown as text, with no logos (no licence needed, no implied endorsement).
 * Owner (2026-11-19): "use all the latest tech stack, our team knows everything". */
export const stack: { group: string; items: string[] }[] = [
  { group: 'AI and agents', items: ['Claude', 'OpenAI GPT', 'Gemini', 'Llama', 'Mistral', 'DeepSeek', 'LangChain', 'LangGraph', 'LlamaIndex', 'CrewAI', 'OpenAI Agents SDK', 'Model Context Protocol', 'RAG', 'pgvector', 'Pinecone', 'Hugging Face', 'Whisper', 'ElevenLabs'] },
  { group: 'Frontend', items: ['React', 'Next.js', 'Angular', 'Vue', 'Nuxt', 'Svelte', 'Astro', 'TypeScript', 'Tailwind CSS'] },
  { group: 'Backend', items: ['Node.js', 'NestJS', 'Express', 'Python', 'FastAPI', 'Django', 'Laravel', 'Go', 'GraphQL'] },
  { group: 'Mobile', items: ['React Native', 'Expo', 'Flutter', 'Ionic', 'Swift and SwiftUI', 'Kotlin and Jetpack Compose', 'ARKit'] },
  { group: 'Data and cloud', items: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Supabase', 'Firebase', 'AWS', 'Google Cloud', 'Azure', 'Vercel', 'Docker', 'Kubernetes', 'Terraform'] },
  { group: 'Automation and integrations', items: ['n8n', 'Make', 'Zapier', 'Twilio', 'WhatsApp Business Platform', 'Stripe', 'HubSpot', 'Salesforce', 'Shopify'] },
  { group: 'Vision and hardware', items: ['OpenCV', 'PyTorch', 'TensorFlow', 'YOLO', 'MediaPipe', 'ROS', 'NVIDIA Jetson', 'Raspberry Pi', 'FPGA', 'Embedded Linux'] },
];

// Confirmed by the owner 2026-11-19 (D22). Change the wording only with the owner's OK: these are commitments.
export const guarantees: { icon: IconName; title: string; text: string }[] = [
  { icon: 'file-signature', title: 'NDA from the first call', text: 'Signed on request, before you share anything sensitive.' },
  { icon: 'key-round', title: 'You own 100% of the code and IP', text: 'Full IP assignment on payment, written into the contract. The repository is yours, so there is no lock-in.' },
  { icon: 'wallet', title: 'Fixed price or monthly, by milestone', text: 'You pay for agreed milestones you can see working, not for open-ended hours.' },
  { icon: 'clock', title: 'Hours that overlap yours', text: 'Live working hours with the US, UK, Europe, the Gulf and Australia, and one named lead for your project.' },
  { icon: 'presentation', title: 'Weekly demos', text: 'Working software every week, not a status report.' },
  { icon: 'life-buoy', title: '30 days of post-launch support', text: 'Fixes and tuning after go-live are included, then an optional monthly plan.' },
];

export const faqs: FaqItem[] = [
  {
    q: 'How much does an AI agent cost?',
    a: `Packaged agents start from ${money(agentPrices['ai-reputation-agent']!.setup)} setup, and most cost ${money(1500)} to ${money(3500)} to set up plus ${money(299)} to ${money(499)} a month for hosting, monitoring and improvements. Custom agents start from ${money(8000)} and an AI MVP from ${money(12000)}, fixed price. Not sure yet? The ${audit.name} is ${money(audit.price)} and is credited in full if you go ahead. Book a call and you get a written quote within 24 hours.`,
  },
  {
    q: 'How fast can we go live?',
    a: 'Packaged agents usually go live in about two weeks: a few days to scope and connect your tools, then testing on real scenarios. An AI MVP takes 6 to 8 weeks. Larger apps and platforms are planned in milestones, and we agree the timeline before we start.',
  },
  {
    q: 'What if the AI gets something wrong?',
    a: 'Every agent works inside guardrails. It only uses the tools and data you allow, it answers from your approved sources, and anything risky (refunds, discounts, off-script answers) goes to a person for approval. We test it against an evaluation set before launch, and every action is written to an audit log you can review.',
  },
  {
    q: 'Is our data safe? Will it be used to train AI models?',
    a: 'We use the business APIs of model providers, which do not train on your data by default, and we send only the data a task needs. For sensitive work we deploy in your own cloud, on-premises or fully air-gapped with open models. We sign an NDA before you share anything.',
  },
  {
    q: 'Who owns the code and the agent?',
    a: 'You do. The contract assigns 100% of the code, prompts, configuration and IP to you on payment. You get the repository and the credentials, so you are never locked in to us.',
  },
  {
    q: 'You are an offshore team. How does that work day to day?',
    a: `Since ${site.facts.foundingYear} our team has delivered ${site.facts.projectsDelivered}+ projects for clients in ${site.facts.countriesServed} countries, including the USA, the UK, Germany, Switzerland, Australia and the UAE. Our ${site.facts.teamSize}-person team is based in Rawalpindi, Pakistan, with working hours that overlap the US, UK, Europe, the Gulf and Australia. You get one named project lead, a shared channel, weekly demos and milestone payments, so you see progress before you pay for it. Hours, prices and local rules for your country: <a href="/locations/">where we work</a>.`,
  },
  {
    q: 'Will it work with the tools we already use?',
    a: 'Almost certainly. We connect agents to calendars, CRMs, help desks, WhatsApp, phone lines, email, spreadsheets and ERPs through their APIs, and we build a secure MCP connector or custom integration where none exists. If a tool has no way in, we tell you on the first call.',
  },
  {
    q: 'Do you only build AI, or apps and software too?',
    a: 'Both. Alongside agents we design and build SaaS products, web platforms, iOS and Android apps, computer vision and embedded systems. Many projects combine them, for example a customer app with an agent inside it.',
  },
];
