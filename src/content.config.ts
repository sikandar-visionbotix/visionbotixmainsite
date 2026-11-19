/**
 * Content collections: typed data for every templated page (PLAN.md §9).
 * Each collection lives in src/content/<name>/. Files starting with "_" are ignored, so each folder has a
 * documented `_template.*` to copy. Adding an agent, service, country… is just adding a file.
 *
 * Truth policy built into the schemas (CLAUDE.md):
 *  - prices never live in content files: `src/data/pricing.ts` is the single source (D23, D27, D32);
 *  - case studies are anonymous (no client names or links) and mocks can't reach production (see `work`);
 *  - every outcome needs a `source`;
 *  - there is deliberately no testimonial/rating/review field anywhere (decision D12).
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { iconNames } from '@/lib/icons';
import { services as serviceList, industries as industryList, products as productList, engagements } from '@/data/catalogue';
import { bundles as bundleList, localCurrencies } from '@/data/pricing';
import { tagSlugs, authorSlugs } from '@/data/resources';

const md = (base: string) => glob({ base: `./src/content/${base}`, pattern: '**/[^_]*.md' });

/* ---------- shared pieces ---------- */
const faq = z.array(z.object({ q: z.string().min(8), a: z.string().min(20) })).default([]);

const seo = z.object({
  /** ≤ 60 chars incl. " | Visionbotix"; primary keyword first. */
  title: z.string().max(60),
  /** 70–155 chars, answer-first. */
  description: z.string().min(70).max(155),
});

const keywords = z.object({
  primary: z.string(),
  secondary: z.array(z.string()).default([]),
});

const titled = z.object({ title: z.string(), body: z.string() });

/** Catalogue slugs (src/data/catalogue.ts) for links to pages built in later sprints. */
const serviceSlugs = serviceList.map((x) => x.slug) as [string, ...string[]];
const industrySlugs = industryList.map((x) => x.slug) as [string, ...string[]];
const productSlugs = productList.map((x) => x.slug) as [string, ...string[]];

const base = z.object({
  seo,
  keywords,
  /** 40–60 word answer-first intro shown under the H1 (GEO: this is what AI answers quote). */
  summary: z.string().min(120).max(480),
  updated: z.coerce.date(),
  draft: z.boolean().default(false),
  order: z.number().default(100),
  faq,
});

/* ---------- agents (S3) ----------
 * Prices are NOT stored here: `src/data/pricing.ts` is the single price source (D23, D27), keyed by the file slug.
 * Related services are collection references (S4). Related industries stay catalogue slugs until S8 fills that
 * collection (D30), validated against `src/data/catalogue.ts`. */
const icon = z.enum(iconNames);

/** One line of the scripted "See it work" preview (D19). Kept short: it has to read at a glance. */
const demoLine = z.discriminatedUnion('kind', [
  /** A message from the customer / lead / user. `who` = channel and time, e.g. "WhatsApp · 21:47". */
  z.object({ kind: z.literal('in'), who: z.string().max(40), text: z.string().max(140), wait: z.number().optional() }),
  /** The agent's reply (shown with a typing state first). */
  z.object({ kind: z.literal('out'), who: z.string().max(40).default('Agent'), text: z.string().max(160), wait: z.number().optional() }),
  /** What the agent understood, e.g. label "intent", text "new booking · new patient". */
  z.object({ kind: z.literal('sys'), icon: icon.default('sparkles'), label: z.string().max(24), text: z.string().max(90), wait: z.number().optional() }),
  /** Tool calls, e.g. calendar.find_slots("Sat AM"), with an optional short result. */
  z.object({ kind: z.literal('tool'), icon: icon.default('terminal'), calls: z.array(z.string().max(60)).min(1).max(2), result: z.string().max(40).optional(), wait: z.number().optional() }),
  /** A human approval gate: the agent pauses until a person approves. */
  z.object({ kind: z.literal('gate'), icon: icon.default('user-check'), text: z.string().max(110), wait: z.number().optional() }),
  /** Closing summary line. */
  z.object({ kind: z.literal('done'), icon: icon.default('badge-check'), text: z.string().max(110), wait: z.number().optional() }),
]);

