/**
 * /services/ hub copy and the shared "ways to work with us" blocks (S4). Services themselves come from
 * `src/content/services/` via getServices(); every price comes from pricing.ts (D27, D32).
 * Truth rules (CLAUDE.md): capability and process claims only; no statistics, clients or testimonials.
 */
import type { IconName } from '@/lib/icons';
import type { FaqItem } from '@/lib/schema';
import type { Engagement } from '@/data/catalogue';
import { site } from '@/data/site';
import { agentPrices, audit, hourlyFrom, money, projectFrom, projects, teamRates } from '@/data/pricing';

const minProject = Math.min(...projects.map((p) => p.from));
const minMonthlyAgent = Math.min(...Object.values(agentPrices).flatMap((p) => (p.monthly ? [p.monthly] : [])));
const minTeam = Math.min(...teamRates.map((r) => r.monthly));
const maxTeam = Math.max(...teamRates.map((r) => r.monthly));

export const servicesHero = {
  title: 'Software, apps and AI, built by one team.',
  accent: 'built by one team.',
  lead:
    'Visionbotix designs and builds custom AI agents, web and mobile apps, SaaS products, computer vision and embedded systems. One team takes your idea from scope to launch, with a fixed price per milestone, weekly demos and full ownership of the code. Our engineers work hours that overlap the US, UK, Europe, the Gulf and Australia.',
  points: ['Fixed price per milestone', 'Weekly demos', 'You own 100% of the code'],
};

/** Ways to work with us. Prices are computed from pricing.ts. */
export const engagementCopy: Record<Engagement, { name: string; icon: IconName; text: string; price: string }> = {
  'fixed-scope': {
    name: 'Fixed-scope project',
    icon: 'clipboard-check',
    text: 'An agreed scope and a fixed price, paid by milestone. You see working software at every weekly demo before you pay for the next stage.',
    price: `Projects from ${money(minProject)}`,
  },
  'monthly-retainer': {
    name: 'Managed monthly plan',
    icon: 'repeat',
    text: 'We host, monitor and keep improving what we built: agents, automations or apps, with a short report every week.',
    price: `Managed agents from ${money(minMonthlyAgent)}/mo`,
  },
  'dedicated-team': {
    name: 'Dedicated team',
    icon: 'users',
    text: 'Full-time engineers and designers who work inside your team, your tools and your sprint rhythm, led by one named lead.',
    price: `From ${money(minTeam)}/mo per engineer · hourly from ${money(hourlyFrom)}`,
  },
  audit: {
    name: audit.name,
    icon: 'search-check',
    text: `A ${audit.duration.replace(' ', '-')} review of your processes, data and systems that ends in a ranked plan: what to automate or build first and what it will cost.`,
    price: `${money(audit.price)} · credited in full against a build`,
  },
};

/** How a custom project runs (hub). Service pages carry their own four steps. */
export const projectSteps = [
  { title: 'Free scoping call', body: 'Thirty minutes on what you need, who it is for and what it must connect to. A fixed quote follows within 24 hours.', meta: 'Day 0' },
  { title: 'Discovery and design', body: 'User flows, architecture and clickable designs you approve before any code is written.', meta: 'Week 1–2' },
  { title: 'Build in weekly sprints', body: 'Working software at a demo every week. You pay by milestone, only for what you have seen working.', meta: 'Weeks 2+' },
  { title: 'Launch and support', body: 'Release to the stores or the cloud, handover of the code and docs, then 30 days of support included.', meta: 'Launch' },
];

export const hubFaqs: FaqItem[] = [
  {
    q: 'What services does Visionbotix offer?',
    a: 'Three groups. AI agents and automation: custom agents, generative AI and RAG apps, chatbots, voice agents, workflow automation and AI consulting. Software, web and mobile: custom software, web apps, iOS and Android apps, SaaS MVPs, UI/UX design, cloud and DevOps, and dedicated teams. Deep tech and security: computer vision, IoT and embedded systems, and cybersecurity, including our own security products.',
  },
  {
    q: 'How much does a software project cost with you?',
    a: `Fixed-scope projects start from ${money(projectFrom.webApp)} for a website or web app, ${money(projectFrom.mobileApp)} for an iOS and Android app, ${money(projectFrom.customAgent)} for a custom AI agent and ${money(projectFrom.saasMvp)} for a SaaS MVP. Dedicated engineers cost ${money(minTeam)} to ${money(maxTeam)} a month each, and the ${audit.name} is ${money(audit.price)}. Every service page lists its starting price, and you get a fixed quote within 24 hours of a call.`,
  },
  {
    q: 'Fixed price, monthly or dedicated team: which should I choose?',
    a: 'Choose a fixed-scope project when you can describe what you need, such as an MVP or an app. Choose a managed monthly plan when you want us to run and improve what we built. Choose a dedicated team when you have a roadmap and need engineers who work as part of your team for months. If you are unsure, start with a short audit or a scoping call.',
  },
  {
    q: 'Who owns the code and the IP?',
    a: 'You do. The contract assigns 100% of the code, designs, prompts and IP to you on payment, and the repository is yours from day one, so there is no lock-in. We sign an NDA on request before you share anything sensitive.',
  },
  {
    q: 'How do you work with clients in other time zones?',
    a: `Our ${site.facts.teamSize}-person team is based in Rawalpindi, Pakistan, and has delivered ${site.facts.projectsDelivered}+ projects for clients in ${site.facts.countriesServed} countries. We keep working hours that overlap the US, UK, Europe, the Gulf and Australia, give you one named lead and a shared channel, and show you working software at a demo every week.`,
  },
  {
    q: 'Can you take over or extend an existing codebase?',
    a: 'Yes. We start with a short code and architecture review, write down what we found, then fix, extend or modernize the system in small, tested steps. We can also add AI features, such as an agent or a RAG search, to an app that is already live.',
  },
  {
    q: 'What happens after launch?',
    a: 'Every project includes 30 days of post-launch support for fixes and tuning. After that you can move to a managed monthly plan, keep a dedicated engineer, or take the code in-house with full documentation.',
  },
  {
    q: 'Do you build AI into the apps you make?',
    a: 'Often. Many projects combine an app with AI inside it: a customer app with a support agent, a dashboard you can question in plain English, or a document workflow that reads and files paperwork. We design AI features with guardrails, evaluation tests and an audit log from the start.',
  },
];