const agents = defineCollection({
  loader: md('agents'),
  schema: base.extend({
    name: z.string(),
    /** Card line (hub, related cards); mirrors `line` in catalogue.ts. */
    tagline: z.string().max(90),
    /** The H1. Must contain the primary keyword. */
    h1: z.string().min(20).max(80),
    group: z.enum(['answer', 'sell', 'market', 'operate', 'secure-build']),
    icon,
    verbs: z.array(z.string()).min(3).max(6),
    /** Who it is for, as short chips ("Dental and medical clinics"). */
    bestFor: z.array(z.string()).min(3).max(6),
    /** The pain it removes: 3–4 plain sentences, no invented statistics. */
    problem: z.array(z.string().min(30)).min(3).max(4),
    /** What it does: 4–6 capability cards. */
    does: z.array(titled).min(4).max(6),
    dayInLife: z.array(z.object({ time: z.string(), step: z.string() })).min(4).max(7),
    useCases: z.array(titled).min(3).max(6),
    integrations: z.array(z.string()).min(4),
    controls: z.array(z.string()).min(3),
    security: z.array(z.string()).min(3),
    setup: z.array(titled).length(4),
    timeline: z.string().default('Live in about 2 weeks'),
    /** What the price includes. */
    includes: z.array(z.string()).min(4).max(8),
    demo: z.object({
      /** Console title, e.g. "Receptionist agent". */
      title: z.string().max(32),
      /** Status under the title, e.g. "Live · after hours". */
      status: z.string().max(32),
      icon: icon.optional(),
      tools: z.array(z.object({ icon, label: z.string().max(14) })).min(1).max(3),
      lines: z.array(demoLine).min(5).max(9),
      /** Must say it is scripted and the business is fictional. */
      caption: z.string().regex(/^Scripted demo · /, 'Caption must start with "Scripted demo · " (honest labelling, D19/D21).'),
    }),
    related: z
      .object({
        agents: z.array(reference('agents')).max(3).default([]),
        services: z.array(reference('services')).max(3).default([]),
        industries: z.array(z.enum(industrySlugs)).max(4).default([]),
      })
      .default({ agents: [], services: [], industries: [] }),
  }),
});

/* ---------- services (S4) ----------
 * Read through `getServices()` (src/lib/services.ts), which keeps the collection, the menu catalogue and the price list
 * in step. Prices live only in `src/data/pricing.ts` → `servicePrices` (D27, D32). Related case studies are not listed
 * here: the page picks them from each case study's own `services` field, through the `getWork()` launch gate. */
const services = defineCollection({
  loader: md('services'),
  schema: base
    .extend({
      seo: seo.extend({
        /** ≤ 46 chars: " | Visionbotix" is appended (total ≤ 60). Must contain the primary keyword. */
        title: z.string().max(46),
      }),
      /** Must equal the catalogue name (menus). */
      name: z.string(),
      /** Card line on the hub and in menus. */
      tagline: z.string().min(30).max(90),
      /** The H1, outcome-led. */
      h1: z.string().min(20).max(80),
      pillar: z.enum(['ai', 'software', 'deeptech']),
      icon,
      /** Who it is for, as short chips. */
      bestFor: z.array(z.string().max(40)).min(3).max(6),
      /** The pain it removes: 3–4 plain sentences, no invented statistics. */
      problem: z.array(z.string().min(30)).min(3).max(4),
      /** What we build: 4–8 offering cards. */
      offerings: z.array(titled).min(4).max(8),
      /** How an engagement runs: exactly 4 steps; `meta` = when, e.g. "Week 1". */
      process: z.array(titled.extend({ meta: z.string().max(24).optional() })).length(4),
      /** Typical timeline, e.g. "First release in 6–10 weeks". */
      timeline: z.string().min(8).max(48),
      /** Tools and tech, as text (no logos, no partnership claims). */
      stack: z.array(z.string()).min(4).max(16),
      /** Quality and security practices specific to this service. */
      quality: z.array(z.string().min(20)).min(3).max(5),
      engagement: z.array(z.enum(engagements)).min(1).max(4),
      /** What the price includes. */
      includes: z.array(z.string()).min(4).max(8),
      faq: z.array(z.object({ q: z.string().min(8), a: z.string().min(20) })).min(5).max(8),
      related: z.object({
        /** Packaged agents to cross-sell (1–4). */
        agents: z.array(reference('agents')).min(1).max(4),
        services: z.array(reference('services')).max(3).default([]),
        industries: z.array(z.enum(industrySlugs)).max(4).default([]),
        /** Our own products (deep tech and security pages). */
        products: z.array(z.enum(productSlugs)).max(3).default([]),
      }),
    })
    .refine((d) => d.seo.title.toLowerCase().includes(d.keywords.primary.toLowerCase()), {
      message: 'seo.title must contain keywords.primary (the title is the strongest on-page signal).',
      path: ['seo', 'title'],
    }),
});

/* ---------- industries (S8) ----------
 * Read through `getIndustries()` (src/lib/industries.ts), which keeps the collection and the menu catalogue in step.
 * No prices here: the page prices its recommended agents and bundle from `src/data/pricing.ts` (D23, D27).
 * Compliance entries name the rules a buyer in the sector must meet and what we put in place; they never claim a
 * certification or that a client is "compliant" because of us. Case studies attach themselves through `work.industries`. */
const bundleSlugs = bundleList.map((b) => b.slug) as [string, ...string[]];

const industries = defineCollection({
  loader: md('industries'),
  schema: base
    .extend({
      seo: seo.extend({
        /** ≤ 46 chars: " | Visionbotix" is appended (total ≤ 60). Must contain the primary keyword. */
        title: z.string().max(46),
      }),
      /** Must equal the catalogue name (menus, chips). */
      name: z.string(),
      /** Plural noun phrase for generated copy: "AI agents for <who>" (e.g. "dental clinics", "law firms", "online stores"). */
      who: z.string().min(4).max(40).regex(/^[a-z]/, 'Lower-case start: it is used mid-sentence.'),
      /** Card line on the hub. */
      tagline: z.string().min(30).max(90),
      /** The H1, outcome-led, with the primary keyword or a close variant. */
      h1: z.string().min(20).max(80),
      icon,
      /** Who in the sector it is for, as short chips ("Group practices"). */
      bestFor: z.array(z.string().max(40)).min(3).max(6),
      /** The pain: 3–4 plain sentences, no invented statistics. */
      problem: z.array(z.string().min(30)).min(3).max(4),
      /** Recommended AI team: 2–4 agents, lead agent first (its live demo is linked from the hero). */
      agents: z.array(reference('agents')).min(2).max(4),
      /** A bundle from pricing.ts whose agents are all in `agents`. */
      bundle: z.enum(bundleSlugs).optional(),
      /** 4–6 jobs the agents do in this sector; `agent` = which recommended agent handles it. */
      useCases: z.array(titled.extend({ agent: reference('agents').optional() })).min(4).max(6),
      /** A day (or week) with the AI team on shift: 4–7 moments; `agent` = who acted. */
      dayInLife: z.array(z.object({ time: z.string().max(14), step: z.string().min(30).max(220), agent: reference('agents').optional() })).min(4).max(7),
      /** Rules buyers in the sector work under, and what we put in place for each. No certification claims. */
      compliance: z
        .array(z.object({ name: z.string().max(36), region: z.string().max(24), body: z.string().min(40).max(280) }))
        .min(2)
        .max(5),
      /** Sector-specific approvals and data controls (3–5). */
      controls: z.array(z.string().min(20).max(200)).min(3).max(5),
      /** Systems the agents connect to in this sector, as text (no logos, no partnership claims). */
      systems: z.array(z.string()).min(4).max(14),
      /** Custom builds for the sector (1–4 services). */
      services: z.array(reference('services')).min(1).max(4),
      /** Our own products relevant to the sector. */
      products: z.array(z.enum(productSlugs)).max(3).default([]),
      /** Neighbouring industries (catalogue slugs). */
      relatedIndustries: z.array(z.enum(industrySlugs)).max(4).default([]),
      faq: z.array(z.object({ q: z.string().min(8), a: z.string().min(20) })).min(5).max(8),
    })
    .refine((d) => d.seo.title.toLowerCase().includes(d.keywords.primary.toLowerCase()), {
      message: 'seo.title must contain keywords.primary (the title is the strongest on-page signal).',
      path: ['seo', 'title'],
    })
    .refine((d) => !d.bundle || bundleList.find((b) => b.slug === d.bundle)!.agents.every((a) => d.agents.some((r) => r.id === a)), {
      message: 'Every agent in the bundle must be listed in `agents` (the page shows the bundle as the recommended team).',
      path: ['bundle'],
    })
    .refine((d) => [...d.useCases, ...d.dayInLife].every((x) => !x.agent || d.agents.some((r) => r.id === x.agent!.id)), {
      message: 'useCases[].agent and dayInLife[].agent must be one of the recommended `agents`.',
      path: ['useCases'],
    }),
});

/* ---------- locations (S9) ----------
 * Country pages, read through `getLocations()` (src/lib/locations.ts), which keeps the collection and the catalogue in
 * step. Genuinely local substance only (PLAN §6.2, no doorway pages): time-zone overlap computed from `zones` + `shift`,
 * prices converted from pricing.ts into the local currency (never typed here), the country's own rules, contracts and
 * data-transfer route, and local angles on agents and industries. "Delivered for clients in X" is shown only when the
 * country is in `site.deliveredInCodes` (owner-confirmed). No offices abroad are implied: we work from Rawalpindi. */
const locations = defineCollection({
  loader: md('locations'),
  schema: base
    .extend({
      seo: seo.extend({
        /** ≤ 46 chars: " | Visionbotix" is appended (total ≤ 60). Must contain the primary keyword. */
        title: z.string().max(46),
      }),
      /** Short name, must equal the catalogue name ("UK", "Saudi Arabia"). */
      name: z.string(),
      /** Full country name ("United Kingdom"). */
      country: z.string(),
      /** The country in a sentence: "the UK", "Australia". */
      inName: z.string().min(2).max(24),
      /** Plural noun phrase for generated copy, e.g. "UK businesses", "Saudi companies". */
      who: z.string().min(6).max(32),
      /** ISO 3166-1 alpha-2, must equal the catalogue code. */
      code: z.string().length(2),
      currency: z.enum(localCurrencies),
      /** UK, AU and PK pages use UK spelling (D65); the checker enforces it. */
      spelling: z.enum(['us', 'uk']).default('us'),
      /** <html lang> for the page, e.g. en-GB. */
      lang: z.string().regex(/^en(-[A-Z]{2})?$/).default('en'),
      /** Card line on the hub. */
      tagline: z.string().min(30).max(90),
      h1: z.string().min(20).max(80),
      /** Main business cities and their UTC offset in the season with the LEAST overlap (the honest worst case). */
      zones: z.array(z.object({ city: z.string().max(20), abbr: z.string().max(6), offset: z.number().min(-12).max(14) })).min(1).max(3),
      /** Our project shift in PKT hours [start, end]; end < start means past midnight. */
      shift: z.tuple([z.number().int().min(0).max(23), z.number().int().min(0).max(23)]),
      /** The client's working day, local hours. */
      workday: z.tuple([z.number().int(), z.number().int()]).default([9, 17]),
      /** Daylight saving and working-week notes (e.g. Sunday to Thursday). */
      overlapNote: z.string().min(30).max(240),
      /** Why companies in this country work with us: local reasons, 3–4. */
      why: z.array(z.object({ title: z.string().max(60), body: z.string().min(60).max(260) })).min(3).max(4),
      /** Agents with the most local demand, lead first, each with its local angle. */
      popular: z.array(z.object({ agent: reference('agents'), body: z.string().min(60).max(240) })).min(3).max(4),
      /** Local rules and what we put in place. No certification or "compliant" claims. */
      compliance: z.array(z.object({ name: z.string().max(40), scope: z.string().max(24), body: z.string().min(40).max(280) })).min(3).max(5),
      /** Contracts, data transfers, hosting region and invoices for this country. */
      contracts: z.array(z.object({ title: z.string().max(48), body: z.string().min(40).max(280) })).min(3).max(5),
      /** Sectors with local demand and the local angle. */
      industries: z.array(z.object({ industry: reference('industries'), body: z.string().min(60).max(240) })).min(3).max(4),
      /** Custom builds most asked for here. */
      services: z.array(reference('services')).min(2).max(4),
      faq: z.array(z.object({ q: z.string().min(8), a: z.string().min(20) })).min(5).max(8),
    })
    .refine((d) => d.seo.title.toLowerCase().includes(d.keywords.primary.toLowerCase()), {
      message: 'seo.title must contain keywords.primary (the title is the strongest on-page signal).',
      path: ['seo', 'title'],
    }),
});

/* ---------- work / case studies ----------
 * ANONYMOUS BY DESIGN (owner, 2026-11-19): clients must not be named or linked. There is no client-name field and
 * links are only allowed for our own products. Content files live in a GitHub repo, so never write a client's
 * name, URL or identifying detail anywhere in them, not even in comments.
 *
 * Mock vs verified: `verified: false` entries are pre-launch mocks (adapted from icasta.com, YouTube or owner notes).
 * They render on previews with noindex, and a production build (VERCEL_ENV=production or SITE_LAUNCH=1) refuses
 * to ship any published entry that is still unverified. The owner flips `verified: true` after checking the facts. */
const isProductionBuild = process.env.VERCEL_ENV === 'production' || process.env.SITE_LAUNCH === '1';

const work = defineCollection({
  loader: md('work'),
  schema: ({ image }) =>
    base
      .extend({
        /** Descriptive title, never a client or product brand name. */
        title: z.string(),
        /** Anonymous description of the client, e.g. "A multi-vendor marketplace operator". */
        clientType: z.string(),
        sector: z.string(),
        region: z.enum(['Global', 'North America', 'Europe', 'UK', 'GCC', 'South Asia', 'Asia Pacific']).default('Global'),
        kind: z
          .array(z.enum(['web', 'ios', 'android', 'desktop', 'ai', 'computer-vision', 'marketplace', 'hardware', 'saas', 'iot', 'robotics', 'automation']))
          .min(1),
        year: z.number().int().min(2015).max(2100).optional(),
        /** Our own product (not client work): only then are public links allowed. */
        ownProduct: z.boolean().default(false),
        links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
        challenge: z.string().min(60),
        approach: z.string().min(60),
        built: z.array(z.string()).min(3),
        highlights: z.array(z.string()).default([]),
        stack: z.array(z.string()).default([]),
        /** Only measured, owner-supplied outcomes, each with a source. */
        outcomes: z.array(z.object({ label: z.string(), value: z.string(), source: z.string().min(3) })).default([]),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        /** Illustration used when there is no screenshot (anonymous by design). */
        art: z.enum(['marketplace', 'mobile', 'vision', 'agent', 'dashboard', 'robot', 'health', 'kiosk', 'farm', 'security']).default('dashboard'),
        services: z.array(z.enum(serviceSlugs)).min(1),
        /** Industry pages that show this case study (S8). */
        industries: z.array(z.enum(industrySlugs)).max(3).default([]),
        featured: z.boolean().default(false),
        /** Owner has checked every fact on this page. false = pre-launch mock. */
        verified: z.boolean().default(false),
        /** Where the mock text came from (internal provenance, not rendered). */
        provenance: z.enum(['owner', 'icasta', 'youtube', 'app-store', 'visionbotix-site']),
      })
      .refine((d) => d.ownProduct || d.links.length === 0, {
        message: 'Client work must not link to the client (owner rule). Links are only allowed when ownProduct: true.',
        path: ['links'],
      })
      .refine((d) => !(isProductionBuild && !d.draft && !d.verified), {
        message: 'Unverified mock case study in a production build. The owner must check it and set verified: true, or set draft: true.',
        path: ['verified'],
      }),
});

/* ---------- products (S5) ----------
 * Our own products only (D18 does not apply: we may name and link them). Security products are sanitised per
 * CLAUDE.md: generic sectors only ("defense, government, enterprise"), no named agencies, countries or programmes.
 * No prices (quoted per deployment) and no customer counts, ratings or usage numbers unless the owner supplies them. */
const products = defineCollection({
  loader: md('products'),
  schema: ({ image }) =>
    base.extend({
      name: z.string(),
      /** ≤ 46 chars so " | Visionbotix" fits in 60. */
      seo: seo.extend({ title: z.string().max(46) }),
      /** H1: the product's job in plain words, with the primary keyword. */
      h1: z.string().min(20).max(90),
      tagline: z.string().max(90),
      category: z.enum(['security-hardware', 'security-software', 'training', 'platform', 'app']),
      icon,
      /** Old URL that must keep working, e.g. "/ip-encryptor.html" (the 301 lives in vercel.json). */
      legacyPath: z.string().startsWith('/').optional(),
      /** Live product site, e.g. https://www.wakeel.com.pk (own products only). */
      externalUrl: z.url().optional(),
      /** 3–4 short hero bullets. */
      highlights: z.array(z.string().max(70)).min(3).max(4),
      /** The problem it solves, 2–4 short paragraphs-as-bullets. */
      problem: z.array(z.string()).min(2).max(4),
      features: z.array(titled.extend({ icon: icon.optional() })).min(4).max(8),
      /** How it works / how it is deployed: exactly 4 steps. */
      steps: z.array(titled).length(4),
      specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
      useCases: z.array(titled).min(3).max(6),
      /** Generic audiences only (no named organisations). */
      audience: z.array(z.string()).min(2).max(8),
      /** Primary CTA: what a buyer asks for (e.g. "Request a technical briefing"). */
      cta: z.object({ label: z.string().max(40), text: z.string().max(200) }),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      gallery: z.array(z.object({ src: image(), alt: z.string() })).max(4).default([]),
      related: z
        .object({
          services: z.array(reference('services')).max(4).default([]),
          agents: z.array(reference('agents')).max(3).default([]),
        })
        .default({ services: [], agents: [] }),
    }),
});

/* ---------- posts (S10) ----------
 * /resources/<slug>/, read through `getPosts()` (src/lib/posts.ts). Truth rules on top of the shared ones:
 *  - our own prices are price tokens ({{price:ai-receptionist}}, src/lib/tokens.ts), never typed;
 *  - every market figure (someone else's price, rate or statistic) sits in a paragraph, list item or table row that
 *    links its source, and the source is listed in `sources` (scripts/check-posts.mjs enforces both);
 *  - the author is a real person from src/data/resources.ts; no invented experience, clients or outcomes.
 * `related` names the money pages the post sells into; the post must also link them in its body, and those pages
 * link back ("Guides on this topic", RelatedReading). */
const posts = defineCollection({
  loader: md('posts'),
  schema: base
    .omit({ order: true })
    .extend({
      seo: seo.extend({
        /** ≤ 46 chars: " | Visionbotix" is appended (total ≤ 60). Must contain the primary keyword. */
        title: z.string().max(46),
      }),
      /** The H1: the question or promise, in full. */
      title: z.string().min(20).max(90),
      /** Card line on the hub, tag and author pages. */
      excerpt: z.string().min(60).max(170),
      format: z.enum(['guide', 'cost-guide', 'comparison', 'explainer', 'glossary']),
      pubDate: z.coerce.date(),
      author: z.enum(authorSlugs),
      tags: z.array(z.enum(tagSlugs)).min(1).max(3),
      featured: z.boolean().default(false),
      /** External sources for every market figure in the post (name, publisher, URL). */
      sources: z.array(z.object({ title: z.string().min(4), publisher: z.string().min(2), url: z.url() })).max(20).default([]),
      /** Glossary posts: the terms, shown A–Z with anchors and emitted as a DefinedTermSet. */
      terms: z
        .array(z.object({ term: z.string().max(48), definition: z.string().min(60).max(420), link: z.string().startsWith('/').optional() }))
        .default([]),
      faq: z.array(z.object({ q: z.string().min(8), a: z.string().min(20) })).min(3).max(7),
      related: z.object({
        agents: z.array(reference('agents')).max(4).default([]),
        services: z.array(reference('services')).max(3).default([]),
        industries: z.array(reference('industries')).max(3).default([]),
        locations: z.array(reference('locations')).max(3).default([]),
      }),
    })
    .refine((d) => d.seo.title.toLowerCase().includes(d.keywords.primary.toLowerCase()), {
      message: 'seo.title must contain keywords.primary (the title is the strongest on-page signal).',
      path: ['seo', 'title'],
    })
    .refine((d) => d.related.agents.length + d.related.services.length + d.related.industries.length + d.related.locations.length >= 2, {
      message: 'A post must sell into at least 2 money pages (related agents, services, industries or locations).',
      path: ['related'],
    })
    .refine((d) => (d.format === 'glossary') === d.terms.length > 0, {
      message: 'Glossary posts need `terms`; other formats must not have them.',
      path: ['terms'],
    }),
});

/* ---------- faqs (shared Q&A sets, e.g. pricing, process, security) ---------- */
const faqs = defineCollection({
  loader: glob({ base: './src/content/faqs', pattern: '**/[^_]*.{yaml,yml,json}' }),
  schema: z.object({
    topic: z.string(),
    items: z.array(z.object({ q: z.string(), a: z.string() })).min(1),
  }),
});

/* ---------- legal pages (S5): /privacy/, /terms/ ---------- */
const legal = defineCollection({
  loader: md('legal'),
  schema: z.object({
    title: z.string(),
    description: z.string().min(70).max(155),
    updated: z.coerce.date(),
    summary: z.string(),
  }),
});

export const collections = { agents, services, industries, locations, work, products, posts, faqs, legal };
